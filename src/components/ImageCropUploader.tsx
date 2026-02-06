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
  const dragRef = useRef({ startX: 0, startY: 0, panStartX: 0, panStartY: 0 })

  // Store image natural dimensions in state so renders update properly
  const [natW, setNatW] = useState(0)
  const [natH, setNatH] = useState(0)
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
      setNatW(img.naturalWidth)
      setNatH(img.naturalHeight)
      // Base scale: at zoom=1, image covers the crop box entirely
      const s = Math.max(CROP_SIZE / img.naturalWidth, CROP_SIZE / img.naturalHeight)
      setBaseScale(s)
      setCropping(true)
    }
    img.src = url
  }

  // Computed display dimensions
  const scale = baseScale * zoom
  const dispW = natW * scale
  const dispH = natH * scale

  // Clamp pan so image edges never leave the crop box
  function clampPan(px: number, py: number, w: number, h: number) {
    // Image must cover the entire crop box:
    // left edge of image <= 0 (left edge of crop)
    // right edge of image >= CROP_SIZE
    const minX = CROP_SIZE - w  // right edge at CROP_SIZE when left = CROP_SIZE - w
    const maxX = 0
    const minY = CROP_SIZE - h
    const maxY = 0
    return {
      x: Math.min(maxX, Math.max(minX, px)),
      y: Math.min(maxY, Math.max(minY, py)),
    }
  }

  // Image position: centered + pan offset, clamped
  const centered = clampPan(
    (CROP_SIZE - dispW) / 2 + panX,
    (CROP_SIZE - dispH) / 2 + panY,
    dispW,
    dispH
  )

  function handleMouseDown(e: React.MouseEvent) {
    e.preventDefault()
    setDragging(true)
    dragRef.current = { startX: e.clientX, startY: e.clientY, panStartX: panX, panStartY: panY }
  }

  function handleTouchStart(e: React.TouchEvent) {
    if (e.touches.length !== 1) return
    setDragging(true)
    dragRef.current = { startX: e.touches[0].clientX, startY: e.touches[0].clientY, panStartX: panX, panStartY: panY }
  }

  const handleMove = useCallback((clientX: number, clientY: number) => {
    const d = dragRef.current
    const newPanX = d.panStartX + (clientX - d.startX)
    const newPanY = d.panStartY + (clientY - d.startY)
    setPanX(newPanX)
    setPanY(newPanY)
  }, [])

  const handleEnd = useCallback(() => { setDragging(false) }, [])

  useEffect(() => {
    if (!cropping || !dragging) return
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
  }, [cropping, dragging, handleMove, handleEnd])

  function handleWheel(e: React.WheelEvent) {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.05 : 0.05
    setZoom(z => Math.max(1, Math.min(5, z + delta)))
  }

  function handleZoomChange(newZoom: number) {
    setZoom(newZoom)
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
    const ratio = outputSize / CROP_SIZE

    if (shape === 'circle') {
      ctx.beginPath()
      ctx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2)
      ctx.closePath()
      ctx.clip()
    }

    ctx.drawImage(img, centered.x * ratio, centered.y * ratio, dispW * ratio, dispH * ratio)

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

  return (
    <div>
      <canvas ref={canvasRef} className="hidden" />

      {cropping && previewUrl ? (
        <div className="space-y-3">
          <p className="text-sm text-foreground-muted flex items-center gap-1"><Move className="w-3 h-3" /> Drag to reposition, scroll to zoom</p>

          <div
            className="relative mx-auto overflow-hidden cursor-grab active:cursor-grabbing border-2 border-accent"
            style={{ width: CROP_SIZE, height: CROP_SIZE, borderRadius, background: '#000' }}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            onWheel={handleWheel}
          >
            <img
              src={previewUrl}
              alt="Crop preview"
              className="absolute select-none pointer-events-none"
              style={{
                width: `${dispW}px`,
                height: `${dispH}px`,
                left: `${centered.x}px`,
                top: `${centered.y}px`,
              }}
              draggable={false}
            />
          </div>

          <div className="flex items-center gap-3 justify-center">
            <ZoomOut className="w-4 h-4 text-foreground-muted" />
            <input
              type="range" min="1" max="5" step="0.05" value={zoom}
              onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
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
