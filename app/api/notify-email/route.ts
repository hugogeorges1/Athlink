import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'edge'

export async function POST(req: Request) {
  try {
    const { type, recipientId, title, url, preview } = await req.json() as {
      type: 'message',
      recipientId: string,
      title?: string,
      url?: string,
      preview?: string,
    }

    if (type !== 'message' || !recipientId) {
      return NextResponse.json({ ok: true }, { status: 200 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    if (!supabaseUrl || !supabaseAnon) {
      return NextResponse.json({ ok: false, error: 'Missing Supabase env' }, { status: 500 })
    }

    const sb = createClient(supabaseUrl, supabaseAnon)
    const { data: settings } = await sb
      .from('user_settings')
      .select('notification_email, email_on_message')
      .eq('user_id', recipientId)
      .maybeSingle()

    if (!settings || !settings.notification_email || settings.email_on_message === false) {
      return new NextResponse(null, { status: 204 })
    }

    const resendKey = process.env.RESEND_API_KEY
    if (!resendKey) {
      return NextResponse.json({ ok: false, error: 'Missing RESEND_API_KEY' }, { status: 500 })
    }
    const resend = new Resend(resendKey)

    const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const link = url || `${base}/messages/${recipientId}`
    const subject = title || 'Nouveau message sur ATHLINK'
    const html = `
      <div style="font-family: Inter, Arial, sans-serif; line-height:1.5;">
        <h2 style="margin:0 0 8px 0;">${subject}</h2>
        <p style="margin:0 0 8px 0; color:#475569;">${preview || 'Tu as reçu un nouveau message.'}</p>
        <p style="margin:16px 0;">
          <a href="${link}" style="background:#0F172A;color:#fff;padding:10px 14px;border-radius:8px;text-decoration:none;">Ouvrir la messagerie</a>
        </p>
      </div>
    `

    await resend.emails.send({
      from: 'ATHLINK <no-reply@athlink.app>',
      to: settings.notification_email,
      subject,
      html,
    })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Unknown error' }, { status: 500 })
  }
}
