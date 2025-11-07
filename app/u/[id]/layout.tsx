import type { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  let title = 'Profil Athlète | ATHLINK'
  let description = "Découvre le profil public d'un athlète sur ATHLINK."
  let ogUrl = `${base}/og/profile-default.png`

  try {
    if (supabaseUrl && supabaseAnon) {
      const sb = createClient(supabaseUrl, supabaseAnon)
      // Try by slug first
      const bySlug = await sb.from('athlete_profiles').select('first_name,last_name,bio,slug,user_id,profile_picture_url').eq('slug', params.id).maybeSingle()
      let prof = bySlug.data
      if (!prof) {
        const byId = await sb.from('athlete_profiles').select('first_name,last_name,bio,slug,user_id,profile_picture_url').eq('user_id', params.id).maybeSingle()
        prof = byId.data as any
      }
      if (prof) {
        const name = `${prof.first_name || ''} ${prof.last_name || ''}`.trim() || 'Athlète'
        title = `${name} | ATHLINK`
        description = prof.bio || description
        ogUrl = prof.profile_picture_url || ogUrl
      }
    }
  } catch {}

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${base}/u/${params.id}`,
      images: [{ url: ogUrl }],
      type: 'profile'
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogUrl]
    }
  }
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
