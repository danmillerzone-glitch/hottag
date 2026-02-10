'use client'

import { useState } from 'react'
import { Tag, Check, Copy } from 'lucide-react'

interface CouponCodeButtonProps {
  code: string
  label?: string
}

export default function CouponCodeButton({ code, label }: CouponCodeButtonProps) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-accent/10 border border-accent/30 hover:bg-accent/20 transition-colors group"
    >
      <Tag className="w-4 h-4 text-accent" />
      <div className="text-left">
        <div className="text-xs text-foreground-muted">{label || 'Discount code'}</div>
        <div className="text-sm font-bold text-accent font-mono tracking-wider">{code}</div>
      </div>
      {copied ? (
        <Check className="w-4 h-4 text-green-400 ml-1" />
      ) : (
        <Copy className="w-3.5 h-3.5 text-foreground-muted group-hover:text-accent ml-1" />
      )}
    </button>
  )
}
