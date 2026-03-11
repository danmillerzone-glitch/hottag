'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Upload, ZoomIn, ZoomOut, Check, X, Loader2, Move } from 'lucide-react'

interface Props {
  currentUrl?: string
  shape?: 'circle' | 'square'
  size?: number
  /** Width-to-height ratio (e.g. 4/5 = 0.8). Overrides shape to rectangular. */
  aspectRatio?: number
  onUpload: (file: File) => Promise<string>
  label?: string
}

const BOX = 240
const OUT = 512

export default function ImageCropUploader({
  currentUrl, shape = 'circle', size = 80, aspectRatio, onUpload, label = 'Upload Photo',
}: Props) {
  // Crop area dimensions — rectangular if aspectRatio provided, otherwise square
  const boxW = BOX
  const boxH = aspectRatio ? Math.round(BOX / aspectRatio) : BOX
  const outW = OUT
  const outH = aspectRatio ? Math.round(OUT / aspectRatio) : OUT
  const [imageUrl, setImageUrl] = useState(currentUrl || '')
  const [file, setFile] = useState<File | null>(null)
  const [objectUrl, setObjectUrl] = useState<string | null>(null)
  const [cropping, setCropping] = useState(false)
  const [uploading, setUploading] = useState(false)

  const [zoom, setZoom] = useState(1)
  const [tx, setTx] = useState(0) // translate X in px
  const [ty, setTy] = useState(0) // translate Y in px

  const [natSize, setNatSize] = useState<{ w: number; h: number } | null>(null)

  const draggingRef = useRef(false)
  const lastPt = useRef({ x: 0, y: 0 })
  const imgRef = useRef<HTMLImageElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => { if (currentUrl) setImageUrl(currentUrl) }, [currentUrl])

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    if (objectUrl) URL.revokeObjectURL(objectUrl)
    setFile(f)
    setObjectUrl(URL.createObjectURL(f))
    setZoom(1)
    setTx(0)
    setTy(0)
    setNatSize(null)
    setCropping(true)
  }

  // --- Clamping: prevent showing area outside image ---
  // Use actual image dimensions to compute how much slack exists per axis.
  // With object-fit:cover, the image is scaled so the smaller ratio fills the box,
  // leaving overflow in the other dimension that can be panned.
  const { maxTx, maxTy } = (() => {
    if (!natSize) return { maxTx: 0, maxTy: 0 }
    const coverScale = Math.max(boxW / natSize.w, boxH / natSize.h)
    const rendW = natSize.w * coverScale * zoom
    const rendH = natSize.h * coverScale * zoom
    return {
      maxTx: Math.max(0, (rendW - boxW) / 2),
      maxTy: Math.max(0, (rendH - boxH) / 2),
    }
  })()
  const clampedTx = Math.max(-maxTx, Math.min(maxTx, tx))
  const clampedTy = Math.max(-maxTy, Math.min(maxTy, ty))

  // --- Pointer handling ---
  function ptrDown(x: number, y: number) {
    draggingRef.current = true
    lastPt.current = { x, y }
  }

  const ptrMove = useCallback((x: number, y: number) => {
    if (!draggingRef.current) return
    setTx(p => p + (x - lastPt.current.x))
    setTy(p => p + (y - lastPt.current.y))
    lastPt.current = { x, y }
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

  // --- Export: render what the user sees onto a canvas ---
  async function handleCropConfirm() {
    const img = imgRef.current
    if (!img || !canvasRef.current) return
    setUploading(true)

    // Wait for image to be fully loaded
    await new Promise<void>(res => {
      if (img.complete) return res()
      img.onload = () => res()
    })

    // Read the actual rendered size of the <img> (after object-fit:cover)
    // We need the natural dimensions to compute how object-fit:cover positioned it
    const natW = img.naturalWidth
    const natH = img.naturalHeight
    const coverScale = Math.max(boxW / natW, boxH / natH)
    const rendW = natW * coverScale
    const rendH = natH * coverScale

    const finalW = rendW * zoom
    const finalH = rendH * zoom
    const finalX = (boxW - finalW) / 2 + clampedTx
    const finalY = (boxH - finalH) / 2 + clampedTy

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')!
    canvas.width = outW
    canvas.height = outH

    const r = outW / boxW
    if (!aspectRatio && shape === 'circle') {
      ctx.beginPath()
      ctx.arc(outW / 2, outH / 2, outW / 2, 0, Math.PI * 2)
      ctx.clip()
    }

    ctx.drawImage(img, finalX * r, finalY * r, finalW * r, finalH * r)

    // Use PNG for transparent images, JPEG for photos
    const isPng = file?.type === 'image/png' || file?.name?.toLowerCase().endsWith('.png')
    const mimeType = isPng ? 'image/png' : 'image/jpeg'
    const fileExt = isPng ? 'png' : 'jpg'

    canvas.toBlob(async (blob) => {
      if (!blob) { setUploading(false); return }
      try {
        const url = await onUpload(new File([blob], `cropped.${fileExt}`, { type: mimeType }))
        setImageUrl(url.includes('?') ? url : `${url}?t=${Date.now()}`)
        setCropping(false)
        doCleanup()
      } catch (err: any) { alert(`Upload error: ${err.message}`) }
      setUploading(false)
    }, mimeType, isPng ? undefined : 0.92)
  }

  function doCleanup() {
    if (objectUrl) URL.revokeObjectURL(objectUrl)
    setObjectUrl(null)
    setFile(null)
  }

  function handleCancel() {
    setCropping(false)
    doCleanup()
  }

  const bdr = shape === 'circle' ? '50%' : '8px'

  return (
    <div>
      <canvas ref={canvasRef} className="hidden" />

      {cropping && objectUrl ? (
        <div className="space-y-3">
          <p className="text-sm text-foreground-muted flex items-center gap-1">
            <Move className="w-3 h-3" /> Drag to reposition, scroll to zoom
          </p>

          <div
            className="relative mx-auto overflow-hidden cursor-grab active:cursor-grabbing border-2 border-accent"
            style={{ width: boxW, height: boxH, borderRadius: aspectRatio ? '8px' : bdr }}
            onMouseDown={e => { e.preventDefault(); ptrDown(e.clientX, e.clientY) }}
            onTouchStart={e => { if (e.touches.length === 1) ptrDown(e.touches[0].clientX, e.touches[0].clientY) }}
            onWheel={handleWheel}
          >
            <img
              ref={imgRef}
              src={objectUrl}
              draggable={false}
              alt=""
              onLoad={e => {
                const img = e.currentTarget
                setNatSize({ w: img.naturalWidth, h: img.naturalHeight })
              }}
              style={{
                position: 'absolute',
                width: boxW,
                height: boxH,
                left: 0,
                top: 0,
                objectFit: 'cover',
                transform: `scale(${zoom}) translate(${clampedTx / zoom}px, ${clampedTy / zoom}px)`,
                transformOrigin: 'center center',
                pointerEvents: 'none',
                userSelect: 'none',
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
          <div className={`flex items-center justify-center overflow-hidden flex-shrink-0 ${imageUrl ? '' : 'bg-background-tertiary'}`}
            style={{ width: size, height: aspectRatio ? Math.round(size / aspectRatio) : size, borderRadius: aspectRatio ? '8px' : bdr }}>
            {imageUrl
              ? <img src={imageUrl} alt="" className="object-cover w-full h-full" style={{ borderRadius: aspectRatio ? '8px' : bdr }} />
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
