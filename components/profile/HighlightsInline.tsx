"use client"

import { useEffect, useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

type Highlight = {
  id: string
  title: string
  description?: string | null
  video_url?: string | null
  file_path?: string | null
  is_featured: boolean
  created_at: string
}

export function HighlightsInline() {
  const [highlights, setHighlights] = useState<Highlight[]>([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [tags, setTags] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [featureOnAdd, setFeatureOnAdd] = useState(false)

  useEffect(() => {
    const load = async () => {
      const supabase = supabaseBrowser()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('highlights')
        .select('*')
        .eq('athlete_id', user.id)
        .order('created_at', { ascending: false })
      setHighlights((data || []) as any)
    }
    load()
  }, [])

  const add = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!title) { setError('Titre requis'); return }
    const supabase = supabaseBrowser()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Connexion requise'); return }
    setLoading(true)
    try {
      let storedPath: string | null = null
      let finalVideoUrl: string | null = videoUrl || null
      if (file) {
        if (!['video/mp4','video/quicktime'].includes(file.type)) throw new Error('Fichier vidéo MP4/MOV uniquement')
        if (file.size > 500 * 1024 * 1024) throw new Error('Fichier trop volumineux (max 500MB)')
        const path = `${user.id}/${Date.now()}-${file.name.replace(/\s+/g,'_')}`
        const { error: upErr } = await supabase.storage.from('video').upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type })
        if (upErr) throw upErr
        storedPath = path
      }
      const { error: insErr } = await supabase.from('highlights').insert({
        athlete_id: user.id,
        title,
        description: description || null,
        video_url: finalVideoUrl,
        file_path: storedPath,
        tags,
        is_featured: featureOnAdd
      })
      if (insErr) throw insErr
      // If featured on add, unset others
      if (featureOnAdd) {
        await supabase
          .from('highlights')
          .update({ is_featured: false })
          .eq('athlete_id', user.id)
          .neq('title', title) // quick filter to avoid unsetting the newly added by title
      }
      setTitle(''); setDescription(''); setVideoUrl(''); setFile(null); setTags(''); setFeatureOnAdd(false)
      const { data } = await supabase
        .from('highlights')
        .select('*')
        .eq('athlete_id', user.id)
        .order('created_at', { ascending: false })
      setHighlights((data || []) as any)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const remove = async (id: string) => {
    const supabase = supabaseBrowser()
    await supabase.from('highlights').delete().eq('id', id)
    setHighlights(prev => prev.filter(h => h.id !== id))
  }

  const setFeatured = async (id: string) => {
    const supabase = supabaseBrowser()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Connexion requise'); return }
    setLoading(true)
    try {
      await supabase.from('highlights').update({ is_featured: false }).eq('athlete_id', user.id)
      await supabase.from('highlights').update({ is_featured: true }).eq('id', id)
      const { data } = await supabase
        .from('highlights')
        .select('*')
        .eq('athlete_id', user.id)
        .order('created_at', { ascending: false })
      setHighlights((data || []) as any)
    } finally {
      setLoading(false)
    }
  }

  const unsetFeatured = async (id: string) => {
    const supabase = supabaseBrowser()
    await supabase.from('highlights').update({ is_featured: false }).eq('id', id)
    setHighlights(prev => prev.map(h => h.id === id ? { ...h, is_featured: false } : h))
  }

  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-semibold text-[#0F172A]">Mes highlights</h2>

      {/* Featured hero */}
      {highlights.some(h => h.is_featured) && (
        <div className="space-y-3">
          <div className="text-sm text-[#64748B]">Mis en avant</div>
          {(() => {
            const h = highlights.find(x => x.is_featured)!
            return (
              <Card>
                <CardHeader className="space-y-2">
                  <div className="text-h3 font-semibold text-[#0F172A]">{h.title}</div>
                  <div className="text-small text-[#64748B]">{new Date(h.created_at).toLocaleDateString()}</div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {renderVideo(h)}
                  {h.description && <p className="text-sm text-[#1E293B]">{h.description}</p>}
                  <div className="flex gap-2 items-center">
                    <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-700 text-xs">Mis en avant</span>
                    <Button variant="secondary" onClick={() => unsetFeatured(h.id)}>Retirer</Button>
                    <Button variant="secondary" onClick={() => remove(h.id)}>Supprimer</Button>
                  </div>
                </CardContent>
              </Card>
            )
          })()}
        </div>
      )}

      <form className="grid grid-cols-1 md:grid-cols-2 gap-6" onSubmit={add}>
        <div className="md:col-span-2">
          <label className="block text-sm text-[#1E293B] mb-1">Titre</label>
          <Input value={title} onChange={(e)=>setTitle(e.target.value)} required />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm text-[#1E293B] mb-1">Description (optionnel)</label>
          <Textarea value={description} onChange={(e)=>setDescription(e.target.value)} rows={3} />
        </div>
        <div>
          <label className="block text-sm text-[#1E293B] mb-1">Lien (YouTube/Vimeo/Hudl, optionnel)</label>
          <Input placeholder="https://..." value={videoUrl} onChange={(e)=>setVideoUrl(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm text-[#1E293B] mb-1">Upload MP4/MOV (max 500MB)</label>
          <Input type="file" accept="video/mp4,video/quicktime" onChange={(e)=>setFile(e.target.files?.[0]||null)} />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm text-[#1E293B] mb-1">Tags (ex: football, but)</label>
          <Input placeholder="football, but" value={tags} onChange={(e)=>setTags(e.target.value)} />
        </div>
        <div className="md:col-span-2 flex items-center gap-2">
          <input id="featureOnAdd" type="checkbox" checked={featureOnAdd} onChange={(e)=>setFeatureOnAdd(e.target.checked)} />
          <label htmlFor="featureOnAdd" className="text-sm text-[#1E293B]">Mettre en avant</label>
        </div>
        {error && <div className="text-error text-sm md:col-span-2">{error}</div>}
        <div className="md:col-span-2 flex justify-end">
          <Button type="submit" disabled={loading}>{loading?'Ajout...':'Ajouter'}</Button>
        </div>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {highlights.filter(h => !h.is_featured).map((h) => (
          <Card key={h.id}>
            <CardHeader className="space-y-2">
              <div className="text-h3 font-semibold text-[#0F172A]">{h.title}</div>
              <div className="text-small text-[#64748B]">{new Date(h.created_at).toLocaleDateString()}</div>
            </CardHeader>
            <CardContent className="space-y-3">
              {renderVideo(h)}
              {h.description && <p className="text-sm text-[#1E293B]">{h.description}</p>}
              <div className="flex gap-2 items-center">
                {h.is_featured ? (
                  <>
                    <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-700 text-xs">Mis en avant</span>
                    <Button variant="secondary" onClick={() => unsetFeatured(h.id)}>Retirer</Button>
                  </>
                ) : (
                  <Button variant="secondary" onClick={() => setFeatured(h.id)} disabled={loading}>Mettre en avant</Button>
                )}
                <Button variant="secondary" onClick={() => remove(h.id)}>Supprimer</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}

function renderVideo(h: { video_url?: string | null; file_path?: string | null }) {
  if (h.video_url) {
    const src = getEmbedUrl(h.video_url)
    if (src) {
      return (
        <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
          <iframe
            className="w-full h-full"
            src={src}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      )
    }
  }
  if (h.file_path) {
    return (
      <video className="w-full rounded-lg" controls>
        <source src={`/api/video/${h.file_path}`} />
      </video>
    )
  }
  return null
}

function getEmbedUrl(input: string): string | null {
  try {
    const url = new URL(input)
    const host = url.hostname.replace(/^www\./, '')
    // YouTube long URL
    if (host === 'youtube.com' || host === 'm.youtube.com') {
      const p = url.pathname
      if (p.startsWith('/watch')) {
        const v = url.searchParams.get('v')
        return v ? `https://www.youtube.com/embed/${v}` : null
      }
      if (p.startsWith('/shorts/')) {
        const id = p.split('/')[2]
        return id ? `https://www.youtube.com/embed/${id}` : null
      }
      if (p.startsWith('/embed/')) return url.toString()
    }
    // YouTube short URL
    if (host === 'youtu.be') {
      const id = url.pathname.slice(1)
      return id ? `https://www.youtube.com/embed/${id}` : null
    }
    // Vimeo
    if (host === 'vimeo.com') {
      const id = url.pathname.split('/').filter(Boolean)[0]
      return id ? `https://player.vimeo.com/video/${id}` : null
    }
    // Hudl (some links are embeddable as-is)
    if (host.endsWith('hudl.com')) return url.toString()
    return url.toString()
  } catch {
    return null
  }
}
