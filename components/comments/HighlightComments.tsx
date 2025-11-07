"use client"

import { useEffect, useMemo, useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase/client'
import { notify } from '@/lib/notify'

export type HighlightComment = {
  id: string
  highlight_id: string
  author_id: string
  content: string
  created_at: string
}

export function HighlightComments({ highlightId, onCountChange }: { highlightId: string, onCountChange?: (n: number) => void }) {
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<HighlightComment[]>([])
  const [me, setMe] = useState<string | null>(null)
  const [content, setContent] = useState('')
  const [names, setNames] = useState<Record<string, string>>({})

  useEffect(() => {
    const load = async () => {
      const supabase = supabaseBrowser()
      const { data: { user } } = await supabase.auth.getUser()
      setMe(user?.id ?? null)
      const { data } = await supabase
        .from('highlight_comments')
        .select('*')
        .eq('highlight_id', highlightId)
        .order('created_at', { ascending: true })
      const list = (data || []) as HighlightComment[]
      setItems(list)
      onCountChange?.(list.length)
      // Load author names
      const authorIds = Array.from(new Set(list.map(x => x.author_id)))
      if (authorIds.length) {
        const [a, c] = await Promise.all([
          supabase.from('athlete_profiles').select('user_id, first_name, last_name').in('user_id', authorIds),
          supabase.from('coach_profiles').select('user_id, first_name, last_name').in('user_id', authorIds),
        ])
        const map: Record<string, string> = {}
        ;(a.data || []).forEach((p: any) => { map[p.user_id] = `${p.first_name || ''} ${p.last_name || ''}`.trim() })
        ;(c.data || []).forEach((p: any) => { map[p.user_id] = map[p.user_id] || `${p.first_name || ''} ${p.last_name || ''}`.trim() })
        setNames(map)
      }
      setLoading(false)
    }
    load()
  }, [highlightId])

  const send = async () => {
    if (!content.trim()) return
    const supabase = supabaseBrowser()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { notify('Connecte-toi pour commenter', 'info'); return }
    const now = new Date().toISOString()
    const optimistic: HighlightComment = {
      id: `temp-${Date.now()}`,
      highlight_id: highlightId,
      author_id: user.id,
      content,
      created_at: now,
    }
    setItems(prev => [...prev, optimistic])
    setContent('')
    onCountChange?.(items.length + 1)
    const { error, data } = await supabase
      .from('highlight_comments')
      .insert({ highlight_id: highlightId, author_id: user.id, content })
      .select('*')
      .single()
    if (error) {
      notify(error.message, 'error')
      return
    }
    setItems(prev => prev.map(x => x.id === optimistic.id ? (data as any) : x))
    notify('Commentaire ajouté', 'success')
  }

  const remove = async (id: string) => {
    const supabase = supabaseBrowser()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const target = items.find(x => x.id === id)
    if (!target) return
    setItems(prev => prev.filter(x => x.id !== id))
    onCountChange?.(items.length - 1)
    const { error } = await supabase.from('highlight_comments').delete().eq('id', id)
    if (error) notify(error.message, 'error')
  }

  const canDelete = (c: HighlightComment) => me && c.author_id === me

  if (loading) return <div className="text-xs text-[#64748B]">Chargement commentaires...</div>

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          className="flex-1 border border-[#CBD5E1] rounded px-3 py-2 text-sm"
          placeholder="Ajouter un commentaire..."
          value={content}
          onChange={(e)=>setContent(e.target.value)}
          onKeyDown={(e)=>{ if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
        />
        <button className="px-3 py-2 rounded bg-[#0F172A] text-white text-sm" onClick={send}>Publier</button>
      </div>
      <div className="space-y-2">
        {items.length === 0 && (
          <div className="text-xs text-[#94A3B8]">Aucun commentaire pour le moment.</div>
        )}
        {items.map(c => (
          <div key={c.id} className="flex items-start justify-between gap-2">
            <div className="space-y-0.5">
              <div className="text-xs text-[#64748B]">{names[c.author_id] || c.author_id} · {new Date(c.created_at).toLocaleString()}</div>
              <div className="text-sm text-[#0F172A] whitespace-pre-wrap">{c.content}</div>
            </div>
            {canDelete(c) && (
              <button className="text-[11px] text-[#EF4444] hover:underline" onClick={()=>remove(c.id)}>Supprimer</button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
