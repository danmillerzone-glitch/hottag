'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { Camera, Plus, Trash2, Loader2, Upload, X } from 'lucide-react'

interface PortfolioItem {
  id: string
  title: string
  description: string | null
  image_url: string
  link_url: string | null
  sort_order: number
}

export default function PortfolioManager({ professionalId }: { professionalId: string }) {
  const [items, setItems] = useState<PortfolioItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState({ title: '', description: '', link_url: '', image_url: '' })

  useEffect(() => { loadItems() }, [professionalId])

  async function loadItems() {
    const supabase = createClient()
    const { data } = await supabase
      .from('professional_portfolio')
      .select('*')
      .eq('professional_id', professionalId)
      .order('sort_order', { ascending: true })
    setItems(data || [])
    setLoading(false)
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const supabase = createClient()
      const fileName = `portfolio-${professionalId}-${Date.now()}.${file.name.split('.').pop()}`
      const { error } = await supabase.storage.from('wrestler-photos').upload(fileName, file)
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage.from('wrestler-photos').getPublicUrl(fileName)
      setFormData({ ...formData, image_url: publicUrl })
    } catch (err: any) {
      alert(`Upload failed: ${err.message}`)
    }
    setUploading(false)
  }

  async function handleAdd() {
    if (!formData.title || !formData.image_url) {
      alert('Please fill in a title and upload an image')
      return
    }
    const supabase = createClient()
    const { error } = await supabase.from('professional_portfolio').insert({
      professional_id: professionalId,
      title: formData.title,
      description: formData.description || null,
      image_url: formData.image_url,
      link_url: formData.link_url || null,
      sort_order: items.length,
    })
    if (error) { alert(error.message); return }
    setFormData({ title: '', description: '', link_url: '', image_url: '' })
    setShowForm(false)
    await loadItems()
  }

  async function handleDelete(id: string) {
    if (!confirm('Remove this portfolio item?')) return
    const supabase = createClient()
    await supabase.from('professional_portfolio').delete().eq('id', id)
    setItems(items.filter(i => i.id !== id))
  }

  return (
    <section className="card p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Camera className="w-5 h-5 text-accent" />
          <h2 className="text-lg font-display font-bold">Portfolio</h2>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-secondary text-sm">
          {showForm ? <><X className="w-4 h-4 mr-1" /> Cancel</> : <><Plus className="w-4 h-4 mr-1" /> Add Work</>}
        </button>
      </div>

      {showForm && (
        <div className="mb-5 p-4 bg-background-tertiary rounded-lg space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Title *</label>
            <input type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. NTP Audacity of Hope 2025"
              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm outline-none focus:border-accent" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description <span className="text-foreground-muted font-normal">(optional)</span></label>
            <input type="text" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of the work"
              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm outline-none focus:border-accent" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Link <span className="text-foreground-muted font-normal">(optional)</span></label>
            <input type="text" value={formData.link_url} onChange={e => setFormData({ ...formData, link_url: e.target.value })}
              placeholder="https://..."
              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm outline-none focus:border-accent" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Image *</label>
            {formData.image_url ? (
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-background"><img src={formData.image_url} alt="" className="w-full h-full object-cover" /></div>
                <button onClick={() => setFormData({ ...formData, image_url: '' })} className="text-sm text-red-400 hover:underline">Remove</button>
              </div>
            ) : (
              <label className={`inline-flex items-center gap-2 btn btn-secondary text-sm cursor-pointer ${uploading ? 'opacity-50' : ''}`}>
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {uploading ? 'Uploading...' : 'Upload Photo'}
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
              </label>
            )}
          </div>
          <button onClick={handleAdd} className="btn btn-primary text-sm w-full"><Plus className="w-4 h-4 mr-1" /> Add to Portfolio</button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-foreground-muted" /></div>
      ) : items.length === 0 ? (
        <p className="text-sm text-foreground-muted">No portfolio items yet. Showcase your best work here.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {items.map((item) => (
            <div key={item.id} className="relative rounded-lg overflow-hidden bg-background-tertiary border border-border group">
              <div className="aspect-square relative">
                <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                <button onClick={() => handleDelete(item.id)}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-500/80 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="p-2">
                <p className="text-xs font-semibold truncate">{item.title}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
