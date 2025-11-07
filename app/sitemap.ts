import type { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const urls: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/discover`, changeFrequency: 'daily', priority: 0.9 },
  ]

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (supabaseUrl && supabaseAnon) {
      const sb = createClient(supabaseUrl, supabaseAnon)
      const { data } = await sb
        .from('athlete_profiles')
        .select('slug,user_id,updated_at')
        .limit(1000)
      for (const row of data || []) {
        const idOrSlug = (row as any).slug || (row as any).user_id
        urls.push({
          url: `${base}/u/${idOrSlug}`,
          changeFrequency: 'weekly',
          priority: 0.7,
          lastModified: (row as any).updated_at ? new Date((row as any).updated_at) : undefined,
        })
      }

      const { data: coaches } = await sb
        .from('coach_profiles')
        .select('slug,user_id,updated_at')
        .limit(1000)
      for (const row of coaches || []) {
        const idOrSlug = (row as any).slug || (row as any).user_id
        urls.push({
          url: `${base}/c/${idOrSlug}`,
          changeFrequency: 'weekly',
          priority: 0.6,
          lastModified: (row as any).updated_at ? new Date((row as any).updated_at) : undefined,
        })
      }
    }
  } catch {}

  return urls
}
