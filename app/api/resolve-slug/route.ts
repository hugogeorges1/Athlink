import { supabaseServer } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function resolveSlugToUserId(slug: string): Promise<string | null> {
  const supabase = supabaseServer()
  const { data } = await supabase
    .from('athlete_profiles')
    .select('user_id')
    .eq('slug', slug)
    .maybeSingle()
  
  return data?.user_id || null
}
