'use client'

import { useEffect } from 'react'
import { addRecentlyViewed, type RecentItem } from '@/lib/recently-viewed'

type Props = Omit<RecentItem, 'viewedAt'>

export default function RecentlyViewedTracker(props: Props) {
  useEffect(() => {
    addRecentlyViewed(props)
  }, [props.type, props.id])

  return null
}
