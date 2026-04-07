'use client'

import { useState, useRef, useEffect } from 'react'
import { QrCode, Download, Copy, Check, X } from 'lucide-react'
import QRCode from 'qrcode'

type LogoFit = 'photo' | 'logo'

const FALLBACK_LOGO_URL = '/logo-mark.png'

interface QRCodeModalProps {
  url: string
  name: string
  logoUrl?: string
  logoFit?: LogoFit
  onClose: () => void
}

function QRCodeModal({ url, name, logoUrl, logoFit, onClose }: QRCodeModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isMountedRef = useRef(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    isMountedRef.current = true
    const canvas = canvasRef.current
    if (!canvas) return

    async function loadImage(src: string): Promise<HTMLImageElement | null> {
      return new Promise((resolve) => {
        const img = new Image()
        // Only set crossOrigin for absolute cross-origin URLs. Setting it on
        // same-origin requests can cause loads to fail when the server doesn't
        // emit CORS headers (Next.js static file server doesn't by default).
        if (/^https?:\/\//.test(src)) {
          img.crossOrigin = 'anonymous'
        }
        img.onload = () => resolve(img)
        img.onerror = () => resolve(null)
        img.src = src
      })
    }

    function wrapNameTwoLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
      if (ctx.measureText(text).width <= maxWidth) return [text]

      const words = text.split(/\s+/).filter(Boolean)
      let line1 = ''
      let idx = 0
      for (; idx < words.length; idx++) {
        const test = line1 ? `${line1} ${words[idx]}` : words[idx]
        if (ctx.measureText(test).width > maxWidth) break
        line1 = test
      }

      // Edge case: first word itself is wider than maxWidth
      if (!line1) {
        line1 = words[0] ?? text
        idx = 1
      }

      let line2 = words.slice(idx).join(' ')
      const originalLine2 = line2
      while (line2.length > 0 && ctx.measureText(line2 + '…').width > maxWidth) {
        line2 = line2.slice(0, -1)
      }
      if (line2.length < originalLine2.length) {
        line2 = line2.trimEnd() + '…'
      }

      return [line1, line2]
    }

    async function generateCard() {
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // 2. Canvas dimensions
      canvas.width = 800
      canvas.height = 1000

      // 3. Card chrome
      ctx.fillStyle = '#14181c'
      ctx.beginPath()
      ctx.roundRect(0, 0, 800, 1000, 24)
      ctx.fill()

      ctx.strokeStyle = '#2d333b'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.roundRect(0.5, 0.5, 799, 999, 24)
      ctx.stroke()

      // 4. Generate QR onto a temporary canvas
      const qrCanvas = document.createElement('canvas')
      try {
        await QRCode.toCanvas(qrCanvas, url, {
          errorCorrectionLevel: 'H',
          margin: 0,
          width: 632,
          color: { dark: '#14181c', light: '#ffffff' },
        })
      } catch (err) {
        console.error('QR generation failed:', err)
        return
      }
      if (!isMountedRef.current) return

      // 5. White QR tile
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.roundRect(56, 56, 688, 688, 16)
      ctx.fill()

      // 6. Composite the QR
      ctx.drawImage(qrCanvas, 84, 84)

      // 7. Center logo container
      // Drop shadow (same size, 2px down, no horizontal offset)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.18)'
      ctx.beginPath()
      ctx.roundRect(337, 339, 126, 126, 12)
      ctx.fill()

      // White container
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.roundRect(337, 337, 126, 126, 12)
      ctx.fill()

      // 8. Load and draw inner logo content
      let img = logoUrl ? await loadImage(logoUrl) : null
      if (!isMountedRef.current) return

      let effectiveFit: LogoFit = logoFit ?? 'logo'
      if (img === null) {
        img = await loadImage(FALLBACK_LOGO_URL)
        if (!isMountedRef.current) return
        effectiveFit = 'logo'
      }

      if (img) {
        ctx.save()
        ctx.beginPath()
        ctx.roundRect(343, 343, 114, 114, 8)
        ctx.clip()

        if (effectiveFit === 'photo') {
          // Cover-crop, top-anchored
          const scale = Math.max(114 / img.width, 114 / img.height)
          const dw = img.width * scale
          const dh = img.height * scale
          const dx = 343 + (114 - dw) / 2
          const dy = 343
          ctx.drawImage(img, dx, dy, dw, dh)
        } else {
          // Contain-fit, centered on white
          ctx.fillStyle = '#ffffff'
          ctx.fillRect(343, 343, 114, 114)
          const pad = 2
          const box = 114 - pad * 2
          const scale = Math.min(box / img.width, box / img.height)
          const dw = img.width * scale
          const dh = img.height * scale
          const dx = 343 + (114 - dw) / 2
          const dy = 343 + (114 - dh) / 2
          ctx.drawImage(img, dx, dy, dw, dh)
        }

        ctx.restore()
      }

      // 9. Measure name layout first so the accent stripe can sit above it
      ctx.font = '900 36px "Space Grotesk", "Inter", system-ui, sans-serif'
      const nameLines = wrapNameTwoLines(ctx, name, 700)
      const nameLineHeight = 42
      const nameStartY = nameLines.length === 1 ? 848 : 820

      // 10. Orange accent stripe (24px above the first name line)
      ctx.fillStyle = '#ff6b35'
      ctx.beginPath()
      ctx.roundRect(380, nameStartY - 24, 40, 4, 2)
      ctx.fill()

      // 11. Entity name (1-2 lines, word-wrapped, ellipsis on overflow)
      ctx.fillStyle = '#ffffff'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      nameLines.forEach((line, i) => {
        ctx.fillText(line, 400, nameStartY + i * nameLineHeight)
      })

      // 12. URL (strip https:// for display)
      const displayUrl = url.replace(/^https?:\/\//, '')
      ctx.font = '400 18px "Inter", system-ui, sans-serif'
      ctx.fillStyle = '#9ca3af'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      const urlY = nameStartY + nameLines.length * nameLineHeight + 10
      ctx.fillText(displayUrl, 400, urlY)
    }

    generateCard()

    return () => {
      isMountedRef.current = false
    }
  }, [url, name, logoUrl, logoFit])

  function handleDownload() {
    const canvas = canvasRef.current
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `${name.toLowerCase().replace(/\s+/g, '-')}-hot-tag.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  function handleCopy() {
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose} role="dialog" aria-modal="true" aria-label={`QR Code for ${name}`}>
      <div className="bg-background-secondary border border-border rounded-xl w-full max-w-sm shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="font-display font-bold flex items-center gap-2">
            <QrCode className="w-5 h-5 text-accent" />
            QR Code
          </h3>
          <button onClick={onClose} aria-label="Close QR code dialog" className="p-1.5 rounded-lg hover:bg-background-tertiary">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="bg-white rounded-xl p-4 flex items-center justify-center">
            <canvas ref={canvasRef} className="w-full max-w-[280px] aspect-[4/5]" aria-label={`QR code linking to ${name}`} />
          </div>

          <p className="text-xs text-foreground-muted text-center">
            Download to print, share, or stick on merch
          </p>

          <div className="flex gap-2">
            <button onClick={handleDownload} aria-label="Download QR code as PNG" className="flex-1 btn btn-primary text-sm">
              <Download className="w-4 h-4 mr-1.5" />
              Download PNG
            </button>
            <button onClick={handleCopy} aria-label={copied ? 'Link copied' : 'Copy link to clipboard'} className="btn btn-secondary text-sm">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function QRCodeButton({
  url,
  name,
  logoUrl,
  logoFit,
}: {
  url: string
  name: string
  logoUrl?: string
  logoFit?: LogoFit
}) {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <button onClick={() => setShowModal(true)} aria-label={`Show QR code for ${name}`} className="p-2 rounded-lg text-foreground-muted hover:text-accent hover:bg-accent/10 transition-colors" title="QR Code">
        <QrCode className="w-4 h-4" />
      </button>
      {showModal && <QRCodeModal url={url} name={name} logoUrl={logoUrl} logoFit={logoFit} onClose={() => setShowModal(false)} />}
    </>
  )
}
