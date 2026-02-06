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

const BOX = 240 // crop box size in px
const OUT = 512 // output image size

export default function ImageCropUploader({
  currentUrl, shape = 'circle', size = 80, onUpload, label = 'Upload Photo',
}: ImageCropUploaderProps) {
  const [imageUrl, setImageUrl] = useState(currentUrl || '')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewSrc, setPreviewSrc] = useState<string | null>(null)
  const [cropping, setCropping] = useState(false)
  const [uploading, setUploading] = useState(false)

  // zoom=1 means image just barely covers the box; >1 means zoomed in further
  const [zoom, setZoom] = useState(1)
  // offX/offY: pixel offset of image top-left corner from crop box top-left
  // at zoom=1 with no offset, image is centered and covers the box
  const [offX, setOffX] = useState(0)
  const [offY, setOffY] = useState(0)

  const [imgW, setImgW] = useState(0) // natural width
  const [imgH, setImgH] = useState(0) // natural height

  const draggingRef = useRef(false)
  const lastPt = useRef({ x: 0, y: 0 })

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imgElRef = useRef<HTMLImageElement | null>(null)

  useEffect(() => { if (currentUrl) setImageUrl(currentUrl) }, [currentUrl])

  // ---- Derived layout ----
  // coverScale: scale that makes image exactly cover the BOX at zoom=1
  const coverScale = imgW > 0 && imgH > 0
    ? Math.max(BOX / imgW, BOX / imgH)
    : 1
  const s = coverScale * zoom
  const dispW = imgW * s
  const dispH = imgH * s

  // Default position (centered) + user offset, clamped
  function clamp(off: number, dispDim: number) {
    // default center: (BOX - dispDim) / 2
    // actual position: (BOX - dispDim) / 2 + off
    // constraints: pos <= 0  AND  pos + dispDim >= BOX
    //   => off <= -(BOX - dispDim)/2  =>  off <= (dispDim - BOX)/2
    //   => (BOX - dispDim)/2 + off + dispDim >= BOX  =>  off >= -(dispDim - BOX)/2
    const maxOff = (dispDim - BOX) / 2
    return Math.min(maxOff, Math.max(-maxOff, off))
  }

  const clampedX = clamp(offX, dispW)
  const clampedY = clamp(offY, dispH)
  const posX = (BOX - dispW) / 2 + clampedX
  const posY = (BOX - dispH) / 2 + clampedY

  // ---- Handlers ----
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
      setImgW(img.naturalWidth)
      setImgH(img.naturalHeight)
      setCropping(true)
    }
    img.src = url
  }

  function onPointerDown(clientX: number, clientY: number) {
    draggingRef.current = true
    lastPt.current = { x: clientX, y: clientY }
  }

  const onPointerMove = useCallback((clientX: number, clientY: number) => {
    if (!draggingRef.current) return
    const dx = clientX - lastPt.current.x
    const dy = clientY - lastPt.current.y
    lastPt.current = { x: clientX, y: clientY }
    setOffX(prev => prev + dx)
    setOffY(prev => prev + dy)
  }, [])

  const onPointerUp = useCallback(() => { draggingRef.current = false }, [])

  useEffect(() => {
    if (!cropping) return
    const mm = (e: MouseEvent) => onPointerMove(e.clientX, e.clientY)
    const tm = (e: TouchEvent) => { if (e.touches.length === 1) { e.preventDefault(); onPointerMove(e.touches[0].clientX, e.touches[0].clientY) } }
    window.addEventListener('mousemove', mm)
    window.addEventListener('mouseup', onPointerUp)
    window.addEventListener('touchmove', tm, { passive: false })
    window.addEventListener('touchend', onPointerUp)
    return () => {
      window.removeEventListener('mousemove', mm)
      window.removeEventListener('mouseup', onPointerUp)
      window.removeEventListener('touchmove', tm)
      window.removeEventListener('touchend', onPointerUp)
    }
  }, [cropping, onPointerMove, onPointerUp])

  function handleWheel(e: React.WheelEvent) {
    e.preventDefault()
    setZoom(z => {
      const next = z + (e.deltaY > 0 ? -0.05 : 0.05)
      return Math.max(1, Math.min(5, next))
    })
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
    ctx.drawImage(imgElRef.current, posX * r, posY * r, dispW * r, dispH * r)

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

  const radius = shape === 'circle' ? '50%' : '8px'

  return (
    <div>
      <canvas ref={canvasRef} className="hidden" />

      {cropping && previewSrc ? (
        <div className="space-y-3">
          <p className="text-sm text-foreground-muted flex items-center gap-1">
            <Move className="w-3 h-3" /> Drag to reposition, scroll to zoom
          </p>

          {/* Crop viewport */}
          <div
            className="relative mx-auto overflow-hidden cursor-grab active:cursor-grabbing border-2 border-accent"
            style={{ width: BOX, height: BOX, borderRadius: radius }}
            onMouseDown={e => { e.preventDefault(); onPointerDown(e.clientX, e.clientY) }}
            onTouchStart={e => { if (e.touches.length === 1) onPointerDown(e.touches[0].clientX, e.touches[0].clientY) }}
            onWheel={handleWheel}
          >
            {imgW > 0 && (
              <img
                src={previewSrc}
                alt="Crop preview"
                draggable={false}
                className="absolute select-none pointer-events-none"
                style={{
                  width: `${dispW}px`,
                  height: `${dispH}px`,
                  left: `${posX}px`,
                  top: `${posY}px`,
                }}
              />
            )}
          </div>

          {/* Zoom */}
          <div className="flex items-center gap-3 justify-center">
            <ZoomOut className="w-4 h-4 text-foreground-muted" />
            <input
              type="range" min="1" max="5" step="0.05" value={zoom}
              onChange={e => setZoom(parseFloat(e.target.value))}
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
            style={{ width: size, height: size, borderRadius: radius }}
          >
            {imageUrl ? (
              <img src={imageUrl} alt="" className="object-cover w-full h-full" style={{ borderRadius: radius }} />
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
