"use client"

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { supabaseBrowser } from '@/lib/supabase/client'
import { notify } from '@/lib/notify'

 type CoachProfile = {
  user_id: string
  first_name: string | null
  last_name: string | null
  country: string | null
  bio: string | null
  organization?: string | null
  role?: string | null
  phone_whatsapp?: string | null
  profile_picture_url?: string | null
  slug: string | null
}

export default function PublicCoachPage({ params }: { params: { id: string } }) {
  const param = params.id
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<CoachProfile | null>(null)
  const [me, setMe] = useState<string | null>(null)
  const [role, setRole] = useState<'athlete' | 'coach' | null>(null)
  const [myAthleteSlugOrId, setMyAthleteSlugOrId] = useState<string | null>(null)
  const [applicationText, setApplicationText] = useState<string>('')
  const coachId = useMemo(() => profile?.user_id || param, [profile, param])

  useEffect(() => {
    const load = async () => {
      const supabase = supabaseBrowser()
      const { data: { user } } = await supabase.auth.getUser()
      setMe(user?.id ?? null)
      const r = (user?.user_metadata as any)?.role as 'athlete' | 'coach' | undefined
      setRole(r ?? null)
      let prof: CoachProfile | null = null
      const bySlug = await supabase
        .from('coach_profiles')
        .select('*')
        .eq('slug', param)
        .maybeSingle()
      if (bySlug.data) prof = bySlug.data as any
      if (!prof) {
        const byId = await supabase
          .from('coach_profiles')
          .select('*')
          .eq('user_id', param)
          .maybeSingle()
        prof = (byId.data as any) || null
      }
      setProfile(prof)
      // If current user is an athlete, prepare application prefill
      if (user?.id && r === 'athlete') {
        const { data: a } = await supabase
          .from('athlete_profiles')
          .select('slug,user_id,first_name,last_name,sport,position,level,level_base,expected_graduation_year')
          .eq('user_id', user.id)
          .maybeSingle()
        const myIdOrSlug = (a as any)?.slug || user.id
        setMyAthleteSlugOrId(myIdOrSlug)
        const displayName = a ? `${(a as any).first_name || ''} ${(a as any).last_name || ''}`.trim() : ''
        const level = (a as any)?.level || (a as any)?.level_base || ''
        const grad = (a as any)?.expected_graduation_year ? `, Promo ${(a as any).expected_graduation_year}` : ''
        const base = typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_SITE_URL || '')
        const url = `${base}/u/${myIdOrSlug}`
        const prefill = `Bonjour Coach,\nJe souhaite candidater.\n\nNom: ${displayName || '—'}\nSport: ${(a as any)?.sport || '—'}\nPoste: ${(a as any)?.position || '—'}\nNiveau: ${level || '—'}${grad}\nProfil: ${url}\n\nMerci pour votre retour !`
        setApplicationText(prefill)
      } else {
        setApplicationText('')
      }
      setLoading(false)
    }
    load()
  }, [param])

  const copyLink = async () => {
    try {
      const slugOrId = profile?.slug || coachId
      const url = `${window.location.origin}/c/${slugOrId}`
      await navigator.clipboard.writeText(url)
      notify('Lien du profil copié', 'success')
    } catch { notify('Impossible de copier le lien', 'error') }
  }
  const shareLink = async () => {
    try {
      const slugOrId = profile?.slug || coachId
      const url = `${window.location.origin}/c/${slugOrId}`
      const title = profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : 'Profil Coach'
      if (navigator.share) {
        await navigator.share({ title, url })
      } else {
        await navigator.clipboard.writeText(url)
        notify('Lien copié pour partager', 'success')
      }
    } catch {}
  }

  return (
    <main className="container-xl py-10 space-y-8">
      <header className="space-y-2">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-4xl font-bold text-[#0F172A]">
            {profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Profil Coach' : 'Profil Coach'}
          </h1>
          <button onClick={copyLink} className="text-xs px-2 py-1 rounded bg-[#F1F5F9] text-[#0F172A] hover:bg-[#E2E8F0]">Copier le lien</button>
          <button onClick={shareLink} className="text-xs px-2 py-1 rounded bg-[#F1F5F9] text-[#0F172A] hover:bg-[#E2E8F0]">Partager</button>
        </div>
        <div className="flex items-center gap-3 text-sm text-[#64748B]">
          <span>Profil public coach</span>
          {profile?.country && <span>· {profile.country}</span>}
        </div>
        {(!me || me !== coachId) && (
          <div className="flex items-center gap-2">
            <Link href={`/messages/${coachId}`} className="inline-block text-sm text-white bg-[#0F172A] px-3 py-2 rounded hover:opacity-90">Envoyer un message</Link>
            <Link
              href={`/messages/${coachId}?prefill=${encodeURIComponent("Bonjour Coach, je souhaite candidater. Voici mon profil public: ")}`}
              className="inline-block text-sm text-[#0F172A] bg-[#F1F5F9] px-3 py-2 rounded hover:bg-[#E2E8F0]"
            >
              Demander une candidature
            </Link>
          </div>
        )}
      </header>

      {loading ? (
        <div className="text-sm text-[#64748B]">Chargement du profil...</div>
      ) : profile ? (
        <section className="rounded-xl border border-[#E2E8F0] bg-white p-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-56">
              <div className="aspect-square w-56 max-w-full overflow-hidden rounded-xl bg-[#F1F5F9] flex items-center justify-center">
                {profile.profile_picture_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.profile_picture_url} alt="Photo" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-[#94A3B8] text-sm">Aucune photo</div>
                )}
              </div>
            </div>
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Info label="Prénom" value={profile.first_name} />
              <Info label="Nom" value={profile.last_name} />
              <Info label="Pays" value={profile.country} />
              <Info label="Organisation" value={profile.organization} />
              <Info label="Rôle" value={profile.role} />
              <Info label="WhatsApp" value={profile.phone_whatsapp} />
            </div>
          </div>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <Block label="Bio" value={profile.bio} />
          </div>
        </section>
      ) : (
        <div className="text-sm text-[#EF4444]">Profil introuvable.</div>
      )}

      {(!loading && profile && me && me !== coachId && role === 'athlete') && (
        <section className="rounded-xl border border-[#E2E8F0] bg-white p-6">
          <h2 className="text-xl font-semibold text-[#0F172A] mb-3">Candidater</h2>
          <p className="text-sm text-[#64748B] mb-3">Présente rapidement ton profil au coach. Un message sera pré‑rempli avec le contenu ci‑dessous.</p>
          <textarea
            className="w-full min-h-[160px] border border-[#CBD5E1] rounded px-3 py-2 text-sm"
            value={applicationText}
            onChange={(e)=>setApplicationText(e.target.value)}
          />
          <div className="mt-3 flex items-center gap-2">
            <Link
              href={`/messages/${coachId}?prefill=${encodeURIComponent(applicationText || '')}`}
              className="inline-flex items-center text-sm text-white bg-[#0F172A] px-3 py-2 rounded hover:opacity-90"
            >Envoyer la candidature</Link>
            {myAthleteSlugOrId && (
              <Link href={`/u/${myAthleteSlugOrId}`} className="text-sm text-[#2563EB]">Voir mon profil</Link>
            )}
          </div>
        </section>
      )}
    </main>
  )
}

function Info({ label, value }: { label: string, value?: string | number | null }) {
  const v = (value ?? '').toString()
  return (
    <div>
      <div className="text-xs text-[#64748B]">{label}</div>
      <div className="text-sm text-[#0F172A] min-h-[20px]">{v || '—'}</div>
    </div>
  )
}

function Block({ label, value }: { label: string, value?: string | null }) {
  return (
    <div>
      <div className="text-xs text-[#64748B] mb-1">{label}</div>
      <div className="text-sm text-[#0F172A] whitespace-pre-wrap min-h-[20px] bg-[#F8FAFC] rounded p-3">{value || '—'}</div>
    </div>
  )
}
