"use client"

import { useEffect, useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase/client'
import { notify } from '@/lib/notify'

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [me, setMe] = useState<string | null>(null)
  const [notificationEmail, setNotificationEmail] = useState('')
  const [emailOnMessage, setEmailOnMessage] = useState(true)
  const [emailOnComment, setEmailOnComment] = useState(false)
  const [emailOnLike, setEmailOnLike] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const load = async () => {
      const supabase = supabaseBrowser()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      setMe(user.id)
      const { data } = await supabase
        .from('user_settings')
        .select('notification_email, email_on_message, email_on_comment, email_on_like')
        .eq('user_id', user.id)
        .maybeSingle()
      if (data) {
        setNotificationEmail(data.notification_email || '')
        setEmailOnMessage(data.email_on_message ?? true)
        setEmailOnComment(data.email_on_comment ?? false)
        setEmailOnLike(data.email_on_like ?? false)
      } else {
        setNotificationEmail(user.email || '')
      }
      setLoading(false)
    }
    load()
  }, [])

  const save = async () => {
    if (!me) return
    setSaving(true)
    const supabase = supabaseBrowser()
    const payload = {
      user_id: me,
      notification_email: notificationEmail || null,
      email_on_message: emailOnMessage,
      email_on_comment: emailOnComment,
      email_on_like: emailOnLike,
      updated_at: new Date().toISOString(),
    }
    const { error } = await supabase.from('user_settings').upsert(payload)
    setSaving(false)
    if (error) { notify(error.message, 'error'); return }
    notify('Préférences enregistrées', 'success')
  }

  if (loading) return <main className="container-xl py-10">Chargement...</main>
  if (!me) return <main className="container-xl py-10">Connecte-toi pour accéder aux paramètres.</main>

  return (
    <main className="container-xl py-10 space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-[#0F172A]">Paramètres</h1>
        <p className="text-[#64748B]">Notifications e-mail</p>
      </header>

      <section className="rounded-xl border border-[#E2E8F0] bg-white p-6 space-y-4 max-w-2xl">
        <div>
          <label className="block text-sm text-[#475569] mb-1">E-mail de notification</label>
          <input
            type="email"
            className="w-full border border-[#CBD5E1] rounded px-3 py-2 text-sm"
            placeholder="ex: coach@exemple.com"
            value={notificationEmail}
            onChange={(e)=>setNotificationEmail(e.target.value)}
          />
          <p className="text-xs text-[#94A3B8] mt-1">Nous enverrons les alertes à cette adresse.</p>
        </div>
        <div className="space-y-2">
          <label className="inline-flex items-center gap-2 text-sm text-[#0F172A]">
            <input type="checkbox" checked={emailOnMessage} onChange={(e)=>setEmailOnMessage(e.target.checked)} />
            Recevoir un e-mail lors d'un nouveau message
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-[#0F172A]">
            <input type="checkbox" checked={emailOnComment} onChange={(e)=>setEmailOnComment(e.target.checked)} />
            Recevoir un e-mail lors d'un nouveau commentaire
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-[#0F172A]">
            <input type="checkbox" checked={emailOnLike} onChange={(e)=>setEmailOnLike(e.target.checked)} />
            Recevoir un e-mail lors d'un nouveau like
          </label>
        </div>
        <button
          className="px-4 py-2 rounded bg-[#0F172A] text-white text-sm disabled:opacity-50"
          disabled={saving}
          onClick={save}
        >
          {saving ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </section>
    </main>
  )
}
