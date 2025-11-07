"use client"

import { useEffect, useMemo, useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

export function CoachProfileEditor() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [university, setUniversity] = useState('')
  const [sport, setSport] = useState('')
  const [bio, setBio] = useState('')

  const completion = useMemo(() => {
    const fields = [firstName, lastName, university, sport, bio]
    const total = fields.length
    const filled = fields.filter(v => (v ?? '').toString().trim().length > 0).length
    return Math.max(0, Math.min(100, Math.round((filled / Math.max(1, total)) * 100)))
  }, [firstName, lastName, university, sport, bio])

  useEffect(() => {
    const load = async () => {
      const supabase = supabaseBrowser()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('coach_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()
      if (data) {
        setFirstName(data.first_name || '')
        setLastName(data.last_name || '')
        setUniversity(data.university || '')
        setSport(data.sport || '')
        setBio(data.bio || '')
      }
    }
    load()
  }, [])

  const onSave = async () => {
    setLoading(true)
    setMessage(null)
    setError(null)
    try {
      const supabase = supabaseBrowser()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Connexion requise')

      const payload = {
        user_id: user.id,
        first_name: firstName || null,
        last_name: lastName || null,
        university: university || null,
        sport: sport || null,
        bio: bio || null,
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase.from('coach_profiles').upsert(payload, { onConflict: 'user_id' })
      if (error) throw error
      setMessage('Profil coach sauvegardé')
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la sauvegarde')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
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
        <h2 className="text-2xl font-semibold text-[#0F172A]">Informations coach</h2>
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
            <label className="block text-sm text-[#1E293B] mb-1">Université / Organisation</label>
            <Input value={university} onChange={(e)=>setUniversity(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm text-[#1E293B] mb-1">Sport</label>
            <Input value={sport} onChange={(e)=>setSport(e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm text-[#1E293B] mb-1">Bio</label>
            <Textarea rows={4} value={bio} onChange={(e)=>setBio(e.target.value)} />
          </div>
        </div>
      </section>

      {error && <div className="text-error text-sm">{error}</div>}
      {message && <div className="text-success text-sm">{message}</div>}

      <div className="flex justify-end">
        <Button onClick={onSave} disabled={loading}>{loading ? 'Enregistrement...' : 'Sauvegarder'}</Button>
      </div>
    </div>
  )
}
