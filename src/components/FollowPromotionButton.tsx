'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { createClient } from '@/lib/supabase-browser'
import { Bell, BellRing, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { trackEvent } from '@/lib/utils'

interface FollowPromotionButtonProps {
  promotionId: string
  promotionName: string
  initialFollowerCount?: number
}

export default function FollowPromotionButton({ 
  promotionId, 
  promotionName,
  initialFollowerCount = 0 
}: FollowPromotionButtonProps) {
  const { user } = useAuth()
  const router = useRouter()
  const supabase = createClient()
  
  const [isFollowing, setIsFollowing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [followerCount, setFollowerCount] = useState(initialFollowerCount)

  useEffect(() => {
    if (!user) {
      setIsFollowing(false)
      return
    }

    const checkFollowing = async () => {
      const { data } = await supabase
        .from('user_follows_promotion')
        .select('id')
        .eq('user_id', user.id)
        .eq('promotion_id', promotionId)
        .single()

      setIsFollowing(!!data)
    }

    checkFollowing()
  }, [user, promotionId])

  const handleFollow = async () => {
    if (!user) {
      router.push('/signin')
      return
    }

    setLoading(true)

    try {
      if (isFollowing) {
        await supabase
          .from('user_follows_promotion')
          .delete()
          .eq('user_id', user.id)
          .eq('promotion_id', promotionId)

        setIsFollowing(false)
        setFollowerCount(c => Math.max(0, c - 1))
      } else {
        await supabase
          .from('user_follows_promotion')
          .insert({
            user_id: user.id,
            promotion_id: promotionId,
          })

        setIsFollowing(true)
        setFollowerCount(c => c + 1)
        trackEvent('Follow Promotion', { promotion: promotionName })
      }
    } catch (error) {
      console.error('Error updating follow:', error)
    }

    setLoading(false)
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleFollow}
        disabled={loading}
        aria-label={isFollowing ? `Unfollow ${promotionName}` : `Follow ${promotionName}`}
        aria-pressed={isFollowing}
        className={`btn ${
          isFollowing
            ? 'bg-accent text-white hover:bg-accent/80'
            : 'btn-secondary'
        }`}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : isFollowing ? (
          <BellRing className="w-4 h-4 mr-2" />
        ) : (
          <Bell className="w-4 h-4 mr-2" />
        )}
        {isFollowing ? 'Following' : 'Follow'}
      </button>
      
      {followerCount > 0 && (
        <span className="text-sm text-foreground-muted">
          {followerCount} follower{followerCount !== 1 ? 's' : ''}
        </span>
      )}
    </div>
  )
}
