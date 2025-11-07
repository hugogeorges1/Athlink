"use client"

import { useEffect, useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

const MAX_COUNT = 3
const MAX_SIZE = 10 * 1024 * 1024 // 10MB per PDF (comfortable)
const ACCEPTED = ['application/pdf']
const BUCKET = 'documents'

export function DocumentsUploader() {
  const [files, setFiles] = useState<{ name: string; url: string }[]>([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const supabase = supabaseBrowser()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data, error } = await supabase.storage.from(BUCKET).list(user.id, { limit: 100 })
      if (error) return
      const mapped = (data || [])
        .filter(i => i.name.toLowerCase().endsWith('.pdf'))
        .map(i => {
          const { data } = supabase.storage.from(BUCKET).getPublicUrl(`${user.id}/${i.name}`)
          return { name: i.name, url: data.publicUrl }
        })
      setFiles(mapped)
    }
    load()
  }, [])

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files
    if (!fileList || fileList.length === 0) return
    const file = fileList[0]
    setError(null)

    if (!ACCEPTED.includes(file.type)) {
      setError('PDF uniquement.')
      return
    }
    if (file.size > MAX_SIZE) {
      setError('Fichier trop volumineux (max 10MB).')
      return
    }
    if (files.length >= MAX_COUNT) {
      setError('Maximum 3 documents.')
      return
    }

    const supabase = supabaseBrowser()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError("Tu dois être connecté pour uploader des documents.")
      return
    }

    setUploading(true)
    try {
      const path = `${user.id}/${Date.now()}-${file.name.replace(/\s+/g,'_')}`
      const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, {
        cacheControl: '3600', upsert: false, contentType: file.type
      })
      if (upErr) throw upErr
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
      setFiles(prev => [...prev, { name: file.name, url: data.publicUrl }])
    } catch (err: any) {
      setError(err.message || "Échec d'upload")
    } finally {
      setUploading(false)
    }
  }

  const remove = async (url: string) => {
    const supabase = supabaseBrowser()
    const key = new URL(url).pathname.split('/').slice(-2).join('/') // userId/filename
    await supabase.storage.from(BUCKET).remove([key])
    setFiles(prev => prev.filter(f => f.url !== url))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <input type="file" accept="application/pdf" onChange={onFileChange} disabled={uploading || files.length>=MAX_COUNT} />
        <span className="text-small text-[#64748B]">PDF, max {MAX_COUNT} fichiers</span>
      </div>
      {error && <div className="text-error text-sm">{error}</div>}
      <ul className="space-y-2">
        {files.map((f) => (
          <li key={f.url} className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2">
            <a className="text-[#2563EB]" href={f.url} target="_blank" rel="noreferrer">{f.name}</a>
            <Button variant="secondary" onClick={() => remove(f.url)}>Retirer</Button>
          </li>
        ))}
      </ul>
    </div>
  )
}
