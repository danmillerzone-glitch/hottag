'use client'

import { useState } from 'react'
import { Tag, Check } from 'lucide-react'

interface CouponCodeButtonProps {
  code: string
  label?: string
}

export default function CouponCodeButton({ code, label }: CouponCodeButtonProps) {
  const [revealed, setRevealed] = useState(false)
  const [copied, setCopied] = useState(false)

  function handleClick() {
    if (!revealed) {
      setRevealed(true)
      return
    }
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <button
      onClick={handleClick}
      className="btn btn-secondary"
    >
      {copied ? (
        <Check className="w-4 h-4 mr-2 text-green-400" />
      ) : (
        <Tag className="w-4 h-4 mr-2" />
      )}
      {copied
        ? 'Copied!'
        : revealed
          ? code
          : (label || 'Copy coupon code')
      }
    </button>
  )
}
