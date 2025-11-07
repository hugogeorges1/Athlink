"use client"

import { useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
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
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl}/auth/update-password`
    })
    setLoading(false)
    if (error) {
      setError(error.message)
      return
    }
    setMessage('Email de réinitialisation envoyé. Vérifie ta boîte mail.')
  }

  return (
    <div>
      <h1 className="text-4xl font-bold text-[#0F172A] mb-2">Mot de passe oublié</h1>
      <p className="text-base text-[#64748B] mb-6">Entre ton email pour recevoir un lien de réinitialisation.</p>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-[#1E293B] mb-1">Email</label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        {error && <div className="text-error text-sm">{error}</div>}
        {message && <div className="text-success text-sm">{message}</div>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Envoi...' : 'Envoyer'}
        </Button>
      </form>
    </div>
  )
}
