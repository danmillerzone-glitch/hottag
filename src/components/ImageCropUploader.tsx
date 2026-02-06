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

const BOX = 240
const OUT = 512

export default function ImageCropUploader({
  currentUrl, shape = 'circle', size = 80, onUpload, label = 'Upload Photo',
}: ImageCropUploaderProps) {
  const [imageUrl, setImageUrl] = useState(currentUrl || '')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewSrc, setPreviewSrc] = useState<string | null>(null)
  const [cropping, setCropping] = useState(false)
  const [uploading, setUploading] = useState(false)

  const [zoom, setZoom] = useState(1)
  const [offX, setOffX] = useState(0)
  const [offY, setOffY] = useState(0)

  // Natural image dimensions
  const [natW, setNatW] = useState(0)
  const [natH, setNatH] = useState(0)

  const draggingRef = useRef(false)
  const lastPt = useRef({ x: 0, y: 0 })
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imgElRef = useRef<HTMLImageElement | null>(null)

  useEffect(() => { if (currentUrl) setImageUrl(currentUrl) }, [currentUrl])

  // At zoom=1 the image must fully cover the BOX.
  // We figure out the base width that achieves that.
  // If image is landscape (w>h): height is the limiting dim, so baseW = w * (BOX/h)
  // If image is portrait (h>=w): width is the limiting dim, so baseW = BOX (width fills box)
  // Then height auto-maintains aspect ratio.
  let baseW = BOX
  if (natW > 0 && natH > 0) {
    const scaleToFill = Math.max(BOX / natW, BOX / natH)
    baseW = natW * scaleToFill
  }
  const displayW = baseW * zoom
  // Height is derived from aspect ratio — this guarantees no stretch
  const displayH = natW > 0 ? displayW * (natH / natW) : BOX

  // Clamp offsets so image always covers the box
  function clampOff(off: number, dim: number) {
    const slack = (dim - BOX) / 2
    if (slack <= 0) return 0
    return Math.max(-slack, Math.min(slack, off))
  }
  const cx = clampOff(offX, displayW)
  const cy = clampOff(offY, displayH)

  // Final position of image top-left
  const imgLeft = (BOX - displayW) / 2 + cx
  const imgTop = (BOX - displayH) / 2 + cy

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setSelectedFile(file)
    const url = URL.createObjectURL(file)
    setPreviewSrc(url)
    setZoom(1)
    setOffX(0)
    setOffY(0)

    const img = new window.Image()
    img.onload = () => {
      imgElRef.current = img
      setNatW(img.naturalWidth)
      setNatH(img.naturalHeight)
      setCropping(true)
    }
    img.src = url
  }

  function ptrDown(cx: number, cy: number) {
    draggingRef.current = true
    lastPt.current = { x: cx, y: cy }
  }

  const ptrMove = useCallback((cx: number, cy: number) => {
    if (!draggingRef.current) return
    const dx = cx - lastPt.current.x
    const dy = cy - lastPt.current.y
    lastPt.current = { x: cx, y: cy }
    setOffX(p => p + dx)
    setOffY(p => p + dy)
  }, [])

  const ptrUp = useCallback(() => { draggingRef.current = false }, [])

  useEffect(() => {
    if (!cropping) return
    const mm = (e: MouseEvent) => ptrMove(e.clientX, e.clientY)
    const tm = (e: TouchEvent) => {
      if (e.touches.length === 1) { e.preventDefault(); ptrMove(e.touches[0].clientX, e.touches[0].clientY) }
    }
    window.addEventListener('mousemove', mm)
    window.addEventListener('mouseup', ptrUp)
    window.addEventListener('touchmove', tm, { passive: false })
    window.addEventListener('touchend', ptrUp)
    return () => {
      window.removeEventListener('mousemove', mm)
      window.removeEventListener('mouseup', ptrUp)
      window.removeEventListener('touchmove', tm)
      window.removeEventListener('touchend', ptrUp)
    }
  }, [cropping, ptrMove, ptrUp])

  function handleWheel(e: React.WheelEvent) {
    e.preventDefault()
    setZoom(z => Math.max(1, Math.min(5, z + (e.deltaY > 0 ? -0.05 : 0.05))))
  }

  async function handleCropConfirm() {
    if (!imgElRef.current || !canvasRef.current) return
    setUploading(true)

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')!
    canvas.width = OUT
    canvas.height = OUT

    const r = OUT / BOX
    if (shape === 'circle') {
      ctx.beginPath()
      ctx.arc(OUT / 2, OUT / 2, OUT / 2, 0, Math.PI * 2)
      ctx.clip()
    }

    ctx.drawImage(imgElRef.current, imgLeft * r, imgTop * r, displayW * r, displayH * r)

    canvas.toBlob(async (blob) => {
      if (!blob) { setUploading(false); return }
      try {
        const url = await onUpload(new File([blob], 'cropped.jpg', { type: 'image/jpeg' }))
        setImageUrl(url.includes('?') ? url : `${url}?t=${Date.now()}`)
        setCropping(false)
        setPreviewSrc(null)
        setSelectedFile(null)
      } catch (err: any) { alert(`Upload error: ${err.message}`) }
      setUploading(false)
    }, 'image/jpeg', 0.92)
  }

  function handleCancel() {
    setCropping(false)
    if (previewSrc) URL.revokeObjectURL(previewSrc)
    setPreviewSrc(null)
    setSelectedFile(null)
  }

  const bdr = shape === 'circle' ? '50%' : '8px'

  return (
    <div>
      <canvas ref={canvasRef} className="hidden" />

      {cropping && previewSrc && natW > 0 ? (
        <div className="space-y-3">
          <p className="text-sm text-foreground-muted flex items-center gap-1">
            <Move className="w-3 h-3" /> Drag to reposition, scroll to zoom
          </p>

          <div
            className="relative mx-auto overflow-hidden cursor-grab active:cursor-grabbing border-2 border-accent"
            style={{ width: BOX, height: BOX, borderRadius: bdr }}
            onMouseDown={e => { e.preventDefault(); ptrDown(e.clientX, e.clientY) }}
            onTouchStart={e => { if (e.touches.length === 1) ptrDown(e.touches[0].clientX, e.touches[0].clientY) }}
            onWheel={handleWheel}
          >
            {/* 
              KEY: only set width, let height be auto via aspect-ratio.
              This makes it IMPOSSIBLE for the browser to stretch.
            */}
            <img
              src={previewSrc}
              draggable={false}
              className="absolute select-none pointer-events-none"
              style={{
                width: displayW,
                height: 'auto',
                aspectRatio: `${natW} / ${natH}`,
                left: imgLeft,
                top: imgTop,
              }}
              alt=""
            />
          </div>

          <div className="flex items-center gap-3 justify-center">
            <ZoomOut className="w-4 h-4 text-foreground-muted" />
            <input type="range" min="1" max="5" step="0.05" value={zoom}
              onChange={e => setZoom(parseFloat(e.target.value))} className="w-40 accent-accent" />
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
          <div className="flex items-center justify-center overflow-hidden flex-shrink-0 bg-background-tertiary"
            style={{ width: size, height: size, borderRadius: bdr }}>
            {imageUrl
              ? <img src={imageUrl} alt="" className="object-cover w-full h-full" style={{ borderRadius: bdr }} />
              : <Upload className="w-6 h-6 text-foreground-muted" />}
          </div>
          <label className="btn btn-secondary text-xs cursor-pointer">
            <Upload className="w-3 h-3 mr-1" /> {label}
            <input type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
          </label>
        </div>
      )}
    </div>
  )
}
