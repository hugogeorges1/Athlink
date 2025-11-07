"use client"

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { supabaseBrowser } from '@/lib/supabase/client'
import { notify } from '@/lib/notify'
import { HighlightComments } from '@/components/comments/HighlightComments'

type Highlight = {
  id: string
  athlete_id: string
  title: string
  description?: string | null
  video_url?: string | null
  file_path?: string | null
  tags?: string | null
  created_at: string
}

type AthleteProfileLite = {
  user_id: string
  first_name: string | null
  last_name: string | null
  sport: string | null
  country: string | null
  level?: string | null
  level_base?: string | null
  slug?: string | null
}

function getEmbedUrl(input?: string | null): string | null {
  if (!input) return null
  try {
    const url = new URL(input)
    const host = url.hostname.replace(/^www\./, '')
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
    if (host === 'youtu.be') {
      const id = url.pathname.slice(1)
      return id ? `https://www.youtube.com/embed/${id}` : null
    }
    if (host === 'vimeo.com') {
      const id = url.pathname.split('/').filter(Boolean)[0]
      return id ? `https://player.vimeo.com/video/${id}` : null
    }
    if (host.endsWith('hudl.com')) return url.toString()
    return url.toString()
  } catch {
    return null
  }
}

export default function DiscoverPage() {
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<Highlight[]>([])
  const [profiles, setProfiles] = useState<Record<string, AthleteProfileLite>>({})
  const [likes, setLikes] = useState<Record<string, number>>({})
  const [liked, setLiked] = useState<Record<string, boolean>>({})
  const [me, setMe] = useState<string | null>(null)
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({})
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({})
  const [followers, setFollowers] = useState<Record<string, number>>({})
  const [q, setQ] = useState('')
  const [type, setType] = useState<'all' | 'link' | 'file'>('all')
  const [sport, setSport] = useState<string>('all')
  const [country, setCountry] = useState<string>('all')
  const [page, setPage] = useState<number>(1)
  const pageSize = 24

  useEffect(() => {
    const load = async () => {
      const supabase = supabaseBrowser()
      const to = page * pageSize - 1
      const { data } = await supabase
        .from('highlights')
        .select('id, athlete_id, title, description, video_url, file_path, tags, created_at')
        .order('created_at', { ascending: false })
        .range(0, to)
      const list = (data || []) as Highlight[]
      setItems(list)

      // Load athlete profiles for display and filters
      const athleteIds = Array.from(new Set(list.map(x => x.athlete_id)))
      if (athleteIds.length) {
        const { data: profs } = await supabase
          .from('athlete_profiles')
          .select('user_id, first_name, last_name, sport, country, level, level_base, slug')
          .in('user_id', athleteIds)
        const map: Record<string, AthleteProfileLite> = {}
        ;(profs || []).forEach((p: any) => { map[p.user_id] = p as AthleteProfileLite })
        setProfiles(map)
      }

      // Load like counts and user likes (best-effort)
      const { data: { user } } = await supabase.auth.getUser()
      setMe(user?.id ?? null)
      const likeCounts: Record<string, number> = {}
      const likedMap: Record<string, boolean> = {}
      await Promise.all(list.map(async (h) => {
        const { count } = await supabase
          .from('highlight_likes')
          .select('*', { count: 'exact', head: true })
          .eq('highlight_id', h.id)
        likeCounts[h.id] = count || 0
        if (user) {
          const { count: c2 } = await supabase
            .from('highlight_likes')
            .select('*', { count: 'exact', head: true })
            .eq('highlight_id', h.id)
            .eq('user_id', user.id)
          likedMap[h.id] = (c2 || 0) > 0
        }
      }))
      setLikes(likeCounts)
      setLiked(likedMap)
      // comment counts
      const cc: Record<string, number> = {}
      await Promise.all(list.map(async (h) => {
        const { count } = await supabase
          .from('highlight_comments')
          .select('*', { count: 'exact', head: true })
          .eq('highlight_id', h.id)
        cc[h.id] = count || 0
      }))
      setCommentCounts(cc)
      // followers count per athlete
      const fcounts: Record<string, number> = {}
      const uniqueAthletes = Array.from(new Set(list.map(h => h.athlete_id)))
      await Promise.all(uniqueAthletes.map(async (aid) => {
        const { count: fc } = await supabase
          .from('favorites')
          .select('*', { count: 'exact', head: true })
          .eq('athlete_id', aid)
        fcounts[aid] = fc || 0
      }))
      setFollowers(fcounts)
      setLoading(false)
    }
    load()
  }, [page])

  const filtered = useMemo(() => {
    return items.filter(h => {
      const text = `${h.title} ${h.description || ''} ${h.tags || ''}`.toLowerCase()
      const okQ = !q || text.includes(q.toLowerCase())
      const okT = type === 'all' || (type === 'link' ? !!h.video_url : !!h.file_path)
      const prof = profiles[h.athlete_id]
      const okS = sport === 'all' || (prof?.sport || '').toLowerCase() === sport.toLowerCase()
      const okC = country === 'all' || (prof?.country || '').toLowerCase() === country.toLowerCase()
      return okQ && okT && okS && okC
    })
  }, [items, q, type, sport, country, profiles])

  const sportOptions = useMemo(() => {
    const set = new Set<string>()
    Object.values(profiles).forEach(p => { if (p?.sport) set.add(p.sport) })
    return Array.from(set).sort()
  }, [profiles])

  const countryOptions = useMemo(() => {
    const set = new Set<string>()
    Object.values(profiles).forEach(p => { if (p?.country) set.add(p.country) })
    return Array.from(set).sort()
  }, [profiles])

  const toggleLike = async (h: Highlight) => {
    const supabase = supabaseBrowser()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      notify('Connecte-toi pour liker', 'info')
      return
    }
    const isLiked = liked[h.id]
    if (isLiked) {
      await supabase.from('highlight_likes').delete().eq('highlight_id', h.id).eq('user_id', user.id)
      setLiked(prev => ({ ...prev, [h.id]: false }))
      setLikes(prev => ({ ...prev, [h.id]: Math.max(0, (prev[h.id] || 0) - 1) }))
      notify('Like retiré', 'info')
    } else {
      await supabase.from('highlight_likes').insert({ highlight_id: h.id, user_id: user.id })
      setLiked(prev => ({ ...prev, [h.id]: true }))
      setLikes(prev => ({ ...prev, [h.id]: (prev[h.id] || 0) + 1 }))
      notify('Like ajouté', 'success')
    }
  }

  return (
    <main className="container-xl py-10 space-y-8">
      <header className="space-y-2">
        <h1 className="text-4xl font-bold text-[#0F172A]">Découvrir</h1>
        <p className="text-[#64748B]">Derniers highlights publiés par les athlètes</p>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <input
          className="border border-[#CBD5E1] rounded px-3 py-2 text-sm w-full sm:w-80"
          placeholder="Rechercher (titre, tags)"
          value={q}
          onChange={(e)=>setQ(e.target.value)}
        />
        <select
          className="border border-[#CBD5E1] rounded px-3 py-2 text-sm"
          value={type}
          onChange={(e)=>setType(e.target.value as any)}
        >
          <option value="all">Tous</option>
          <option value="link">Liens (YouTube/Vimeo)</option>
          <option value="file">Fichiers (MP4/MOV)</option>
        </select>
        <select
          className="border border-[#CBD5E1] rounded px-3 py-2 text-sm"
          value={sport}
          onChange={(e)=>setSport(e.target.value)}
        >
          <option value="all">Tous les sports</option>
          {sportOptions.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select
          className="border border-[#CBD5E1] rounded px-3 py-2 text-sm"
          value={country}
          onChange={(e)=>setCountry(e.target.value)}
        >
          <option value="all">Tous les pays</option>
          {countryOptions.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="text-sm text-[#64748B]">Chargement...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((h) => {
            const src = getEmbedUrl(h.video_url)
            return (
              <article key={h.id} className="rounded-xl border border-[#E2E8F0] overflow-hidden bg-white">
                <div className="relative aspect-video w-full bg-black">
                  {(() => {
                    const created = new Date(h.created_at).getTime()
                    const seven = 7 * 24 * 60 * 60 * 1000
                    const isNew = Date.now() - created <= seven
                    return isNew ? (
                      <span className="absolute left-2 top-2 z-10 text-[10px] px-2 py-0.5 rounded bg-[#F97316] text-white">Nouveau</span>
                    ) : null
                  })()}
                  {src ? (
                    <iframe
                      className="w-full h-full"
                      src={src}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  ) : h.file_path ? (
                    <video className="w-full h-full" controls>
                      <source src={`/api/video/${h.file_path}`} />
                    </video>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/60 text-sm">Aperçu indisponible</div>
                  )}
                </div>
                <div className="p-4 space-y-2">
                  <h3 className="font-semibold text-[#0F172A] line-clamp-2">{h.title}</h3>
                  {h.description && <p className="text-sm text-[#475569] line-clamp-2">{h.description}</p>}
                  <div className="flex items-center justify-between text-xs text-[#64748B]">
                    <span>
                      {new Date(h.created_at).toLocaleDateString()} · {profiles[h.athlete_id]?.first_name || ''} {profiles[h.athlete_id]?.last_name || ''}
                      {profiles[h.athlete_id]?.sport ? ` · ${profiles[h.athlete_id]?.sport}` : ''}
                      {profiles[h.athlete_id]?.country ? ` · ${profiles[h.athlete_id]?.country}` : ''}
                      {profiles[h.athlete_id]?.level || profiles[h.athlete_id]?.level_base ? ` · ${profiles[h.athlete_id]?.level || profiles[h.athlete_id]?.level_base}` : ''}
                      {` · ${followers[h.athlete_id] || 0} followers`}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${liked[h.id] ? 'bg-[#FEE2E2] text-[#B91C1C]' : 'bg-[#F1F5F9] text-[#334155]'}`}
                        onClick={() => toggleLike(h)}
                      >
                        <span>❤</span>
                        <span>{likes[h.id] || 0}</span>
                      </button>
                      <button
                        className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-[#F1F5F9] text-[#334155]"
                        onClick={() => setOpenComments(prev => ({ ...prev, [h.id]: !prev[h.id] }))}
                      >
                        <span>💬</span>
                        <span>{commentCounts[h.id] || 0}</span>
                      </button>
                    </div>
                  </div>
                  <div className="pt-2">
                    <div className="flex items-center gap-3">
                      <Link href={`/u/${profiles[h.athlete_id]?.slug || h.athlete_id}`} className="text-[#2563EB] text-sm">Voir le profil</Link>
                      {(!me || me !== h.athlete_id) && (
                        <Link href={`/messages/${h.athlete_id}`} className="text-sm text-white bg-[#0F172A] px-2 py-1 rounded hover:opacity-90">Message</Link>
                      )}
                    </div>
                  </div>
                  {openComments[h.id] && (
                    <div className="pt-3 border-t border-[#E2E8F0]">
                      <HighlightComments
                        highlightId={h.id}
                        onCountChange={(n: number)=> setCommentCounts(prev => ({ ...prev, [h.id]: n }))}
                      />
                    </div>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}

      <div className="flex justify-center pt-2">
        <button
          className="px-4 py-2 rounded bg-[#F1F5F9] text-[#0F172A] hover:bg-[#E2E8F0] text-sm"
          onClick={() => setPage(p => p + 1)}
        >
          Charger plus
        </button>
      </div>
    </main>
  )
}
