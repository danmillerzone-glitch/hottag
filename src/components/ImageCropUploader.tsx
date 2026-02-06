'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Upload, ZoomIn, ZoomOut, Check, X, Loader2, Move } from 'lucide-react'

interface Props {
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
}: Props) {
  const [imageUrl, setImageUrl] = useState(currentUrl || '')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [bitmapUrl, setBitmapUrl] = useState<string | null>(null)
  const [cropping, setCropping] = useState(false)
  const [uploading, setUploading] = useState(false)

  const [zoom, setZoom] = useState(1)
  const [offX, setOffX] = useState(0)
  const [offY, setOffY] = useState(0)

  // TRUE rendered dimensions (after EXIF rotation)
  const [trueW, setTrueW] = useState(0)
  const [trueH, setTrueH] = useState(0)

  const draggingRef = useRef(false)
  const lastPt = useRef({ x: 0, y: 0 })
  const canvasRef = useRef<HTMLCanvasElement>(null)
  // We keep a reference to the bitmap canvas for export
  const sourceCanvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => { if (currentUrl) setImageUrl(currentUrl) }, [currentUrl])

  // --- Derived layout ---
  const coverScale = trueW > 0 && trueH > 0 ? Math.max(BOX / trueW, BOX / trueH) : 1
  const dW = Math.round(trueW * coverScale * zoom)
  const dH = Math.round(trueH * coverScale * zoom)

  function clampOff(off: number, dim: number) {
    const slack = Math.max(0, (dim - BOX) / 2)
    return Math.max(-slack, Math.min(slack, off))
  }

  const cx = clampOff(offX, dW)
  const cy = clampOff(offY, dH)
  const imgLeft = Math.round((BOX - dW) / 2 + cx)
  const imgTop = Math.round((BOX - dH) / 2 + cy)

  // --- File handling: draw to offscreen canvas to normalize EXIF ---
  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setSelectedFile(file)
    setZoom(1)
    setOffX(0)
    setOffY(0)

    // createImageBitmap respects EXIF orientation in all modern browsers
    const bitmap = await createImageBitmap(file)
    const w = bitmap.width
    const h = bitmap.height

    // Draw bitmap to an offscreen canvas to get a clean, orientation-corrected source
    const offCanvas = document.createElement('canvas')
    offCanvas.width = w
    offCanvas.height = h
    const ctx = offCanvas.getContext('2d')!
    ctx.drawImage(bitmap, 0, 0)
    bitmap.close()

    sourceCanvasRef.current = offCanvas
    setTrueW(w)
    setTrueH(h)

    // Create a blob URL from the corrected canvas for display
    offCanvas.toBlob((blob) => {
      if (blob) {
        setBitmapUrl(URL.createObjectURL(blob))
        setCropping(true)
      }
    }, 'image/jpeg', 0.95)
  }

  // --- Pointer handling ---
  function ptrDown(x: number, y: number) {
    draggingRef.current = true
    lastPt.current = { x, y }
  }

  const ptrMove = useCallback((x: number, y: number) => {
    if (!draggingRef.current) return
    const dx = x - lastPt.current.x
    const dy = y - lastPt.current.y
    lastPt.current = { x, y }
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

  // --- Export ---
  async function handleCropConfirm() {
    const src = sourceCanvasRef.current
    if (!src || !canvasRef.current) return
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

    // Draw from the orientation-corrected source canvas
    ctx.drawImage(src, imgLeft * r, imgTop * r, dW * r, dH * r)

    canvas.toBlob(async (blob) => {
      if (!blob) { setUploading(false); return }
      try {
        const url = await onUpload(new File([blob], 'cropped.jpg', { type: 'image/jpeg' }))
        setImageUrl(url.includes('?') ? url : `${url}?t=${Date.now()}`)
        setCropping(false)
        cleanup()
      } catch (err: any) { alert(`Upload error: ${err.message}`) }
      setUploading(false)
    }, 'image/jpeg', 0.92)
  }

  function cleanup() {
    if (bitmapUrl) URL.revokeObjectURL(bitmapUrl)
    setBitmapUrl(null)
    setSelectedFile(null)
    sourceCanvasRef.current = null
  }

  function handleCancel() {
    setCropping(false)
    cleanup()
  }

  const bdr = shape === 'circle' ? '50%' : '8px'

  return (
    <div>
      <canvas ref={canvasRef} className="hidden" />

      {cropping && bitmapUrl && trueW > 0 ? (
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
              The bitmapUrl is from a canvas that already has correct orientation.
              We set explicit width AND height in px — both derived from the SAME
              coverScale * zoom factor, so aspect ratio is guaranteed.
            */}
            <img
              src={bitmapUrl}
              draggable={false}
              alt=""
              className="absolute select-none pointer-events-none"
              style={{
                width: `${dW}px`,
                height: `${dH}px`,
                left: `${imgLeft}px`,
                top: `${imgTop}px`,
              }}
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
