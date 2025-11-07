import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');

  if (!slug) {
    return NextResponse.json(
      { error: 'Slug is required' },
      { status: 400 }
    );
  }

  try {
    // Vérifie d'abord dans la table athletes
    const { data: athlete, error: athleteError } = await supabase
      .from('athletes')
      .select('id, profiles:user_id (username)')
      .ilike('profiles.username', slug)
      .single();

    if (athlete && !athleteError) {
      return NextResponse.json({ 
        type: 'athlete', 
        id: athlete.id 
      });
    }

    // Si pas trouvé, vérifie dans la table coaches
    const { data: coach, error: coachError } = await supabase
      .from('coaches')
      .select('id, profiles:user_id (username)')
      .ilike('profiles.username', slug)
      .single();

    if (coach && !coachError) {
      return NextResponse.json({ 
        type: 'coach', 
        id: coach.id 
      });
    }

    // Si non trouvé, retourne une erreur 404
    return NextResponse.json(
      { error: 'Profile not found' },
      { status: 404 }
    );
  } catch (error) {
    console.error('Error resolving slug:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}