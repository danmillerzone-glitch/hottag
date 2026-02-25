'use client'

import { Ticket, ExternalLink } from 'lucide-react'
import { trackEvent } from '@/lib/utils'

interface TicketLinkProps {
  href: string
  eventName: string
  promotionName?: string
}

export default function TicketLink({ href, eventName, promotionName }: TicketLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="btn btn-primary"
      onClick={() => trackEvent('Ticket Click', { event: eventName, promotion: promotionName || '' })}
    >
      <Ticket className="w-4 h-4 mr-2" />
      Get Tickets
      <ExternalLink className="w-3 h-3 ml-2" />
    </a>
  )
}
