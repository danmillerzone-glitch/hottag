'use client'

import Image from 'next/image'
import { ExternalLink, ShoppingBag } from 'lucide-react'

interface MerchItem {
  id: string
  title: string
  image_url: string
  link_url: string
  price: string | null
}

export default function MerchGallery({ items }: { items: MerchItem[] }) {
  if (!items || items.length === 0) return null

  return (
    <div>
      <h2 className="text-lg font-display font-bold mb-4 flex items-center gap-2">
        <ShoppingBag className="w-5 h-5 text-accent" />
        Merch
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {items.map((item) => (
          <a
            key={item.id}
            href={item.link_url}
            target="_blank"
            rel="noopener noreferrer"
            className="group block rounded-xl overflow-hidden bg-background-tertiary border border-border hover:border-accent/50 transition-all"
          >
            <div className="relative aspect-square">
              <Image
                src={item.image_url}
                alt={item.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 640px) 50vw, 200px"
                unoptimized
              />
            </div>
            <div className="p-3">
              <p className="text-sm font-semibold text-foreground truncate group-hover:text-accent transition-colors">
                {item.title}
              </p>
              <div className="flex items-center justify-between mt-1">
                {item.price && (
                  <span className="text-xs text-accent font-bold">{item.price}</span>
                )}
                <ExternalLink className="w-3 h-3 text-foreground-muted" />
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}
