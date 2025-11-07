"use client"

import { useEffect, useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

const MAX_SIZE = 5 * 1024 * 1024 // 5MB
const ACCEPTED = ['image/jpeg', 'image/png']
const BUCKET = 'avatars'

export function AvatarUploader() {
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    const fetchCurrent = async () => {
      const supabase = supabaseBrowser()
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.user_metadata?.avatar_url) {
        setPreview(user.user_metadata.avatar_url as string)
      }
    }
    fetchCurrent()
  }, [])

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    setSuccess(null)

    if (!ACCEPTED.includes(file.type)) {
      setError('Format invalide. JPG ou PNG uniquement.')
      return
    }
    if (file.size > MAX_SIZE) {
      setError('Fichier trop volumineux (max 5MB).')
      return
    }

    const supabase = supabaseBrowser()
    const { data: { user }, error: userErr } = await supabase.auth.getUser()
    if (userErr || !user) {
      setError("Tu dois être connecté pour uploader une image.")
      return
    }

    setUploading(true)
    try {
      const ext = file.type === 'image/png' ? 'png' : 'jpg'
      const path = `${user.id}/${Date.now()}.${ext}`

      const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      })
      if (upErr) throw upErr

      const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path)
      const publicUrl = pub.publicUrl

      const { error: updErr } = await supabase.auth.updateUser({ data: { avatar_url: publicUrl } })
      if (updErr) throw updErr

      setPreview(publicUrl)
      setSuccess('Photo de profil mise à jour.')
    } catch (err: any) {
      setError(err.message || 'Échec de l\'upload.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex items-start gap-6">
      <div className="w-[200px] h-[200px] rounded-full overflow-hidden border border-gray-200 bg-grayl flex items-center justify-center">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Avatar" className="w-full h-full object-cover" />
        ) : (
          <span className="text-sm text-graym">200x200</span>
        )}
      </div>
      <div className="space-y-3">
        <div>
          <input
            type="file"
            accept="image/png,image/jpeg"
            onChange={onFileChange}
            disabled={uploading}
          />
          <p className="text-small text-[#64748B]">Max 5MB. JPG/PNG.</p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="secondary" onClick={() => setPreview(null)} disabled={uploading}>
            Retirer l\'aperçu
          </Button>
        </div>
        {error && <div className="text-error text-sm">{error}</div>}
        {success && <div className="text-success text-sm">{success}</div>}
      </div>
    </div>
  )
}
