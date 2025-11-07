"use client"

import { useEffect, useMemo, useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase/client'
import { AvatarUploader } from '@/components/profile/AvatarUploader'
import { DocumentsUploader } from '@/components/profile/DocumentsUploader'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { notify } from '@/lib/notify'
import { HighlightsInline } from '@/components/profile/HighlightsInline'

export function ProfileEditor() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [slug, setSlug] = useState('')
  const [country, setCountry] = useState('France')
  const [whatsapp, setWhatsapp] = useState('')

  const [sport, setSport] = useState('')
  const [position, setPosition] = useState('')
  const [height, setHeight] = useState<string>('')
  const [weight, setWeight] = useState<string>('')
  const [level, setLevel] = useState('')
  const [divisionDetail, setDivisionDetail] = useState('')
  const [categoryDetail, setCategoryDetail] = useState('')
  const [club, setClub] = useState('')
  const [achievements, setAchievements] = useState('')

  const [gpa20, setGpa20] = useState<string>('')
  const [englishLevel, setEnglishLevel] = useState('')
  const [testScore, setTestScore] = useState<string>('')
  const [testType, setTestType] = useState<'TOEFL' | 'IELTS' | 'Duolingo' | ''>('')
  const [currentSchoolYear, setCurrentSchoolYear] = useState('')
  const [expectedGraduationYear, setExpectedGraduationYear] = useState<string>('')

  const [bio, setBio] = useState('')
  const [goals, setGoals] = useState('')
  const [whyUsa, setWhyUsa] = useState('')

  const completion = useMemo(() => {
    const fields = [
      firstName, lastName, email, birthDate, slug, country, whatsapp,
      sport, position, height, weight, level, divisionDetail, categoryDetail, club, achievements,
      gpa20, englishLevel, currentSchoolYear, expectedGraduationYear, bio, goals, whyUsa
    ]
    const total = fields.length
    const filled = fields.filter(v => (v ?? '').toString().trim().length > 0).length
    return Math.max(0, Math.min(100, Math.round((filled / Math.max(1, total)) * 100)))
  }, [
    firstName, lastName, email, birthDate, slug, country, whatsapp,
    sport, position, height, weight, level, divisionDetail, categoryDetail, club, achievements,
    gpa20, englishLevel, currentSchoolYear, expectedGraduationYear, bio, goals, whyUsa
  ])

  useEffect(() => {
    const load = async () => {
      const supabase = supabaseBrowser()
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUserId(user?.id ?? null)
      if (!user) return
      setEmail(user.email || '')
      setFirstName((user.user_metadata?.first_name as string) || '')
      setLastName((user.user_metadata?.last_name as string) || '')
      // Try fetch existing profile
      const { data } = await supabase.from('athlete_profiles').select('*').eq('user_id', user.id).maybeSingle()
      if (data) {
        setBirthDate(data.birth_date || '')
        setCountry(data.country || 'France')
        setWhatsapp(data.phone_whatsapp || '')
        setSport(data.sport || '')
        setPosition(data.position || '')
        setHeight(data.height?.toString() || '')
        setWeight(data.weight?.toString() || '')
        setLevel(data.level || '')
        setClub(data.club || '')
        setAchievements(data.achievements || '')
        setGpa20(data.gpa ? (Math.round((Number(data.gpa) / 4) * 20 * 10) / 10).toString() : '')
        setEnglishLevel(data.english_level || '')
        setBio(data.bio || '')
        setGoals(data.goals || '')
        setWhyUsa(data.why_usa || '')
        setTestScore('')
        setCurrentSchoolYear(data.current_school_year || '')
        setExpectedGraduationYear(data.expected_graduation_year?.toString() || '')
        setSlug(data.slug || '')
      }
    }
    load()
  }, [])

  const onSave = async () => {
    setLoading(true)
    setError(null)
    setMessage(null)
    try {
      const supabase = supabaseBrowser()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Connexion requise')
      // Update auth profile (first/last), and email if changed
      const authUpdates: any = { data: { first_name: firstName || null, last_name: lastName || null } }
      if (email && email !== (user.email || '')) {
        authUpdates.email = email
      }
      const { error: authUpdErr } = await supabase.auth.updateUser(authUpdates)
      if (authUpdErr) throw authUpdErr
      // gpa conversion /20 -> /4.0
      const gpaNum = gpa20 ? Number(gpa20) : NaN
      const gpa4 = isNaN(gpaNum) ? null : Math.max(0, Math.min(4, Number(((gpaNum / 20) * 4).toFixed(2))))
      const avatarUrl = (user.user_metadata?.avatar_url as string) || null
      // Legacy combined strings for backward compatibility
      const levelCombined = [level, divisionDetail, categoryDetail].filter(Boolean).join(' - ')
      const englishLevelCombined = [englishLevel, testType && testScore ? `${testType}:${testScore}` : '']
        .filter(Boolean)
        .join(' | ')
      const payload = {
        user_id: user.id,
        first_name: firstName || null,
        last_name: lastName || null,
        birth_date: birthDate || null,
        country: country || null,
        sport: sport || null,
        position: position || null,
        level: levelCombined || null,
        level_base: level || null,
        division: divisionDetail || null,
        category: categoryDetail || null,
        height: height ? Number(height) : null,
        weight: weight ? Number(weight) : null,
        gpa: gpa4,
        english_level: englishLevelCombined || null,
        english_test_type: testType || null,
        english_test_score: testScore ? Number(testScore) : null,
        bio: bio || null,
        goals: goals || null,
        why_usa: whyUsa || null,
        club: club || null,
        achievements: achievements || null,
        phone_whatsapp: whatsapp || null,
        profile_picture_url: avatarUrl,
        current_school_year: currentSchoolYear || null,
        expected_graduation_year: expectedGraduationYear ? Number(expectedGraduationYear) : null,
        slug: slug || null,
        updated_at: new Date().toISOString()
      }
      const { error } = await supabase.from('athlete_profiles').upsert(payload, { onConflict: 'user_id' })
      if (error) throw error
      setMessage('Profil sauvegardé')
    } catch (err: any) {
      // Unique slug violation message
      if (typeof err?.message === 'string' && err.message.toLowerCase().includes('slug')) {
        setError('Ce slug est déjà utilisé. Merci d\'en choisir un autre.')
      } else {
        setError(err.message || 'Erreur lors de la sauvegarde')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-10">
      <section>
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-4">
          <div className="flex items-center justify-between text-sm text-[#0F172A]">
            <span>Complétion du profil</span>
            <span>{completion}%</span>
          </div>
          <div className="mt-2 h-2 rounded bg-[#F1F5F9]">
            <div className="h-2 rounded bg-[#0F172A]" style={{ width: `${completion}%` }} />
          </div>
        </div>
      </section>
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-[#0F172A]">Photo de profil</h2>
        <AvatarUploader />
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold text-[#0F172A]">Informations personnelles</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm text-[#1E293B] mb-1">Prénom</label>
            <Input value={firstName} onChange={(e)=>setFirstName(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm text-[#1E293B] mb-1">Nom</label>
            <Input value={lastName} onChange={(e)=>setLastName(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm text-[#1E293B] mb-1">Email</label>
            <Input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm text-[#1E293B] mb-1">Slug public (URL)</label>
            <div className="flex gap-2">
              <Input value={slug} onChange={(e)=>setSlug(e.target.value.replace(/[^a-z0-9-]/gi,'').toLowerCase())} placeholder="ex: georges-dupont" />
              <Button type="button" onClick={async ()=>{
                try {
                  const id = currentUserId
                  const path = `/u/${slug || id || ''}`
                  const url = `${window.location.origin}${path}`
                  await navigator.clipboard.writeText(url)
                  notify('Lien public copié', 'success')
                } catch {
                  notify('Impossible de copier le lien', 'error')
                }
              }}>Copier lien</Button>
            </div>
            <p className="text-xs text-[#64748B] mt-1">Ton profil public: /u/{slug || (currentUserId ? currentUserId : 'ton-slug-ou-id')}</p>
          </div>
          <div>
            <label className="block text-sm text-[#1E293B] mb-1">WhatsApp</label>
            <Input value={whatsapp} onChange={(e)=>setWhatsapp(e.target.value)} placeholder="+33 6 12 34 56 78" />
          </div>
          <div>
            <label className="block text-sm text-[#1E293B] mb-1">Date de naissance</label>
            <Input type="date" value={birthDate} onChange={(e)=>setBirthDate(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm text-[#1E293B] mb-1">Pays</label>
            <Input value={country} onChange={(e)=>setCountry(e.target.value)} disabled />
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold text-[#0F172A]">Section sportive</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm text-[#1E293B] mb-1">Sport principal</label>
            <Select value={sport} onChange={(e)=>setSport(e.target.value)}>
              <option value="">Sélectionner</option>
              <option>Football</option>
              <option>Basketball</option>
              <option>Athlétisme</option>
              <option>Tennis</option>
            </Select>
          </div>
          <div>
            <label className="block text-sm text-[#1E293B] mb-1">Position / Poste</label>
            <Input value={position} onChange={(e)=>setPosition(e.target.value)} placeholder="Attaquant, Meneur, etc." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-[#1E293B] mb-1">Taille (cm)</label>
              <Input type="number" value={height} onChange={(e)=>setHeight(e.target.value)} placeholder="180" />
            </div>
            <div>
              <label className="block text-sm text-[#1E293B] mb-1">Poids (kg)</label>
              <Input type="number" value={weight} onChange={(e)=>setWeight(e.target.value)} placeholder="75" />
            </div>
          </div>
          <div>
            <label className="block text-sm text-[#1E293B] mb-1">Niveau actuel</label>
            <Select value={level} onChange={(e)=>setLevel(e.target.value)}>
              <option value="">Sélectionner</option>
              <option>Départemental</option>
              <option>Régional</option>
              <option>National</option>
            </Select>
          </div>
          <div>
            <label className="block text-sm text-[#1E293B] mb-1">Division (préciser)</label>
            <Input value={divisionDetail} onChange={(e)=>setDivisionDetail(e.target.value)} placeholder="D1 / R1 / N3, etc." />
          </div>
          <div>
            <label className="block text-sm text-[#1E293B] mb-1">Catégorie</label>
            <Input value={categoryDetail} onChange={(e)=>setCategoryDetail(e.target.value)} placeholder="U18, Sénior, etc." />
          </div>
          <div>
            <label className="block text-sm text-[#1E293B] mb-1">Club actuel</label>
            <Input value={club} onChange={(e)=>setClub(e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm text-[#1E293B] mb-1">Palmarès</label>
            <Textarea rows={4} value={achievements} onChange={(e)=>setAchievements(e.target.value)} />
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold text-[#0F172A]">Section académique</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm text-[#1E293B] mb-1">Moyenne générale /20</label>
            <Input type="number" step="0.1" value={gpa20} onChange={(e)=>setGpa20(e.target.value)} placeholder="15.5" />
          </div>
          <div>
            <label className="block text-sm text-[#1E293B] mb-1">Niveau d'anglais</label>
            <Select value={englishLevel} onChange={(e)=>setEnglishLevel(e.target.value)}>
              <option value="">Sélectionner</option>
              <option>Débutant</option>
              <option>Intermédiaire</option>
              <option>Avancé</option>
              <option>Bilingue</option>
            </Select>
          </div>
          <div>
            <label className="block text-sm text-[#1E293B] mb-1">Année scolaire actuelle</label>
            <Select value={currentSchoolYear} onChange={(e)=>setCurrentSchoolYear(e.target.value)}>
              <option value="">Sélectionner</option>
              <option>Seconde</option>
              <option>Première</option>
              <option>Terminale</option>
              <option>Bac+1</option>
              <option>Bac+2</option>
              <option>Bac+3</option>
              <option>Bac+4</option>
              <option>Bac+5</option>
              <option>Gap year</option>
            </Select>
          </div>
          <div>
            <label className="block text-sm text-[#1E293B] mb-1">Année de diplôme prévue</label>
            <Input type="number" value={expectedGraduationYear} onChange={(e)=>setExpectedGraduationYear(e.target.value)} placeholder="2027" />
          </div>
          <div>
            <label className="block text-sm text-[#1E293B] mb-1">Test (TOEFL / IELTS / Duolingo)</label>
            <Select value={testType} onChange={(e)=>setTestType(e.target.value as any)}>
              <option value="">Aucun</option>
              <option value="TOEFL">TOEFL</option>
              <option value="IELTS">IELTS</option>
              <option value="Duolingo">Duolingo</option>
            </Select>
          </div>
          <div>
            <label className="block text-sm text-[#1E293B] mb-1">Score (optionnel)</label>
            <Input type="number" value={testScore} onChange={(e)=>setTestScore(e.target.value)} placeholder="Ex: 100 / 7.0 / 120" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm text-[#1E293B] mb-1">Documents PDF (bulletins, diplômes)</label>
            <DocumentsUploader />
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <HighlightsInline />
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold text-[#0F172A]">Bio</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm text-[#1E293B] mb-1">À propos de moi (500 caractères max)</label>
            <Textarea rows={5} maxLength={500} value={bio} onChange={(e)=>setBio(e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm text-[#1E293B] mb-1">Objectifs</label>
            <Textarea rows={4} value={goals} onChange={(e)=>setGoals(e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm text-[#1E293B] mb-1">Pourquoi les USA</label>
            <Textarea rows={4} value={whyUsa} onChange={(e)=>setWhyUsa(e.target.value)} />
          </div>
        </div>
      </section>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-3">
        <div className="container-xl flex items-center justify-end">
          <div className="flex gap-3">
            {error && <div className="text-error text-sm self-center mr-4">{error}</div>}
            {message && <div className="text-success text-sm self-center mr-4">{message}</div>}
            <Button variant="secondary" onClick={()=>window.open('/athlete/preview','_blank')}>Voir mon profil public</Button>
            <Button onClick={onSave} disabled={loading}>{loading ? 'Sauvegarde...' : 'Sauvegarder'}</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
