"use client"

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { supabaseBrowser } from '@/lib/supabase/client'
import { notify } from '@/lib/notify'

 type Fav = {
  id: string
  coach_id: string
  athlete_id: string
  added_at: string
}

 type Profile = {
  user_id: string
  first_name: string | null
  last_name: string | null
  sport: string | null
  country: string | null
  slug: string | null
}

export default function FavoritesPage() {
  const [loading, setLoading] = useState(true)
  const [me, setMe] = useState<string | null>(null)
  const [rows, setRows] = useState<Fav[]>([])
  const [profiles, setProfiles] = useState<Record<string, Profile>>({})
  const [q, setQ] = useState('')
  const [sport, setSport] = useState<string>('all')
  const [country, setCountry] = useState<string>('all')
  const [sort, setSort] = useState<'az' | 'recent'>('recent')

  useEffect(() => {
    const load = async () => {
      const supabase = supabaseBrowser()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      setMe(user.id)
      const { data } = await supabase
        .from('favorites')
        .select('*')
        .eq('coach_id', user.id)
        .order('added_at', { ascending: false })
      const list = (data || []) as Fav[]
      setRows(list)
      const ids = Array.from(new Set(list.map(x => x.athlete_id)))
      if (ids.length) {
        const { data: aps } = await supabase
          .from('athlete_profiles')
          .select('user_id, first_name, last_name, sport, country, slug')
          .in('user_id', ids)
        const map: Record<string, Profile> = {}
        ;(aps || []).forEach((p: any) => { map[p.user_id] = p as Profile })
        setProfiles(map)
      }
      setLoading(false)
    }
    load()
  }, [])

  const sportOptions = useMemo(() => {
    const s = new Set<string>()
    Object.values(profiles).forEach(p => { if (p?.sport) s.add(p.sport) })
    return Array.from(s).sort()
  }, [profiles])

  const countryOptions = useMemo(() => {
    const s = new Set<string>()
    Object.values(profiles).forEach(p => { if (p?.country) s.add(p.country) })
    return Array.from(s).sort()
  }, [profiles])

  const items = useMemo(() => {
    const joined = rows.map(r => ({ r, p: profiles[r.athlete_id] }))
    const filtered = joined.filter(({ r, p }) => {
      if (!p) return false
      const name = `${p.first_name || ''} ${p.last_name || ''}`.toLowerCase()
      const okQ = !q || name.includes(q.toLowerCase())
      const okS = sport === 'all' || p.sport === sport
      const okC = country === 'all' || p.country === country
      return okQ && okS && okC
    })
    if (sort === 'az') {
      filtered.sort((a, b) => {
        const na = `${a.p?.first_name || ''} ${a.p?.last_name || ''}`.trim().toLowerCase()
        const nb = `${b.p?.first_name || ''} ${b.p?.last_name || ''}`.trim().toLowerCase()
        return na.localeCompare(nb)
      })
    } else {
      filtered.sort((a, b) => new Date(b.r.added_at).getTime() - new Date(a.r.added_at).getTime())
    }
    return filtered
  }, [rows, profiles, q, sport, country, sort])

  const remove = async (athleteId: string) => {
    if (!me) return
    const supabase = supabaseBrowser()
    const prev = rows
    setRows(prev.filter(r => r.athlete_id !== athleteId))
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('coach_id', me)
      .eq('athlete_id', athleteId)
    if (error) { notify(error.message, 'error'); setRows(prev) }
  }

  if (!me) return <main className="container-xl py-10">Connecte-toi pour voir tes favoris.</main>

  return (
    <main className="container-xl py-10 space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold text-[#0F172A]">Mes favoris</h1>
        <p className="text-[#64748B]">Athlètes que tu suis</p>
      </header>

      {loading ? (
        <div className="text-sm text-[#64748B]">Chargement...</div>
      ) : items.length === 0 ? (
        <div className="text-sm text-[#64748B]">Aucun favori pour le moment.</div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <input
              className="border border-[#CBD5E1] rounded px-3 py-2 text-sm"
              placeholder="Rechercher..."
              value={q}
              onChange={(e)=>setQ(e.target.value)}
            />
            <select className="border border-[#CBD5E1] rounded px-2 py-2" value={sport} onChange={(e)=>setSport(e.target.value)}>
              <option value="all">Tous sports</option>
              {sportOptions.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select className="border border-[#CBD5E1] rounded px-2 py-2" value={country} onChange={(e)=>setCountry(e.target.value)}>
              <option value="all">Tous pays</option>
              {countryOptions.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className="border border-[#CBD5E1] rounded px-2 py-2" value={sort} onChange={(e)=>setSort(e.target.value as any)}>
              <option value="recent">Plus récent</option>
              <option value="az">A → Z</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map(({ r: f, p }) => {
              const name = p ? `${p.first_name || ''} ${p.last_name || ''}`.trim() : f.athlete_id
              const href = `/u/${p?.slug || f.athlete_id}`
              return (
                <article key={f.id} className="rounded-xl border border-[#E2E8F0] bg-white p-4 flex flex-col gap-2">
                  <div className="text-sm text-[#0F172A] font-medium">{name || 'Athlète'}</div>
                  <div className="text-xs text-[#64748B]">{[p?.sport, p?.country].filter(Boolean).join(' · ')}</div>
                  <div className="mt-2 flex items-center gap-3">
                    <Link href={href} className="text-[#2563EB] text-sm">Voir le profil</Link>
                    <button className="text-[#EF4444] text-sm hover:underline" onClick={() => remove(f.athlete_id)}>Ne plus suivre</button>
                  </div>
                </article>
              )
            })}
          </div>
        </>
      )}
    </main>
  )
}
