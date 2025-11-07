"use client"

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

export function Navbar() {
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState<'athlete' | 'coach' | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [slug, setSlug] = useState<string | null>(null)
  const [unread, setUnread] = useState<number>(0)

  useEffect(() => {
    let channel: any | null = null
    const init = async () => {
      const supabase = supabaseBrowser()
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id ?? null)
      let r = (user?.user_metadata as any)?.role as 'athlete' | 'coach' | undefined
      if (user?.id) {
        if (!r) {
          // Infer role from existing profile rows (MVP: no manual validation)
          const [{ data: a }, { data: c }] = await Promise.all([
            supabase.from('athlete_profiles').select('user_id').eq('user_id', user.id).maybeSingle(),
            supabase.from('coach_profiles').select('user_id').eq('user_id', user.id).maybeSingle(),
          ])
          if (a) r = 'athlete'
          else if (c) r = 'coach'
        }
        setRole(r ?? null)
        if (r === 'athlete') {
          const { data } = await supabase
            .from('athlete_profiles')
            .select('slug')
            .eq('user_id', user.id)
            .maybeSingle()
          setSlug((data as any)?.slug || null)
        } else if (r === 'coach') {
          const { data } = await supabase
            .from('coach_profiles')
            .select('slug')
            .eq('user_id', user.id)
            .maybeSingle()
          setSlug((data as any)?.slug || null)
        } else {
          setSlug(null)
        }
      } else {
        setSlug(null)
      }
      // Initial unread count
      if (user?.id) {
        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('recipient_id', user.id)
          .is('read_at', null)
        setUnread(count || 0)
        // Realtime subscription
        channel = supabase
          .channel('messages-unread')
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `recipient_id=eq.${user.id}` }, () => {
            setUnread((u)=>u+1)
          })
          .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: `recipient_id=eq.${user.id}` }, (payload: any) => {
            const wasUnread = payload?.old?.read_at == null
            const isRead = payload?.new?.read_at != null
            if (wasUnread && isRead) setUnread((u)=>Math.max(0, u-1))
          })
          .subscribe()
      }
      setLoading(false)
    }
    init()
    return () => {
      const supabase = supabaseBrowser()
      if (channel) supabase.removeChannel(channel)
    }
  }, [])

  const signOut = async () => {
    const supabase = supabaseBrowser()
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <nav className="w-full border-b border-[#E2E8F0] bg-white">
      <div className="container-xl flex items-center justify-between py-3">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-xl font-bold text-[#0F172A]">ATHLINK</Link>
          <Link href="/discover" className="text-sm text-[#334155] hover:text-black">Découvrir</Link>
          <Link href="/search" className="text-sm text-[#334155] hover:text-black">Recherche</Link>
          <Link href="/shop" className="text-sm text-[#334155] hover:text-black">Boutique</Link>
          {userId && (
            <Link href="/messages" className="relative text-sm text-[#334155] hover:text-black">
              Messages{unread > 0 ? ' 🆕' : ''}
              {unread > 0 && (
                <span className="absolute -top-2 -right-3 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-[#EF4444] text-white text-[10px]">{unread}</span>
              )}
            </Link>
          )}
          {userId && (
            <Link href="/favorites" className="text-sm text-[#334155] hover:text-black">Mes favoris</Link>
          )}
        </div>
        <div className="flex items-center gap-3">
          {loading ? null : userId ? (
            <>
              {role === 'coach' ? (
                <>
                  <Link href="/coach/profile" className="text-sm text-[#334155] hover:text-black">Mon profil coach</Link>
                  <Link href={`/c/${slug || userId}`} className="text-sm text-[#334155] hover:text-black">Profil public</Link>
                </>
              ) : (
                <>
                  <Link href="/athlete/profile" className="text-sm text-[#334155] hover:text-black">Mon profil</Link>
                  <Link href={`/u/${slug || userId}`} className="text-sm text-[#334155] hover:text-black">Profil public</Link>
                </>
              )}
              <Link href="/settings" className="text-sm text-[#334155] hover:text-black">Paramètres</Link>
              <Button variant="secondary" onClick={signOut}>Se déconnecter</Button>
            </>
          ) : (
            <>
              <Link href="/auth/sign-in" className="text-sm text-[#334155] hover:text-black">Se connecter</Link>
              <Link href="/auth/sign-up" className="text-sm text-white bg-[#0F172A] px-3 py-1.5 rounded hover:opacity-90">S'inscrire</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
