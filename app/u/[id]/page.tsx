"use client"

import { useEffect, useMemo, useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase/client'
import { HighlightsPublic } from '@/components/profile/HighlightsPublic'
import { MessageCTA } from '@/components/profile/MessageCTA'
import { notify } from '@/lib/notify'

type AthleteProfile = {
  user_id: string
  first_name: string | null
  last_name: string | null
  birth_date: string | null
  country: string | null
  sport: string | null
  position: string | null
  level: string | null
  height: number | null
  weight: number | null
  gpa: number | null
  english_level: string | null
  bio: string | null
  goals: string | null
  why_usa: string | null
  club: string | null
  achievements: string | null
  phone_whatsapp: string | null
  profile_picture_url: string | null
  profile_views_count: number | null
  level_base: string | null
  division: string | null
  category: string | null
  english_test_type: string | null
  english_test_score: number | null
  current_school_year: string | null
  expected_graduation_year: number | null
  slug: string | null
}

export default function PublicAthletePage({ params }: { params: { id: string } }) {
  const param = params.id
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<AthleteProfile | null>(null)
  const [docs, setDocs] = useState<Array<{ id: string, file_path: string, document_type: string, url: string }>>([])
  const [aow, setAow] = useState<boolean>(false)
  const [viewsCount, setViewsCount] = useState<number>(0)
  const [meId, setMeId] = useState<string | null>(null)
  const [followed, setFollowed] = useState<boolean>(false)
  const [followersCount, setFollowersCount] = useState<number>(0)
  const athleteId = useMemo(() => profile?.user_id || param, [profile, param])

  useEffect(() => {
    const load = async () => {
      const supabase = supabaseBrowser()
      // Try by slug first
      let prof: AthleteProfile | null = null
      const bySlug = await supabase
        .from('athlete_profiles')
        .select('*')
        .eq('slug', param)
        .maybeSingle()
      if (bySlug.data) prof = bySlug.data as any
      if (!prof) {
        const byId = await supabase
          .from('athlete_profiles')
          .select('*')
          .eq('user_id', param)
          .maybeSingle()
        prof = (byId.data as any) || null
      }
      setProfile(prof)
      // current user
      const { data: { user } } = await supabase.auth.getUser()
      setMeId(user?.id ?? null)
      // Documents public URLs
      if (prof?.user_id) {
        const { data: rows } = await supabase
          .from('documents')
          .select('id, file_path, document_type')
          .eq('athlete_id', prof.user_id)
          .order('uploaded_at', { ascending: false })
        const list = (rows || []).map((r: any) => {
          const { data } = supabase.storage.from('documents').getPublicUrl(r.file_path)
          return { id: r.id, file_path: r.file_path, document_type: r.document_type, url: data.publicUrl }
        })
        setDocs(list)
        // insert a profile view (best-effort)
        try {
          await supabase.from('profile_views').insert({ athlete_id: prof.user_id, viewer_id: user?.id || null })
        } catch {}
        // fetch views count
        const { count: vcount } = await supabase
          .from('profile_views')
          .select('*', { count: 'exact', head: true })
          .eq('athlete_id', prof.user_id)
        setViewsCount(vcount || 0)
        // follow state
        if (user?.id) {
          const { count: fcount } = await supabase
            .from('favorites')
            .select('*', { count: 'exact', head: true })
            .eq('coach_id', user.id)
            .eq('athlete_id', prof.user_id)
          setFollowed((fcount || 0) > 0)
        }
        // followers count (total coaches following this athlete)
        const { count: followers } = await supabase
          .from('favorites')
          .select('*', { count: 'exact', head: true })
          .eq('athlete_id', prof.user_id)
        setFollowersCount(followers || 0)
        const today = new Date().toISOString().slice(0,10)
        const { data: aowRow } = await supabase
          .from('athlete_of_week')
          .select('id')
          .eq('athlete_id', prof.user_id)
          .eq('is_active', true)
          .lte('start_date', today)
          .gte('end_date', today)
          .limit(1)
        setAow((aowRow || []).length > 0)
      }
      setLoading(false)
    }
    load()
  }, [param])

  return (
    <main className="container-xl py-10 space-y-8">
      <header className="space-y-2">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-4xl font-bold text-[#0F172A]">
            {profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Profil Athlète' : 'Profil Athlète'}
          </h1>
          <span className="text-xs px-2 py-1 rounded bg-[#F1F5F9] text-[#0F172A]">{followersCount} followers</span>
          {aow && (
            <span className="text-xs px-2 py-1 rounded bg-[#F59E0B] text-white">Athlète de la semaine</span>
          )}
        </div>
        <div className="flex items-center gap-3 text-sm text-[#64748B]">
          <span>Profil public</span>
          <span>· {viewsCount} vues</span>
          <span>· {followersCount} followers</span>
          <button
            className="ml-2 px-2 py-1 rounded bg-[#F1F5F9] text-[#0F172A] hover:bg-[#E2E8F0]"
            onClick={async ()=>{
              try {
                const slugOrId = profile?.slug || athleteId
                const url = `${window.location.origin}/u/${slugOrId}`
                await navigator.clipboard.writeText(url)
                notify('Lien du profil copié', 'success')
              } catch { notify('Impossible de copier le lien', 'error') }
            }}
          >Copier le lien</button>
          <button
            className="px-2 py-1 rounded bg-[#0F172A] text-white hover:opacity-90"
            onClick={async ()=>{
              const supabase = supabaseBrowser()
              if (!profile?.user_id) return
              if (!meId) { notify('Connecte-toi pour suivre un athlète', 'info'); return }
              if (meId === athleteId) { notify("Tu ne peux pas te suivre toi-même", 'info'); return }
              if (followed) {
                const { error } = await supabase
                  .from('favorites')
                  .delete()
                  .eq('coach_id', meId)
                  .eq('athlete_id', profile.user_id)
                if (error) { notify(error.message, 'error'); return }
                setFollowed(false)
                setFollowersCount(v => Math.max(0, v - 1))
                notify("Retiré des favoris", 'info')
              } else {
                const { error } = await supabase
                  .from('favorites')
                  .insert({ coach_id: meId, athlete_id: profile.user_id })
                if (error) { notify(error.message, 'error'); return }
                setFollowed(true)
                setFollowersCount(v => v + 1)
                notify('Ajouté aux favoris', 'success')
              }
            }}
          >{followed ? 'Ne plus suivre' : "Suivre l'athlète"}</button>
          <button
            className="px-2 py-1 rounded bg-[#F1F5F9] text-[#0F172A] hover:bg-[#E2E8F0]"
            onClick={async ()=>{
              try {
                const slugOrId = profile?.slug || athleteId
                const url = `${window.location.origin}/u/${slugOrId}`
                const title = profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : 'Profil Athlète'
                if (navigator.share) {
                  await navigator.share({ title, url })
                } else {
                  await navigator.clipboard.writeText(url)
                  notify('Lien copié pour partager', 'success')
                }
              } catch {}
            }}
          >Partager</button>
        </div>
        <MessageCTA athleteId={athleteId} />
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
              <Info label="Sport" value={profile.sport} />
              <Info label="Poste" value={profile.position} />
              <Info label="Niveau" value={profile.level || profile.level_base} />
              <Info label="Division" value={profile.division} />
              <Info label="Catégorie" value={profile.category} />
              <Info label="Taille" value={profile.height ? `${profile.height} cm` : ''} />
              <Info label="Poids" value={profile.weight ? `${profile.weight} kg` : ''} />
              <Info label="GPA" value={profile.gpa?.toString()} />
              <Info label="Anglais" value={profile.english_level || (profile.english_test_type ? `${profile.english_test_type} ${profile.english_test_score || ''}` : '')} />
              <Info label="Année scolaire" value={profile.current_school_year} />
              <Info label="Promotion" value={profile.expected_graduation_year?.toString()} />
              <Info label="Club" value={profile.club} />
              <Info label="WhatsApp" value={profile.phone_whatsapp} />
              <Info label="Date de naissance" value={profile.birth_date || ''} />
            </div>
          </div>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <Block label="Bio" value={profile.bio} />
            <Block label="Objectifs" value={profile.goals} />
            <Block label="Pourquoi USA" value={profile.why_usa} />
          </div>
          {profile.achievements && (
            <div className="mt-6">
              <Block label="Réalisations" value={profile.achievements} />
            </div>
          )}
          {docs.length > 0 && (
            <div className="mt-6">
              <div className="text-xs text-[#64748B] mb-1">Documents</div>
              <ul className="space-y-2">
                {docs.map(d => (
                  <li key={d.id} className="flex items-center justify-between text-sm">
                    <span className="text-[#0F172A]">{d.document_type}</span>
                    <a href={d.url} target="_blank" rel="noreferrer" className="text-[#2563EB] hover:underline">Ouvrir</a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      ) : (
        <div className="text-sm text-[#EF4444]">Profil introuvable.</div>
      )}

      <section>
        <h2 className="text-2xl font-semibold text-[#0F172A] mb-3">Highlights</h2>
        <HighlightsPublic athleteId={athleteId} />
      </section>
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
