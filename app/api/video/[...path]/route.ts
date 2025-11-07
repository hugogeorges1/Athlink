import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server'

// Proxies a public URL for a stored video path in the `video` bucket (singular)
// URL format: /api/video/<userId>/<filename>
export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
  const path = (params.path || []).join('/')
  if (!path) return NextResponse.json({ error: 'Missing path' }, { status: 400 })
  const supabase = supabaseServer()
  const { data } = supabase.storage.from('video').getPublicUrl(path)
  return NextResponse.redirect(data.publicUrl, 302)
}
