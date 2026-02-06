'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Upload, ZoomIn, ZoomOut, Check, X, Loader2, Move } from 'lucide-react'

interface ImageCropUploaderProps {
  currentUrl?: string
  shape?: 'circle' | 'square'
  size?: number
  onUpload: (file: File) => Promise<string>
  label?: string
}

export default function ImageCropUploader({ currentUrl, shape = 'circle', size = 80, onUpload, label = 'Upload Photo' }: ImageCropUploaderProps) {
  const [imageUrl, setImageUrl] = useState(currentUrl || '')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [cropping, setCropping] = useState(false)
  const [uploading, setUploading] = useState(false)

  // Crop state
  const [zoom, setZoom] = useState(1)
  const [panX, setPanX] = useState(0)
  const [panY, setPanY] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)
  const cropBoxRef = useRef<HTMLDivElement>(null)

  // Update displayed image when currentUrl prop changes
  useEffect(() => {
    if (currentUrl) setImageUrl(currentUrl)
  }, [currentUrl])

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setSelectedFile(file)
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    setCropping(true)
    setZoom(1)
    setPanX(0)
    setPanY(0)

    const img = new window.Image()
    img.onload = () => { imgRef.current = img }
    img.src = url
  }

  function handleMouseDown(e: React.MouseEvent) {
    e.preventDefault()
    setDragging(true)
    setDragStart({ x: e.clientX, y: e.clientY })
    setPanStart({ x: panX, y: panY })
  }

  function handleTouchStart(e: React.TouchEvent) {
    if (e.touches.length !== 1) return
    setDragging(true)
    setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY })
    setPanStart({ x: panX, y: panY })
  }

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragging) return
    const dx = e.clientX - dragStart.x
    const dy = e.clientY - dragStart.y
    setPanX(panStart.x + dx)
    setPanY(panStart.y + dy)
  }, [dragging, dragStart, panStart])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!dragging || e.touches.length !== 1) return
    const dx = e.touches[0].clientX - dragStart.x
    const dy = e.touches[0].clientY - dragStart.y
    setPanX(panStart.x + dx)
    setPanY(panStart.y + dy)
  }, [dragging, dragStart, panStart])

  const handleMouseUp = useCallback(() => { setDragging(false) }, [])

  useEffect(() => {
    if (cropping) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      window.addEventListener('touchmove', handleTouchMove, { passive: false })
      window.addEventListener('touchend', handleMouseUp)
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
        window.removeEventListener('touchmove', handleTouchMove)
        window.removeEventListener('touchend', handleMouseUp)
      }
    }
  }, [cropping, handleMouseMove, handleMouseUp, handleTouchMove])

  function handleWheel(e: React.WheelEvent) {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    setZoom(z => Math.max(0.5, Math.min(5, z + delta)))
  }

  async function handleCropConfirm() {
    if (!imgRef.current || !canvasRef.current) return
    setUploading(true)

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const outputSize = 400
    canvas.width = outputSize
    canvas.height = outputSize

    const img = imgRef.current
    const cropViewSize = 240
    const scale = zoom * Math.max(cropViewSize / img.naturalWidth, cropViewSize / img.naturalHeight)

    const drawW = img.naturalWidth * scale
    const drawH = img.naturalHeight * scale
    const drawX = (outputSize - drawW) / 2 + (panX / cropViewSize) * outputSize
    const drawY = (outputSize - drawH) / 2 + (panY / cropViewSize) * outputSize

    if (shape === 'circle') {
      ctx.beginPath()
      ctx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2)
      ctx.closePath()
      ctx.clip()
    }

    ctx.drawImage(img, drawX, drawY, drawW, drawH)

    canvas.toBlob(async (blob) => {
      if (!blob || !selectedFile) { setUploading(false); return }
      const ext = selectedFile.name.split('.').pop() || 'jpg'
      const croppedFile = new File([blob], `cropped.${ext}`, { type: blob.type })

      try {
        const url = await onUpload(croppedFile)
        setImageUrl(url + '?t=' + Date.now())
        setCropping(false)
        setPreviewUrl(null)
        setSelectedFile(null)
      } catch (err: any) {
        alert(`Upload error: ${err.message}`)
      }
      setUploading(false)
    }, 'image/jpeg', 0.9)
  }

  function handleCancel() {
    setCropping(false)
    setPreviewUrl(null)
    setSelectedFile(null)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
  }

  const borderRadius = shape === 'circle' ? '50%' : '8px'

  return (
    <div>
      {/* Hidden canvas for cropping */}
      <canvas ref={canvasRef} className="hidden" />

      {cropping && previewUrl ? (
        <div className="space-y-3">
          <p className="text-sm text-foreground-muted flex items-center gap-1"><Move className="w-3 h-3" /> Drag to reposition, scroll to zoom</p>

          {/* Crop area */}
          <div
            ref={cropBoxRef}
            className="relative w-60 h-60 mx-auto overflow-hidden cursor-grab active:cursor-grabbing border-2 border-accent bg-black"
            style={{ borderRadius }}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            onWheel={handleWheel}
          >
            {previewUrl && imgRef.current && (
              <img
                src={previewUrl}
                alt="Crop preview"
                className="absolute select-none pointer-events-none"
                style={{
                  width: `${imgRef.current.naturalWidth * zoom * Math.max(240 / imgRef.current.naturalWidth, 240 / imgRef.current.naturalHeight)}px`,
                  height: `${imgRef.current.naturalHeight * zoom * Math.max(240 / imgRef.current.naturalWidth, 240 / imgRef.current.naturalHeight)}px`,
                  left: `${(240 - imgRef.current.naturalWidth * zoom * Math.max(240 / imgRef.current.naturalWidth, 240 / imgRef.current.naturalHeight)) / 2 + panX}px`,
                  top: `${(240 - imgRef.current.naturalHeight * zoom * Math.max(240 / imgRef.current.naturalWidth, 240 / imgRef.current.naturalHeight)) / 2 + panY}px`,
                }}
                draggable={false}
              />
            )}
          </div>

          {/* Zoom slider */}
          <div className="flex items-center gap-3 justify-center">
            <ZoomOut className="w-4 h-4 text-foreground-muted" />
            <input
              type="range" min="0.5" max="5" step="0.1" value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-40 accent-accent"
            />
            <ZoomIn className="w-4 h-4 text-foreground-muted" />
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-center">
            <button onClick={handleCropConfirm} disabled={uploading} className="btn btn-primary text-sm">
              {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Check className="w-4 h-4 mr-1" />}
              {uploading ? 'Uploading...' : 'Save'}
            </button>
            <button onClick={handleCancel} disabled={uploading} className="btn btn-ghost text-sm">
              <X className="w-4 h-4 mr-1" /> Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-4">
          <div
            className="flex items-center justify-center overflow-hidden flex-shrink-0 bg-background-tertiary"
            style={{ width: size, height: size, borderRadius }}
          >
            {imageUrl ? (
              <img src={imageUrl} alt="" className="object-cover w-full h-full" style={{ borderRadius }} />
            ) : (
              <Upload className="w-6 h-6 text-foreground-muted" />
            )}
          </div>
          <label className="btn btn-secondary text-xs cursor-pointer">
            <Upload className="w-3 h-3 mr-1" />
            {label}
            <input type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
          </label>
        </div>
      )}
    </div>
  )
}
