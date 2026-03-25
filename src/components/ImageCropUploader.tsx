'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Upload, ZoomIn, ZoomOut, Check, X, Loader2, Move } from 'lucide-react'

interface Props {
  currentUrl?: string
  shape?: 'circle' | 'square'
  size?: number
  /** Width-to-height ratio (e.g. 4/5 = 0.8). Overrides shape to rectangular. */
  aspectRatio?: number
  onUpload: (file: File, meta?: { hasTransparency: boolean }) => Promise<string>
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

  // Zoom as both state (for slider UI) and ref (for drag handler)
  const [zoom, setZoom] = useState(1)
  const zoomRef = useRef(1)

  // Drag position via refs — direct DOM updates for 1:1 smooth dragging
  const txRef = useRef(0)
  const tyRef = useRef(0)

  const [natSize, setNatSize] = useState<{ w: number; h: number } | null>(null)
  const natSizeRef = useRef<{ w: number; h: number } | null>(null)

  const draggingRef = useRef(false)
  const lastPt = useRef({ x: 0, y: 0 })
  const imgRef = useRef<HTMLImageElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => { if (currentUrl) setImageUrl(currentUrl) }, [currentUrl])

  // --- Clamping helper: reads from refs for instant access ---
  function getClampedPos() {
    const ns = natSizeRef.current
    if (!ns) return { cx: 0, cy: 0 }
    const cs = Math.max(boxW / ns.w, boxH / ns.h)
    const z = zoomRef.current
    const mTx = Math.max(0, (ns.w * cs * z - boxW) / 2)
    const mTy = Math.max(0, (ns.h * cs * z - boxH) / 2)
    return {
      cx: Math.max(-mTx, Math.min(mTx, txRef.current)),
      cy: Math.max(-mTy, Math.min(mTy, tyRef.current)),
    }
  }

  // --- Direct DOM update — bypasses React re-render for smooth 1:1 dragging ---
  function applyTransform() {
    const img = imgRef.current
    if (!img) return
    const { cx, cy } = getClampedPos()
    const z = zoomRef.current
    img.style.transform = `scale(${z}) translate(${cx / z}px, ${cy / z}px)`
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    if (objectUrl) URL.revokeObjectURL(objectUrl)
    setFile(f)
    setObjectUrl(URL.createObjectURL(f))
    setZoom(1)
    zoomRef.current = 1
    txRef.current = 0
    tyRef.current = 0
    setNatSize(null)
    natSizeRef.current = null
    setCropping(true)
  }

  // Display dimensions at zoom=1 (zoom applied via CSS transform)
  const coverScale = natSize ? Math.max(boxW / natSize.w, boxH / natSize.h) : 1
  const rendW = (natSize?.w ?? boxW) * coverScale
  const rendH = (natSize?.h ?? boxH) * coverScale

  // --- Pointer handling ---
  function ptrDown(x: number, y: number) {
    draggingRef.current = true
    lastPt.current = { x, y }
  }

  const ptrMove = useCallback((x: number, y: number) => {
    if (!draggingRef.current) return
    txRef.current += x - lastPt.current.x
    tyRef.current += y - lastPt.current.y
    lastPt.current = { x, y }
    applyTransform()
  }, [])

  const ptrUp = useCallback(() => { draggingRef.current = false }, [])

  useEffect(() => {
    if (!cropping) return
    const mm = (e: MouseEvent) => ptrMove(e.clientX, e.clientY)
    const tm = (e: TouchEvent) => {
      if (e.touches.length === 1 && draggingRef.current) { e.preventDefault(); ptrMove(e.touches[0].clientX, e.touches[0].clientY) }
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
    const newZ = Math.max(1, Math.min(5, zoomRef.current + (e.deltaY > 0 ? -0.05 : 0.05)))
    setZoom(newZ)
    zoomRef.current = newZ
    applyTransform()
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

    const natW = img.naturalWidth
    const natH = img.naturalHeight
    const cs = Math.max(boxW / natW, boxH / natH)
    const rW = natW * cs
    const rH = natH * cs

    const z = zoomRef.current
    const { cx, cy } = getClampedPos()
    const finalW = rW * z
    const finalH = rH * z
    const finalX = (boxW - finalW) / 2 + cx
    const finalY = (boxH - finalH) / 2 + cy

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

    // Detect if the image has any transparent pixels
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const pixels = imageData.data
    let hasTransparency = false
    for (let i = 3; i < pixels.length; i += 16) { // sample every 4th pixel for speed
      if (pixels[i] < 250) { hasTransparency = true; break }
    }

    // Use PNG for transparent images, JPEG for photos
    const isPng = file?.type === 'image/png' || file?.name?.toLowerCase().endsWith('.png')
    const mimeType = isPng ? 'image/png' : 'image/jpeg'
    const fileExt = isPng ? 'png' : 'jpg'

    canvas.toBlob(async (blob) => {
      if (!blob) { setUploading(false); return }
      try {
        const url = await onUpload(new File([blob], `cropped.${fileExt}`, { type: mimeType }), { hasTransparency })
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

  // Initial transform for React render (before any dragging)
  const { cx: initCx, cy: initCy } = getClampedPos()

  return (
    <div>
      <canvas ref={canvasRef} className="hidden" />

      {/* Crop modal */}
      {cropping && objectUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={e => { if (e.target === e.currentTarget && !uploading) handleCancel() }}>
          <div className="bg-background border border-border rounded-xl p-6 space-y-4 max-w-sm mx-4"
            onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-display font-bold">Adjust Photo</h3>
            <p className="text-sm text-foreground-muted flex items-center gap-1">
              <Move className="w-3 h-3" /> Drag to reposition, use slider to zoom
            </p>

            <div
              className="relative mx-auto overflow-hidden cursor-grab active:cursor-grabbing border-2 border-accent"
              style={{ width: boxW, height: boxH, borderRadius: aspectRatio ? '8px' : bdr, touchAction: 'none' }}
              onMouseDown={e => { e.preventDefault(); ptrDown(e.clientX, e.clientY) }}
              onTouchStart={e => { if (e.touches.length === 1) { e.preventDefault(); ptrDown(e.touches[0].clientX, e.touches[0].clientY) } }}
              onWheel={handleWheel}
            >
              <img
                ref={imgRef}
                src={objectUrl}
                draggable={false}
                alt=""
                onLoad={e => {
                  const img = e.currentTarget
                  const ns = { w: img.naturalWidth, h: img.naturalHeight }
                  setNatSize(ns)
                  natSizeRef.current = ns
                  applyTransform()
                }}
                style={{
                  position: 'absolute',
                  width: rendW,
                  height: rendH,
                  maxWidth: 'none',
                  maxHeight: 'none',
                  left: (boxW - rendW) / 2,
                  top: (boxH - rendH) / 2,
                  transform: `scale(${zoom}) translate(${initCx / zoom}px, ${initCy / zoom}px)`,
                  transformOrigin: 'center center',
                  pointerEvents: 'none',
                  userSelect: 'none',
                  willChange: 'transform',
                  visibility: natSize ? 'visible' : 'hidden',
                }}
              />
            </div>

            <div className="flex items-center gap-3 justify-center">
              <button type="button" onClick={() => {
                const z = Math.max(1, zoomRef.current - 0.25)
                setZoom(z); zoomRef.current = z; applyTransform()
              }} className="p-1.5 rounded-lg hover:bg-background-tertiary active:bg-background-tertiary transition-colors">
                <ZoomOut className="w-4 h-4 text-foreground-muted" />
              </button>
              <input type="range" min="1" max="5" step="0.05" value={zoom}
                onChange={e => {
                  const z = parseFloat(e.target.value)
                  setZoom(z)
                  zoomRef.current = z
                  applyTransform()
                }} className="w-40 accent-accent" style={{ touchAction: 'auto' }} />
              <button type="button" onClick={() => {
                const z = Math.min(5, zoomRef.current + 0.25)
                setZoom(z); zoomRef.current = z; applyTransform()
              }} className="p-1.5 rounded-lg hover:bg-background-tertiary active:bg-background-tertiary transition-colors">
                <ZoomIn className="w-4 h-4 text-foreground-muted" />
              </button>
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
        </div>
      )}

      {/* Preview + upload button */}
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
    </div>
  )
}
