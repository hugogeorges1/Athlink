"use client"

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabase/client'
import { notify } from '@/lib/notify'

 type Row = {
  id: string
  sender_id: string
  recipient_id: string
  content: string
  sent_at: string
  read_at: string | null
}

export default function MessageThreadPage() {
  const params = useParams<{ peerId: string }>()
  const search = useSearchParams()
  const peerId = params.peerId
  const [loading, setLoading] = useState(true)
  const [me, setMe] = useState<string | null>(null)
  const [rows, setRows] = useState<Row[]>([])
  const [content, setContent] = useState('')
  const endRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const load = async () => {
      const supabase = supabaseBrowser()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      setMe(user.id)
      const { data } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},recipient_id.eq.${peerId}),and(sender_id.eq.${peerId},recipient_id.eq.${user.id})`)
        .order('sent_at', { ascending: true })
      setRows((data || []) as Row[])
      // Mark as read messages received from this peer
      await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('recipient_id', user.id)
        .eq('sender_id', peerId)
        .is('read_at', null)
      setLoading(false)
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
      // prefill message content if provided and only if empty
      const prefill = search.get('prefill')
      if (prefill && !content) {
        setContent(prefill)
      }
    }
    load()
  }, [peerId])

  const send = async () => {
    if (!content.trim()) return
    const supabase = supabaseBrowser()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { alert('Connecte-toi pour envoyer un message'); return }
    const now = new Date().toISOString()
    const optimistic: Row = {
      id: `temp-${Date.now()}`,
      sender_id: user.id,
      recipient_id: peerId,
      content,
      sent_at: now,
      read_at: null
    }
    setRows(prev => [...prev, optimistic])
    setContent('')
    setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    const { error } = await supabase.from('messages').insert({ sender_id: user.id, recipient_id: peerId, content })
    if (error) {
      alert(error.message)
      // rollback optimistic if needed
    }
    try {
      await fetch('/api/notify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'message',
          recipientId: peerId,
          preview: content.slice(0, 120)
        })
      })
    } catch {}
    notify('Message envoyé', 'success')
  }

  if (loading) return <main className="container-xl py-10">Chargement...</main>
  if (!me) return <main className="container-xl py-10">Connecte-toi pour voir cette conversation.</main>

  return (
    <main className="container-xl py-10 space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-[#0F172A]">Conversation</h1>
          <div className="text-sm text-[#64748B] break-all">Avec: {peerId}</div>
        </div>
        <Link href="/messages" className="text-sm text-[#2563EB]">← Retour</Link>
      </div>

      <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 h-[60vh] overflow-y-auto">
        {rows.map(m => (
          <div key={m.id} className={`max-w-[80%] mb-3 ${m.sender_id === me ? 'ml-auto' : ''}`}>
            <div className={`px-3 py-2 rounded-lg text-sm ${m.sender_id === me ? 'bg-[#0F172A] text-white' : 'bg-[#F1F5F9] text-[#0F172A]'}`}>
              {m.content}
            </div>
            <div className="text-[10px] text-[#94A3B8] mt-1">{new Date(m.sent_at).toLocaleString()}</div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div className="flex gap-2">
        <input
          className="flex-1 border border-[#CBD5E1] rounded px-3 py-2 text-sm"
          placeholder="Écrire un message..."
          value={content}
          onChange={(e)=>setContent(e.target.value)}
          onKeyDown={(e)=>{ if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
        />
        <button
          className="px-4 py-2 rounded bg-[#0F172A] text-white text-sm hover:opacity-90"
          onClick={send}
        >Envoyer</button>
      </div>
    </main>
  )
}
