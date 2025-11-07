"use client"

import { useState } from 'react'
import Link from 'next/link'
import { supabaseBrowser } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function SignInPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = supabaseBrowser()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      setError(error.message)
      return
    }
    // Redirect by role
    const { data: { user } } = await supabase.auth.getUser()
    const role = (user?.user_metadata as any)?.role
    if (role === 'coach') {
      window.location.href = '/coach/profile'
    } else {
      window.location.href = '/athlete/profile'
    }
  }

  return (
    <div>
      <h1 className="text-4xl font-bold text-[#0F172A] mb-2">Connexion</h1>
      <p className="text-base text-[#64748B] mb-6">Accède à ton compte ATHLINK</p>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-[#1E293B] mb-1">Email</label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm text-[#1E293B] mb-1">Mot de passe</label>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        {error && <div className="text-error text-sm">{error}</div>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Connexion...' : 'Se connecter'}
        </Button>
      </form>
      <div className="flex items-center justify-between mt-4 text-sm">
        <Link href="/auth/reset-password" className="text-[#2563EB]">Mot de passe oublié ?</Link>
        <Link href="/auth/sign-up" className="text-[#2563EB]">Créer un compte</Link>
      </div>
    </div>
  )
}
