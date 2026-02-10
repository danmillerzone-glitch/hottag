'use client'

import { useState } from 'react'
import { Tag, Check } from 'lucide-react'

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
      className="relative inline-flex items-center gap-2 px-5 py-2.5 rounded-lg transition-all active:scale-95"
      style={{
        background: copied ? 'rgba(34, 197, 94, 0.25)' : 'rgba(34, 197, 94, 0.1)',
        border: '2px dashed rgba(34, 197, 94, 0.5)',
      }}
    >
      {copied ? (
        <Check className="w-4 h-4 text-green-400" />
      ) : (
        <Tag className="w-4 h-4 text-green-400" />
      )}
      <span className="font-mono font-bold text-sm tracking-wider text-green-400">
        {copied ? 'Code Copied!' : code}
      </span>
    </button>
  )
}
