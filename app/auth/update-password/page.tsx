"use client"

import { useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)
    const supabase = supabaseBrowser()
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) {
      setError(error.message)
      return
    }
    setMessage('Mot de passe mis à jour. Tu peux maintenant te connecter.')
  }

  return (
    <div>
      <h1 className="text-4xl font-bold text-[#0F172A] mb-2">Nouveau mot de passe</h1>
      <p className="text-base text-[#64748B] mb-6">Définis ton nouveau mot de passe.</p>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-[#1E293B] mb-1">Mot de passe</label>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        {error && <div className="text-error text-sm">{error}</div>}
        {message && <div className="text-success text-sm">{message}</div>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Mise à jour...' : 'Mettre à jour'}
        </Button>
      </form>
    </div>
  )
}
