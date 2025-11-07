"use client"

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabase/client'

 type Athlete = {
  user_id: string
  first_name: string | null
  last_name: string | null
  sport: string | null
  country: string | null
  position: string | null
  level: string | null
  level_base: string | null
  height: number | null
  expected_graduation_year: number | null
  slug: string | null
}

export default function SearchPage() {
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<Athlete[]>([])
  const [count, setCount] = useState<number>(0)
  const router = useRouter()
  const search = useSearchParams()
  const pathname = usePathname()

  // Filters
  const [q, setQ] = useState('')
  const [sport, setSport] = useState('Football')
  const [country, setCountry] = useState('France')
  const [position, setPosition] = useState('all')
  const [level, setLevel] = useState('all')
  const [hMin, setHMin] = useState<string>('')
  const [hMax, setHMax] = useState<string>('')
  const [grad, setGrad] = useState<string>('')
  const [aMin, setAMin] = useState<string>('')
  const [aMax, setAMax] = useState<string>('')
  const [sort, setSort] = useState<'recent' | 'az' | 'height'>('recent')

  const [sportOptions, setSportOptions] = useState<string[]>(['Football'])
  const [countryOptions, setCountryOptions] = useState<string[]>(['France'])

  const [page, setPage] = useState(1)
  const pageSize = 24
  // Saved searches
  const [saved, setSaved] = useState<Array<{ id: string, name: string, params: any }>>([])
  const [saveName, setSaveName] = useState('')

  // Initialize filters from URL once
  useEffect(() => {
    const qs = search
    if (!qs) return
    setQ(qs.get('q') || '')
    setSport(qs.get('sport') || 'Football')
    setCountry(qs.get('country') || 'France')
    setPosition(qs.get('position') || 'all')
    setLevel(qs.get('level') || 'all')
    setHMin(qs.get('hmin') || '')
    setHMax(qs.get('hmax') || '')
    setGrad(qs.get('grad') || '')
    setAMin(qs.get('amin') || '')
    setAMax(qs.get('amax') || '')
    setSort((qs.get('sort') as any) || 'recent')
    const p = Number(qs.get('page') || '1')
    setPage(Number.isFinite(p) && p > 0 ? p : 1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Load saved searches
  useEffect(() => {
    const loadSaved = async () => {
      const supabase = supabaseBrowser()
      const { data } = await supabase
        .from('saved_searches')
        .select('id,name,params')
        .order('created_at', { ascending: false })
      setSaved((data as any) || [])
    }
    loadSaved()
  }, [])

  // Sync URL when filters change
  useEffect(() => {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (sport !== 'all') params.set('sport', sport)
    if (country !== 'all') params.set('country', country)
    if (position !== 'all') params.set('position', position)
    if (level !== 'all') params.set('level', level)
    if (hMin) params.set('hmin', hMin)
    if (hMax) params.set('hmax', hMax)
    if (grad) params.set('grad', grad)
    if (aMin) params.set('amin', aMin)
    if (aMax) params.set('amax', aMax)
    if (sort !== 'recent') params.set('sort', sort)
    if (page > 1) params.set('page', String(page))
    const qs = params.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname)
  }, [q, sport, country, position, level, hMin, hMax, grad, aMin, aMax, sort, page, pathname, router])

  // Country fixed to France, sport fixed to Football
  useEffect(() => {
    setSportOptions(['Football'])
    setCountryOptions(['France'])
  }, [])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const supabase = supabaseBrowser()
      let query = supabase
        .from('athlete_profiles')
        .select('user_id, first_name, last_name, sport, country, position, level, level_base, height, expected_graduation_year, slug', { count: 'exact' })

      if (q) {
        const term = `%${q}%`
        query = query.or(`first_name.ilike.${term},last_name.ilike.${term}`)
      }
      // Sport is restricted to Football
      query = query.eq('sport', 'Football')
      // Country is restricted to France
      query = query.eq('country', 'France')
      if (position !== 'all') query = query.eq('position', position)
      if (level !== 'all') query = query.or(`level.eq.${level},level_base.eq.${level}`)
      if (hMin) query = query.gte('height', Number(hMin))
      if (hMax) query = query.lte('height', Number(hMax))
      if (grad) query = query.eq('expected_graduation_year', Number(grad))
      // Age filter: amin (min age) => birth_date <= today - amin years; amax (max age) => birth_date >= today - amax years
      try {
        const today = new Date()
        if (aMin) {
          const years = Number(aMin)
          if (!Number.isNaN(years)) {
            const d = new Date(Date.UTC(today.getUTCFullYear() - years, today.getUTCMonth(), today.getUTCDate()))
            query = query.lte('birth_date', d.toISOString().slice(0, 10))
          }
        }
        if (aMax) {
          const years = Number(aMax)
          if (!Number.isNaN(years)) {
            const d = new Date(Date.UTC(today.getUTCFullYear() - years, today.getUTCMonth(), today.getUTCDate()))
            query = query.gte('birth_date', d.toISOString().slice(0, 10))
          }
        }
      } catch {}

      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      // Sorting
      if (sort === 'az') {
        query = query.order('last_name', { ascending: true, nullsFirst: false })
      } else if (sort === 'height') {
        query = query.order('height', { ascending: false, nullsFirst: false })
      } else {
        query = query.order('updated_at', { ascending: false, nullsFirst: false })
      }

      const { data, error, count: total } = await query.range(from, to)
      if (error) {
        console.error(error)
        setItems([])
        setCount(0)
      } else {
        setItems((data || []) as Athlete[])
        setCount(total || 0)
      }
      setLoading(false)
    }
    load()
  }, [q, sport, country, position, level, hMin, hMax, grad, aMin, aMax, sort, page])

  const totalPages = useMemo(() => Math.max(1, Math.ceil(count / pageSize)), [count])

  const currentParams = useMemo(() => ({ q, sport, country, position, level, hmin: hMin, hmax: hMax, grad, amin: aMin, amax: aMax, sort }), [q, sport, country, position, level, hMin, hMax, grad, aMin, aMax, sort])

  const saveSearch = async () => {
    if (!saveName.trim()) return
    const supabase = supabaseBrowser()
    const payload = { name: saveName.trim(), params: currentParams }
    const { data, error } = await supabase.from('saved_searches').insert(payload).select('id,name,params').single()
    if (!error && data) {
      setSaved(prev => [data as any, ...prev])
      setSaveName('')
    }
  }

  const applySaved = (params: any) => {
    setQ(params.q || '')
    setSport(params.sport || 'all')
    setCountry(params.country || 'all')
    setPosition(params.position || 'all')
    setLevel(params.level || 'all')
    setHMin(params.hmin || '')
    setHMax(params.hmax || '')
    setGrad(params.grad || '')
    setAMin(params.amin || '')
    setAMax(params.amax || '')
    setSort((params.sort as any) || 'recent')
    setPage(1)
  }

  const deleteSaved = async (id: string) => {
    const supabase = supabaseBrowser()
    const { error } = await supabase.from('saved_searches').delete().eq('id', id)
    if (!error) setSaved(prev => prev.filter(s => s.id !== id))
  }

  return (
    <main className="container-xl py-10 space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold text-[#0F172A]">Recherche avancée</h1>
        <p className="text-[#64748B]">Filtre les athlètes par critères</p>
      </header>

      <section className="rounded-xl border border-[#E2E8F0] bg-white p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
          <input className="border border-[#CBD5E1] rounded px-3 py-2 text-sm" placeholder="Nom…" value={q} onChange={(e)=>{ setPage(1); setQ(e.target.value) }} />
          <select className="border border-[#CBD5E1] rounded px-2 py-2 text-sm" value={sport} onChange={(e)=>{ setPage(1); setSport(e.target.value) }}>
            <option value="all">Tous sports</option>
            {sportOptions.map(s => (<option key={s} value={s}>{s}</option>))}
          </select>
          <select className="border border-[#CBD5E1] rounded px-2 py-2 text-sm" value={country} onChange={(e)=>{ setPage(1); setCountry(e.target.value) }}>
            {countryOptions.map(c => (<option key={c} value={c}>{c}</option>))}
          </select>
          <select className="border border-[#CBD5E1] rounded px-2 py-2 text-sm" value={position} onChange={(e)=>{ setPage(1); setPosition(e.target.value) }}>
            <option value="all">Tous postes</option>
            <option value="Gardien de but">Gardien de but</option>
            <option value="Défenseur">Défenseur</option>
            <option value="Milieu">Milieu</option>
            <option value="Attaquant">Attaquant</option>
          </select>
          <select className="border border-[#CBD5E1] rounded px-2 py-2 text-sm" value={level} onChange={(e)=>{ setPage(1); setLevel(e.target.value) }}>
            <option value="all">Tous niveaux</option>
            <option value="Départemental">Départemental</option>
            <option value="Régional">Régional</option>
            <option value="National">National</option>
          </select>
          <div className="flex gap-2">
            <input className="border border-[#CBD5E1] rounded px-3 py-2 text-sm w-full" placeholder="Taille min (cm)" inputMode="numeric" value={hMin} onChange={(e)=>{ setPage(1); setHMin(e.target.value) }} />
            <input className="border border-[#CBD5E1] rounded px-3 py-2 text-sm w-full" placeholder="Taille max (cm)" inputMode="numeric" value={hMax} onChange={(e)=>{ setPage(1); setHMax(e.target.value) }} />
          </div>
          <input className="border border-[#CBD5E1] rounded px-3 py-2 text-sm" placeholder="Promo (année)" inputMode="numeric" value={grad} onChange={(e)=>{ setPage(1); setGrad(e.target.value) }} />
          <div className="flex gap-2">
            <input className="border border-[#CBD5E1] rounded px-3 py-2 text-sm w-full" placeholder="Âge min" inputMode="numeric" value={aMin} onChange={(e)=>{ setPage(1); setAMin(e.target.value) }} />
            <input className="border border-[#CBD5E1] rounded px-3 py-2 text-sm w-full" placeholder="Âge max" inputMode="numeric" value={aMax} onChange={(e)=>{ setPage(1); setAMax(e.target.value) }} />
          </div>
          <select className="border border-[#CBD5E1] rounded px-2 py-2 text-sm" value={sort} onChange={(e)=>{ setPage(1); setSort(e.target.value as any) }}>
            <option value="recent">Plus récent</option>
            <option value="az">A → Z</option>
            <option value="height">Taille</option>
          </select>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input className="border border-[#CBD5E1] rounded px-3 py-2 text-sm" placeholder="Nom de la recherche" value={saveName} onChange={(e)=>setSaveName(e.target.value)} />
          <button className="px-3 py-2 rounded bg-[#0F172A] text-white text-sm disabled:opacity-50" disabled={!saveName.trim()} onClick={saveSearch}>Enregistrer</button>
        </div>
        {saved.length > 0 && (
          <div className="mt-4">
            <div className="text-xs text-[#64748B] mb-2">Recherches enregistrées</div>
            <div className="flex flex-wrap gap-2">
              {saved.map(s => (
                <div key={s.id} className="inline-flex items-center gap-2 border border-[#E2E8F0] rounded px-2 py-1 text-xs">
                  <button className="text-[#2563EB]" onClick={()=>applySaved(s.params)}>{s.name}</button>
                  <button className="text-[#EF4444]" onClick={()=>deleteSaved(s.id)}>Supprimer</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {loading ? (
        <div className="text-sm text-[#64748B]">Chargement…</div>
      ) : (
        <>
          <div className="text-xs text-[#64748B]">{count} résultats</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map(p => {
              const name = `${p.first_name || ''} ${p.last_name || ''}`.trim() || p.user_id
              const href = `/u/${p.slug || p.user_id}`
              return (
                <article key={p.user_id} className="rounded-xl border border-[#E2E8F0] bg-white p-4 flex flex-col gap-2">
                  <div className="text-sm text-[#0F172A] font-medium">{name}</div>
                  <div className="text-xs text-[#64748B]">{[p.sport, p.position, p.level || p.level_base, p.country].filter(Boolean).join(' · ')}</div>
                  <div className="text-xs text-[#64748B]">{p.height ? `${p.height} cm` : ''}{p.expected_graduation_year ? ` · Promo ${p.expected_graduation_year}` : ''}</div>
                  <div className="mt-2 flex items-center gap-3">
                    <Link href={href} className="text-[#2563EB] text-sm">Voir le profil</Link>
                  </div>
                </article>
              )
            })}
          </div>

          <div className="flex justify-center items-center gap-2 pt-4">
            <button className="px-3 py-1.5 rounded bg-[#F1F5F9] text-[#0F172A] disabled:opacity-50" disabled={page <= 1} onClick={()=>setPage(p => Math.max(1, p-1))}>Précédent</button>
            <div className="text-xs text-[#64748B]">Page {page} / {totalPages}</div>
            <button className="px-3 py-1.5 rounded bg-[#F1F5F9] text-[#0F172A] disabled:opacity-50" disabled={page >= totalPages} onClick={()=>setPage(p => Math.min(totalPages, p+1))}>Suivant</button>
          </div>
        </>
      )}
    </main>
  )
}
