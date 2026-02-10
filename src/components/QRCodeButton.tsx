'use client'

import { useState, useRef, useEffect } from 'react'
import { QrCode, Download, Copy, Check, X } from 'lucide-react'

interface QRCodeModalProps {
  url: string
  name: string
  onClose: () => void
}

function QRCodeModal({ url, name, onClose }: QRCodeModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    generateQR()
  }, [url])

  function generateQR() {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Use the QR code generation library via CDN
    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js'
    script.onload = () => {
      // Clear canvas
      const size = 800
      canvas.width = size
      canvas.height = size + 100

      // Create temp div for QR generation
      const tempDiv = document.createElement('div')
      tempDiv.style.display = 'none'
      document.body.appendChild(tempDiv)

      // @ts-ignore
      const qr = new QRCode(tempDiv, {
        text: url,
        width: size,
        height: size,
        colorDark: '#000000',
        colorLight: '#ffffff',
        correctLevel: 2, // QRCode.CorrectLevel.H
      })

      // Wait for QR to render then draw on our canvas
      setTimeout(() => {
        const qrCanvas = tempDiv.querySelector('canvas')
        if (qrCanvas && ctx) {
          // White background
          ctx.fillStyle = '#ffffff'
          ctx.fillRect(0, 0, canvas.width, canvas.height)

          // Draw QR
          ctx.drawImage(qrCanvas, 0, 0, size, size)

          // Draw name below
          ctx.fillStyle = '#000000'
          ctx.font = 'bold 36px Inter, system-ui, sans-serif'
          ctx.textAlign = 'center'
          ctx.fillText(name, size / 2, size + 50)

          // Draw URL
          ctx.font = '22px Inter, system-ui, sans-serif'
          ctx.fillStyle = '#666666'
          ctx.fillText(url, size / 2, size + 85)
        }
        document.body.removeChild(tempDiv)
      }, 100)
    }
    document.head.appendChild(script)
  }

  function handleDownload() {
    const canvas = canvasRef.current
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `${name.toLowerCase().replace(/\s+/g, '-')}-qr-code.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  function handleCopy() {
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-background-secondary border border-border rounded-xl w-full max-w-sm shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="font-display font-bold flex items-center gap-2">
            <QrCode className="w-5 h-5 text-accent" />
            QR Code
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-background-tertiary">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="bg-white rounded-xl p-4 flex items-center justify-center">
            <canvas ref={canvasRef} className="w-full max-w-[250px] aspect-square" />
          </div>

          <p className="text-xs text-foreground-muted text-center">
            Print on merch, 8×10s, business cards, or flyers
          </p>

          <div className="flex gap-2">
            <button onClick={handleDownload} className="flex-1 btn btn-primary text-sm">
              <Download className="w-4 h-4 mr-1.5" />
              Download PNG
            </button>
            <button onClick={handleCopy} className="btn btn-secondary text-sm">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function QRCodeButton({ url, name }: { url: string; name: string }) {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <button onClick={() => setShowModal(true)} className="p-2 rounded-lg text-foreground-muted hover:text-accent hover:bg-accent/10 transition-colors" title="QR Code">
        <QrCode className="w-4 h-4" />
      </button>
      {showModal && <QRCodeModal url={url} name={name} onClose={() => setShowModal(false)} />}
    </>
  )
}
