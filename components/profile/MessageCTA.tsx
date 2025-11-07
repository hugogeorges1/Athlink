"use client"

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase/client'

export function MessageCTA({ athleteId }: { athleteId: string }) {
  const [me, setMe] = useState<string | null>(null)

  useEffect(() => {
    const run = async () => {
      const supabase = supabaseBrowser()
      const { data: { user } } = await supabase.auth.getUser()
      setMe(user?.id ?? null)
    }
    run()
  }, [])

  if (!athleteId) return null
  if (me && me === athleteId) return null

  return (
    <div className="pt-2">
      <Link href={`/messages/${athleteId}`} className="inline-flex items-center rounded-md bg-[#0F172A] px-4 py-2 text-white hover:opacity-90 text-sm">
        Envoyer un message
      </Link>
    </div>
  )
}
