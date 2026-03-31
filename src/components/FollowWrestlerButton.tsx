'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { createClient } from '@/lib/supabase-browser'
import { UserPlus, UserCheck, Loader2 } from 'lucide-react'
import { useAuthModal } from '@/lib/auth-modal-context'
import { trackEvent } from '@/lib/utils'

interface FollowWrestlerButtonProps {
  wrestlerId: string
  wrestlerName: string
  initialFollowerCount?: number
}

export default function FollowWrestlerButton({ 
  wrestlerId, 
  wrestlerName,
  initialFollowerCount = 0 
}: FollowWrestlerButtonProps) {
  const { user } = useAuth()
  const { openAuthModal } = useAuthModal()
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
        .from('user_follows_wrestler')
        .select('id')
        .eq('user_id', user.id)
        .eq('wrestler_id', wrestlerId)
        .single()

      setIsFollowing(!!data)
    }

    checkFollowing()
  }, [user, wrestlerId])

  const handleFollow = async () => {
    if (!user) {
      openAuthModal('Sign in to follow this wrestler')
      return
    }

    setLoading(true)

    try {
      if (isFollowing) {
        await supabase
          .from('user_follows_wrestler')
          .delete()
          .eq('user_id', user.id)
          .eq('wrestler_id', wrestlerId)

        setIsFollowing(false)
        setFollowerCount(c => Math.max(0, c - 1))
      } else {
        await supabase
          .from('user_follows_wrestler')
          .insert({
            user_id: user.id,
            wrestler_id: wrestlerId,
          })

        setIsFollowing(true)
        setFollowerCount(c => c + 1)
        trackEvent('Follow Wrestler', { wrestler: wrestlerName })
      }

      // Sync denormalized follower_count on wrestlers table
      const { count } = await supabase
        .from('user_follows_wrestler')
        .select('id', { count: 'exact', head: true })
        .eq('wrestler_id', wrestlerId)
      await supabase
        .from('wrestlers')
        .update({ follower_count: count ?? 0 })
        .eq('id', wrestlerId)
    } catch (error) {
      console.error('Error updating follow:', error)
    }

    setLoading(false)
  }

  return (
    <button
      onClick={handleFollow}
      disabled={loading}
      aria-label={isFollowing ? `Unfollow ${wrestlerName}` : `Follow ${wrestlerName}`}
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
        <UserCheck className="w-4 h-4 mr-2" />
      ) : (
        <UserPlus className="w-4 h-4 mr-2" />
      )}
      {isFollowing ? 'Following' : 'Follow'}
      {followerCount > 0 && (
        <span className="ml-1.5 text-xs opacity-60">
          · {followerCount}
        </span>
      )}
    </button>
  )
}
