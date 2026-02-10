'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { Youtube, Plus, Trash2, Loader2, X, GripVertical } from 'lucide-react'

interface Video {
  id: string
  title: string | null
  url: string
  sort_order: number
}

interface VideoManagerProps {
  wrestlerId?: string
  promotionId?: string
  sectionTitle?: string
  onSectionTitleChange?: (title: string) => void
}

export default function VideoManager({ wrestlerId, promotionId, sectionTitle, onSectionTitleChange }: VideoManagerProps) {
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({ title: '', url: '' })

  const fkColumn = wrestlerId ? 'wrestler_id' : 'promotion_id'
  const fkValue = wrestlerId || promotionId || ''

  useEffect(() => {
    loadVideos()
  }, [fkValue])

  async function loadVideos() {
    const supabase = createClient()
    const { data } = await supabase
      .from('profile_videos')
      .select('*')
      .eq(fkColumn, fkValue)
      .order('sort_order', { ascending: true })
    setVideos(data || [])
    setLoading(false)
  }

  async function handleAdd() {
    if (!formData.url) {
      alert('Please enter a YouTube URL')
      return
    }
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from('profile_videos').insert({
      [fkColumn]: fkValue,
      title: formData.title || null,
      url: formData.url,
      sort_order: videos.length,
    })
    if (error) { alert(error.message); setSaving(false); return }
    setFormData({ title: '', url: '' })
    setShowForm(false)
    setSaving(false)
    await loadVideos()
  }

  async function handleDelete(id: string) {
    if (!confirm('Remove this video?')) return
    const supabase = createClient()
    await supabase.from('profile_videos').delete().eq('id', id)
    setVideos(videos.filter(v => v.id !== id))
  }

  async function handleMove(index: number, direction: 'up' | 'down') {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= videos.length) return
    const updated = [...videos]
    const [moved] = updated.splice(index, 1)
    updated.splice(newIndex, 0, moved)
    setVideos(updated)

    const supabase = createClient()
    await Promise.all(
      updated.map((v, i) =>
        supabase.from('profile_videos').update({ sort_order: i }).eq('id', v.id)
      )
    )
  }

  return (
    <section className="card p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Youtube className="w-5 h-5 text-red-500" />
          <h2 className="text-lg font-display font-bold">Videos</h2>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-secondary text-sm">
          {showForm ? <><X className="w-4 h-4 mr-1" /> Cancel</> : <><Plus className="w-4 h-4 mr-1" /> Add Video</>}
        </button>
      </div>

      {onSectionTitleChange && (
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1.5">Section Title <span className="text-foreground-muted font-normal">(optional)</span></label>
          <input
            type="text"
            value={sectionTitle || ''}
            onChange={(e) => onSectionTitleChange(e.target.value)}
            placeholder='Defaults to "Videos"'
            className="w-full px-3 py-2.5 rounded-lg bg-background-tertiary border border-border text-foreground placeholder:text-foreground-muted/50 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors"
          />
        </div>
      )}

      {showForm && (
        <div className="mb-5 p-4 bg-background-tertiary rounded-lg space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">YouTube URL *</label>
            <input type="text" value={formData.url} onChange={e => setFormData({ ...formData, url: e.target.value })}
              placeholder="https://youtube.com/watch?v=... or https://youtu.be/..."
              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm outline-none focus:border-accent" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Title <span className="text-foreground-muted font-normal">(optional)</span></label>
            <input type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })}
              placeholder='e.g. "My Greatest Match"'
              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm outline-none focus:border-accent" />
          </div>
          <button onClick={handleAdd} disabled={saving} className="btn btn-primary text-sm w-full">
            {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Plus className="w-4 h-4 mr-1" />}
            Add Video
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-foreground-muted" /></div>
      ) : videos.length === 0 ? (
        <p className="text-sm text-foreground-muted">No videos yet. Add YouTube links to display a video section on your page.</p>
      ) : (
        <div className="space-y-2">
          {videos.map((video, index) => (
            <div key={video.id} className="flex items-center gap-3 p-3 bg-background-tertiary rounded-lg group">
              <div className="flex flex-col gap-0.5">
                <button onClick={() => handleMove(index, 'up')} disabled={index === 0}
                  className="text-foreground-muted hover:text-accent disabled:opacity-20 transition-colors">
                  <GripVertical className="w-4 h-4" />
                </button>
              </div>
              <Youtube className="w-5 h-5 text-red-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{video.title || 'Untitled Video'}</p>
                <p className="text-xs text-foreground-muted truncate">{video.url}</p>
              </div>
              <div className="flex items-center gap-1">
                {index > 0 && (
                  <button onClick={() => handleMove(index, 'up')} className="p-1 text-foreground-muted hover:text-accent text-xs">↑</button>
                )}
                {index < videos.length - 1 && (
                  <button onClick={() => handleMove(index, 'down')} className="p-1 text-foreground-muted hover:text-accent text-xs">↓</button>
                )}
                <button onClick={() => handleDelete(video.id)}
                  className="p-1.5 rounded-lg text-foreground-muted hover:text-red-400 hover:bg-red-500/10 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
