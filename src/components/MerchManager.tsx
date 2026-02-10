'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { ShoppingBag, Plus, Trash2, Loader2, Upload, X } from 'lucide-react'

interface MerchItem {
  id: string
  title: string
  image_url: string
  link_url: string
  price: string | null
  sort_order: number
}

interface MerchManagerProps {
  wrestlerId?: string
  promotionId?: string
}

export default function MerchManager({ wrestlerId, promotionId }: MerchManagerProps) {
  const [items, setItems] = useState<MerchItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState({ title: '', link_url: '', price: '', image_url: '' })

  const table = wrestlerId ? 'wrestler_merch_items' : 'promotion_merch_items'
  const fkColumn = wrestlerId ? 'wrestler_id' : 'promotion_id'
  const fkValue = wrestlerId || promotionId || ''
  const storageBucket = wrestlerId ? 'wrestler-photos' : 'promotion-logos'

  useEffect(() => {
    loadItems()
  }, [fkValue])

  async function loadItems() {
    const supabase = createClient()
    const { data } = await supabase
      .from(table)
      .select('*')
      .eq(fkColumn, fkValue)
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
      const fileName = `merch-${fkValue}-${Date.now()}.${file.name.split('.').pop()}`
      const { error } = await supabase.storage
        .from(storageBucket)
        .upload(fileName, file)
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage
        .from(storageBucket)
        .getPublicUrl(fileName)
      setFormData({ ...formData, image_url: publicUrl })
    } catch (err: any) {
      alert(`Upload failed: ${err.message}`)
    }
    setUploading(false)
  }

  async function handleAdd() {
    if (!formData.title || !formData.link_url || !formData.image_url) {
      alert('Please fill in title, link, and upload an image')
      return
    }
    const supabase = createClient()
    const { error } = await supabase.from(table).insert({
      [fkColumn]: fkValue,
      title: formData.title,
      link_url: formData.link_url,
      price: formData.price || null,
      image_url: formData.image_url,
      sort_order: items.length,
    })
    if (error) { alert(error.message); return }
    setFormData({ title: '', link_url: '', price: '', image_url: '' })
    setShowForm(false)
    await loadItems()
  }

  async function handleDelete(id: string) {
    if (!confirm('Remove this merch item?')) return
    const supabase = createClient()
    await supabase.from(table).delete().eq('id', id)
    setItems(items.filter(i => i.id !== id))
  }

  return (
    <section className="card p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-accent" />
          <h2 className="text-lg font-display font-bold">Merch Gallery</h2>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-secondary text-sm">
          {showForm ? <><X className="w-4 h-4 mr-1" /> Cancel</> : <><Plus className="w-4 h-4 mr-1" /> Add Item</>}
        </button>
      </div>

      {showForm && (
        <div className="mb-5 p-4 bg-background-tertiary rounded-lg space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Title *</label>
              <input type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Official T-Shirt"
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm outline-none focus:border-accent" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Price</label>
              <input type="text" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })}
                placeholder="e.g. $25"
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm outline-none focus:border-accent" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Buy Link *</label>
            <input type="text" value={formData.link_url} onChange={e => setFormData({ ...formData, link_url: e.target.value })}
              placeholder="https://prowrestlingtees.com/..."
              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm outline-none focus:border-accent" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Image *</label>
            {formData.image_url ? (
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-background relative">
                  <img src={formData.image_url} alt="" className="w-full h-full object-cover" />
                </div>
                <button onClick={() => setFormData({ ...formData, image_url: '' })} className="text-sm text-red-400 hover:underline">
                  Remove
                </button>
              </div>
            ) : (
              <label className={`inline-flex items-center gap-2 btn btn-secondary text-sm cursor-pointer ${uploading ? 'opacity-50' : ''}`}>
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {uploading ? 'Uploading...' : 'Upload Photo'}
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
              </label>
            )}
          </div>
          <button onClick={handleAdd} className="btn btn-primary text-sm w-full">
            <Plus className="w-4 h-4 mr-1" /> Add Merch Item
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-foreground-muted" /></div>
      ) : items.length === 0 ? (
        <p className="text-sm text-foreground-muted">No merch items yet. Add items to display a merch gallery on your page.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {items.map((item) => (
            <div key={item.id} className="relative rounded-lg overflow-hidden bg-background-tertiary border border-border group">
              <div className="aspect-square relative">
                <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                <button
                  onClick={() => handleDelete(item.id)}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-500/80 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="p-2">
                <p className="text-xs font-semibold truncate">{item.title}</p>
                {item.price && <p className="text-xs text-accent">{item.price}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
