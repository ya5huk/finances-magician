import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Check if the user's email is allowed
      const {
        data: { user },
      } = await supabase.auth.getUser()

      const allowedEmails = (process.env.ALLOWED_EMAIL ?? '').split(',').map(e => e.trim())
      if (!user?.email || !allowedEmails.includes(user.email)) {
        await supabase.auth.signOut()
        return NextResponse.redirect(
          `${origin}/login?error=unauthorized`
        )
      }

      return NextResponse.redirect(`${origin}/overview`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
