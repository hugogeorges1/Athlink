"use client"

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { supabaseBrowser } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export type PublicHighlight = {
  id: string
  title: string
  description?: string | null
  video_url?: string | null
  file_path?: string | null
  is_featured: boolean
  created_at: string
}

export function HighlightsPublic({ athleteId }: { athleteId: string }) {
  const [highlights, setHighlights] = useState<PublicHighlight[]>([])
  const [likes, setLikes] = useState<Record<string, number>>({})
  const [likedByMe, setLikedByMe] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const load = async () => {
      const supabase = supabaseBrowser()
      const { data } = await supabase
        .from('highlights')
        .select('*')
        .eq('athlete_id', athleteId)
        .order('created_at', { ascending: false })
      const list = (data || []) as any as PublicHighlight[]
      setHighlights(list)

      // Load likes counts
      const likesMap: Record<string, number> = {}
      for (const h of list) {
        const { count } = await supabase
          .from('highlight_likes')
          .select('*', { count: 'exact', head: true })
          .eq('highlight_id', h.id)
        likesMap[h.id] = count || 0
      }
      setLikes(likesMap)

      // Load my likes
      const { data: session } = await supabase.auth.getUser()
      const userId = session.user?.id
      if (userId) {
        const likedMap: Record<string, boolean> = {}
        for (const h of list) {
          const { count } = await supabase
            .from('highlight_likes')
            .select('*', { count: 'exact', head: true })
            .eq('highlight_id', h.id)
            .eq('user_id', userId)
          likedMap[h.id] = (count || 0) > 0
        }
        setLikedByMe(likedMap)
      } else {
        setLikedByMe({})
      }
    }
    load()
  }, [athleteId])

  const featured = useMemo(() => highlights.find(h => h.is_featured), [highlights])
  const rest = useMemo(() => highlights.filter(h => !h.is_featured), [highlights])

  const toggleLike = async (h: PublicHighlight) => {
    const supabase = supabaseBrowser()
    const { data: session } = await supabase.auth.getUser()
    const userId = session.user?.id
    if (!userId) {
      window.location.href = `/auth/sign-in?next=/u/${athleteId}`
      return
    }
    setLoading(true)
    try {
      if (likedByMe[h.id]) {
        await supabase.from('highlight_likes').delete().match({ highlight_id: h.id, user_id: userId })
        setLikedByMe(prev => ({ ...prev, [h.id]: false }))
        setLikes(prev => ({ ...prev, [h.id]: Math.max(0, (prev[h.id] || 1) - 1) }))
      } else {
        await supabase.from('highlight_likes').insert({ highlight_id: h.id, user_id: userId })
        setLikedByMe(prev => ({ ...prev, [h.id]: true }))
        setLikes(prev => ({ ...prev, [h.id]: (prev[h.id] || 0) + 1 }))
      }
    } finally {
      setLoading(false)
    }
  }

  const renderCard = (h: PublicHighlight, hero = false) => (
    <Card key={h.id}>
      <CardHeader className="space-y-2">
        <div className={hero ? 'text-2xl md:text-3xl font-semibold text-[#0F172A]' : 'text-h3 font-semibold text-[#0F172A]'}>{h.title}</div>
        <div className="text-small text-[#64748B]">{new Date(h.created_at).toLocaleDateString()}</div>
      </CardHeader>
      <CardContent className="space-y-3">
        {h.video_url ? (
          <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
            <iframe className="w-full h-full" src={h.video_url.replace('watch?v=','embed/')} allowFullScreen/>
          </div>
        ) : h.file_path ? (
          <video className="w-full rounded-lg" controls>
            <source src={`/api/video/${h.file_path}`} />
          </video>
        ) : null}
        {h.description && <p className="text-sm text-[#1E293B]">{h.description}</p>}
        <div className="flex items-center gap-3">
          <Button variant="secondary" disabled={loading} onClick={() => toggleLike(h)}>
            {likedByMe[h.id] ? 'Je n\'aime plus' : 'J\'aime'}
          </Button>
          <span className="text-sm text-[#64748B]">{likes[h.id] || 0} like(s)</span>
        </div>
      </CardContent>
    </Card>
  )

  if (!highlights.length) return <div className="text-sm text-[#64748B]">Aucun highlight pour le moment.</div>

  return (
    <section className="space-y-8">
      {featured && (
        <div className="space-y-3">
          <div className="text-sm text-[#64748B]">Mis en avant</div>
          {renderCard(featured, true)}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rest.map(h => renderCard(h))}
      </div>
    </section>
  )
}
