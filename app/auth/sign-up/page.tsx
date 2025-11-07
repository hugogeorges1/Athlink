"use client"

import { useState } from 'react'
import Link from 'next/link'
import { supabaseBrowser } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'

export default function SignUpPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'athlete' | 'coach'>('athlete')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)
    const supabase = supabaseBrowser()
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${siteUrl}/auth/update-password`,
        data: { role }
      }
    })
    setLoading(false)
    if (error) {
      setError(error.message)
      return
    }
    if (role === 'athlete') {
      // Allow immediate access: sign in directly and redirect
      setLoading(true)
      const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password })
      setLoading(false)
      if (signInErr) {
        setMessage("Compte créé. Tu peux maintenant te connecter.")
        return
      }
      window.location.href = '/athlete/profile'
      return
    } else {
      setMessage("Compte créé. Vérifie ton email pour confirmer. Ton profil coach nécessitera une validation admin.")
    }
  }

  return (
    <div>
      <h1 className="text-4xl font-bold text-[#0F172A] mb-2">Créer un compte</h1>
      <p className="text-base text-[#64748B] mb-6">Rejoins ATHLINK gratuitement</p>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-[#1E293B] mb-1">Email</label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm text-[#1E293B] mb-1">Mot de passe</label>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm text-[#1E293B] mb-1">Je suis</label>
          <Select value={role} onChange={(e) => setRole(e.target.value as 'athlete' | 'coach')}>
            <option value="athlete">Athlète</option>
            <option value="coach">Coach universitaire</option>
          </Select>
          {role === 'coach' && (
            <p className="text-small text-[#64748B] mt-2">Les comptes coachs nécessitent une validation par un admin.</p>
          )}
        </div>
        {error && <div className="text-error text-sm">{error}</div>}
        {message && <div className="text-success text-sm">{message}</div>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Création...' : "S'inscrire"}
        </Button>
      </form>
      <div className="flex items-center justify-between mt-4 text-sm">
        <Link href="/auth/sign-in" className="text-[#2563EB]">Déjà un compte ? Se connecter</Link>
      </div>
    </div>
  )
}
