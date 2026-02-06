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

const CROP_SIZE = 240

export default function ImageCropUploader({ currentUrl, shape = 'circle', size = 80, onUpload, label = 'Upload Photo' }: ImageCropUploaderProps) {
  const [imageUrl, setImageUrl] = useState(currentUrl || '')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [cropping, setCropping] = useState(false)
  const [uploading, setUploading] = useState(false)

  const [zoom, setZoom] = useState(1)
  const [panX, setPanX] = useState(0)
  const [panY, setPanY] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [baseScale, setBaseScale] = useState(1)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)

  useEffect(() => {
    if (currentUrl) setImageUrl(currentUrl)
  }, [currentUrl])

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setSelectedFile(file)
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    setZoom(1)
    setPanX(0)
    setPanY(0)

    const img = new window.Image()
    img.onload = () => {
      imgRef.current = img
      const s = Math.max(CROP_SIZE / img.naturalWidth, CROP_SIZE / img.naturalHeight)
      setBaseScale(s)
      setCropping(true)
    }
    img.src = url
  }

  function getDims() {
    if (!imgRef.current) return { w: 0, h: 0, x: 0, y: 0 }
    const s = baseScale * zoom
    const w = imgRef.current.naturalWidth * s
    const h = imgRef.current.naturalHeight * s
    const x = (CROP_SIZE - w) / 2 + panX
    const y = (CROP_SIZE - h) / 2 + panY
    return { w, h, x, y }
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

  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!dragging) return
    setPanX(panStart.x + (clientX - dragStart.x))
    setPanY(panStart.y + (clientY - dragStart.y))
  }, [dragging, dragStart, panStart])

  const handleEnd = useCallback(() => { setDragging(false) }, [])

  useEffect(() => {
    if (!cropping) return
    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY)
    const onTouchMove = (e: TouchEvent) => { if (e.touches.length === 1) handleMove(e.touches[0].clientX, e.touches[0].clientY) }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', handleEnd)
    window.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('touchend', handleEnd)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', handleEnd)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', handleEnd)
    }
  }, [cropping, handleMove, handleEnd])

  function handleWheel(e: React.WheelEvent) {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.05 : 0.05
    setZoom(z => Math.max(1, Math.min(5, z + delta)))
  }

  async function handleCropConfirm() {
    if (!imgRef.current || !canvasRef.current) return
    setUploading(true)

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const outputSize = 512
    canvas.width = outputSize
    canvas.height = outputSize

    const img = imgRef.current
    const { w, h, x, y } = getDims()
    const ratio = outputSize / CROP_SIZE

    if (shape === 'circle') {
      ctx.beginPath()
      ctx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2)
      ctx.closePath()
      ctx.clip()
    }

    ctx.drawImage(img, x * ratio, y * ratio, w * ratio, h * ratio)

    canvas.toBlob(async (blob) => {
      if (!blob || !selectedFile) { setUploading(false); return }
      const croppedFile = new File([blob], 'cropped.jpg', { type: 'image/jpeg' })

      try {
        const url = await onUpload(croppedFile)
        setImageUrl(url.includes('?') ? url : url + '?t=' + Date.now())
        setCropping(false)
        setPreviewUrl(null)
        setSelectedFile(null)
      } catch (err: any) {
        alert(`Upload error: ${err.message}`)
      }
      setUploading(false)
    }, 'image/jpeg', 0.92)
  }

  function handleCancel() {
    setCropping(false)
    setPreviewUrl(null)
    setSelectedFile(null)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
  }

  const borderRadius = shape === 'circle' ? '50%' : '8px'
  const dims = getDims()

  return (
    <div>
      <canvas ref={canvasRef} className="hidden" />

      {cropping && previewUrl ? (
        <div className="space-y-3">
          <p className="text-sm text-foreground-muted flex items-center gap-1"><Move className="w-3 h-3" /> Drag to reposition, scroll to zoom</p>

          <div
            className="relative mx-auto overflow-hidden cursor-grab active:cursor-grabbing border-2 border-accent bg-black"
            style={{ width: CROP_SIZE, height: CROP_SIZE, borderRadius }}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            onWheel={handleWheel}
          >
            <img
              src={previewUrl}
              alt="Crop preview"
              className="absolute select-none pointer-events-none"
              style={{ width: dims.w, height: dims.h, left: dims.x, top: dims.y }}
              draggable={false}
            />
          </div>

          <div className="flex items-center gap-3 justify-center">
            <ZoomOut className="w-4 h-4 text-foreground-muted" />
            <input
              type="range" min="1" max="5" step="0.05" value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-40 accent-accent"
            />
            <ZoomIn className="w-4 h-4 text-foreground-muted" />
          </div>

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
