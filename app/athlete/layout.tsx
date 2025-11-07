"use client"

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabase/client'

export default function AthleteLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    const run = async () => {
      const supabase = supabaseBrowser()
      const { data: { user } } = await supabase.auth.getUser()
      // If not logged in, send to sign-in
      if (!user) {
        router.replace(`/auth/sign-in?next=${encodeURIComponent(pathname)}`)
        return
      }
      setChecked(true)
    }
    run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!checked) return null
  return <>{children}</>
}
