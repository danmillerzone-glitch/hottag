'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { createClient } from '@/lib/supabase-browser'
import { Check, Heart, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { trackEvent } from '@/lib/utils'

type AttendanceStatus = 'attending' | 'interested' | null

interface AttendanceButtonsProps {
  eventId: string
  initialGoingCount: number
  initialInterestedCount: number
}

export default function AttendanceButtons({ 
  eventId, 
  initialGoingCount, 
  initialInterestedCount 
}: AttendanceButtonsProps) {
  const { user } = useAuth()
  const router = useRouter()
  const supabase = createClient()
  
  const [status, setStatus] = useState<AttendanceStatus>(null)
  const [loading, setLoading] = useState(false)
  const [goingCount, setGoingCount] = useState(initialGoingCount)
  const [interestedCount, setInterestedCount] = useState(initialInterestedCount)

  // Fetch user's current attendance status
  useEffect(() => {
    if (!user) {
      setStatus(null)
      return
    }

    const fetchStatus = async () => {
      const { data } = await supabase
        .from('user_event_attendance')
        .select('status')
        .eq('user_id', user.id)
        .eq('event_id', eventId)
        .single()

      if (data) {
        setStatus(data.status as AttendanceStatus)
      }
    }

    fetchStatus()
  }, [user, eventId])

  const handleAttendance = async (newStatus: 'attending' | 'interested') => {
    if (!user) {
      router.push('/signin')
      return
    }

    setLoading(true)

    try {
      if (status === newStatus) {
        // Remove attendance
        await supabase
          .from('user_event_attendance')
          .delete()
          .eq('user_id', user.id)
          .eq('event_id', eventId)

        // Update counts
        if (status === 'attending') setGoingCount(c => Math.max(0, c - 1))
        if (status === 'interested') setInterestedCount(c => Math.max(0, c - 1))
        
        setStatus(null)
      } else {
        // Upsert attendance
        await supabase
          .from('user_event_attendance')
          .upsert({
            user_id: user.id,
            event_id: eventId,
            status: newStatus,
          }, {
            onConflict: 'user_id,event_id'
          })

        // Update counts
        if (status === 'attending') setGoingCount(c => Math.max(0, c - 1))
        if (status === 'interested') setInterestedCount(c => Math.max(0, c - 1))
        if (newStatus === 'attending') setGoingCount(c => c + 1)
        if (newStatus === 'interested') setInterestedCount(c => c + 1)
        
        setStatus(newStatus)
        trackEvent('RSVP', { status: newStatus })
      }
    } catch (error) {
      console.error('Error updating attendance:', error)
    }

    setLoading(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => handleAttendance('attending')}
          disabled={loading}
          aria-label={status === 'attending' ? 'Remove going status' : 'Mark as going'}
          aria-pressed={status === 'attending'}
          className={`btn ${
            status === 'attending'
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'btn-secondary'
          }`}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Check className="w-4 h-4 mr-2" />
          )}
          {status === 'attending' ? "I'm Going!" : "I'm Going"}
        </button>

        <button
          onClick={() => handleAttendance('interested')}
          disabled={loading}
          aria-label={status === 'interested' ? 'Remove interested status' : 'Mark as interested'}
          aria-pressed={status === 'interested'}
          className={`btn ${
            status === 'interested'
              ? 'bg-pink-600 hover:bg-pink-700 text-white'
              : 'btn-ghost'
          }`}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Heart className={`w-4 h-4 mr-2 ${status === 'interested' ? 'fill-current' : ''}`} />
          )}
          Interested
        </button>
      </div>

      {(goingCount > 0 || interestedCount > 0) && (
        <div className="text-sm text-foreground-muted">
          {goingCount > 0 && (
            <span><strong>{goingCount}</strong> going</span>
          )}
          {goingCount > 0 && interestedCount > 0 && (
            <span> • </span>
          )}
          {interestedCount > 0 && (
            <span><strong>{interestedCount}</strong> interested</span>
          )}
        </div>
      )}
    </div>
  )
}
