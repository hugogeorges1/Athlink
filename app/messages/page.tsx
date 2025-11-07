"use client"

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase/client'

 type Row = {
  id: string
  sender_id: string
  recipient_id: string
  content: string
  sent_at: string
  read_at: string | null
}

export default function MessagesInboxPage() {
  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState<Row[]>([])
  const [me, setMe] = useState<string | null>(null)
  const [names, setNames] = useState<Record<string, string>>({})
  const [unreadByPeer, setUnreadByPeer] = useState<Record<string, number>>({})

  useEffect(() => {
    const load = async () => {
      const supabase = supabaseBrowser()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      setMe(user.id)
      const { data } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order('sent_at', { ascending: false })
      const list = (data || []) as Row[]
      setRows(list)
      // compute unread counts per peer
      const unread: Record<string, number> = {}
      list.forEach(m => {
        const peer = m.sender_id === user.id ? m.recipient_id : m.sender_id
        if (m.recipient_id === user.id && m.read_at == null) {
          unread[peer] = (unread[peer] || 0) + 1
        }
      })
      setUnreadByPeer(unread)
      // Build peer set and load names
      const peers = new Set<string>()
      ;(data || []).forEach((m: Row) => {
        peers.add(m.sender_id === user.id ? m.recipient_id : m.sender_id)
      })
      if (peers.size) {
        const ids = Array.from(peers)
        const [a, c] = await Promise.all([
          supabase.from('athlete_profiles').select('user_id, first_name, last_name').in('user_id', ids),
          supabase.from('coach_profiles').select('user_id, first_name, last_name').in('user_id', ids)
        ])
        const map: Record<string, string> = {}
        ;(a.data || []).forEach((p: any) => { map[p.user_id] = `${p.first_name || ''} ${p.last_name || ''}`.trim() })
        ;(c.data || []).forEach((p: any) => { map[p.user_id] = map[p.user_id] || `${p.first_name || ''} ${p.last_name || ''}`.trim() })
        setNames(map)
      }
      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    if (!me) return
    const supabase = supabaseBrowser()
    const channel = supabase
      .channel('inbox-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `recipient_id=eq.${me}` }, (payload: any) => {
        const m = payload.new as Row
        setUnreadByPeer(prev => ({ ...prev, [m.sender_id]: (prev[m.sender_id] || 0) + 1 }))
        setRows(prev => [m, ...prev])
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: `recipient_id=eq.${me}` }, (payload: any) => {
        const wasUnread = payload?.old?.read_at == null
        const isRead = payload?.new?.read_at != null
        const sender = (payload?.new as any)?.sender_id as string
        if (wasUnread && isRead && sender) {
          setUnreadByPeer(prev => ({ ...prev, [sender]: Math.max(0, (prev[sender] || 0) - 1) }))
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [me])

  const threads = useMemo(() => {
    const map = new Map<string, Row>()
    for (const m of rows) {
      const peer = m.sender_id === me ? m.recipient_id : m.sender_id
      const prev = map.get(peer)
      if (!prev || new Date(m.sent_at).getTime() > new Date(prev.sent_at).getTime()) {
        map.set(peer, m)
      }
    }
    return Array.from(map.entries()).map(([peerId, lastMsg]) => ({ peerId, lastMsg }))
  }, [rows, me])

  if (loading) return <main className="container-xl py-10">Chargement...</main>
  if (!me) return <main className="container-xl py-10">Connecte-toi pour voir tes messages.</main>

  return (
    <main className="container-xl py-10 space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold text-[#0F172A]">Messagerie</h1>
        <p className="text-[#64748B]">Tes conversations</p>
      </header>
      <div className="divide-y divide-[#E2E8F0] rounded-xl border border-[#E2E8F0] bg-white">
        {threads.length === 0 && (
          <div className="p-4 text-sm text-[#64748B]">Aucune conversation pour le moment.</div>
        )}
        {threads.map(({ peerId, lastMsg }) => (
          <Link key={peerId} href={`/messages/${peerId}`} className="flex items-center justify-between p-4 hover:bg-[#F8FAFC]">
            <div className="space-y-1">
              <div className="text-sm text-[#64748B]">Avec</div>
              <div className="font-medium text-[#0F172A] break-all flex items-center gap-2">
                <span>{names[peerId] || peerId}{unreadByPeer[peerId] ? ' 🆕' : ''}</span>
                {!!unreadByPeer[peerId] && (
                  <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-[#EF4444] text-white text-[10px]">
                    {unreadByPeer[peerId]}
                  </span>
                )}
              </div>
              <div className="text-sm text-[#475569] line-clamp-1">{lastMsg.content}</div>
            </div>
            <div className="text-xs text-[#94A3B8]">{new Date(lastMsg.sent_at).toLocaleString()}</div>
          </Link>
        ))}
      </div>
    </main>
  )
}
