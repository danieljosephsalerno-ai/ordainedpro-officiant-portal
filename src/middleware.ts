import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Helper function to validate Supabase configuration
function isSupabaseConfigured(): boolean {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

  // Check if URL is valid and not a placeholder
  const isValidUrl = supabaseUrl.startsWith('https://') &&
                     supabaseUrl.includes('supabase') &&
                     !supabaseUrl.includes('placeholder') &&
                     !supabaseUrl.includes('your-')

  // Check if key exists and is not a placeholder
  const isValidKey = supabaseKey.length > 50 &&
                     !supabaseKey.includes('your-') &&
                     !supabaseKey.includes('placeholder')

  return isValidUrl && isValidKey
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Skip Supabase auth check if not properly configured
  if (!isSupabaseConfigured()) {
    return supabaseResponse
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    const supabase = createServerClient(
      supabaseUrl,
      supabaseKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => {
              request.cookies.set(name, value)
            })
            supabaseResponse = NextResponse.next({
              request,
            })
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    // This will refresh session if expired - required for Server Components
    await supabase.auth.getUser()
  } catch (error) {
    // Silently fail if Supabase is not configured - allows app to work offline
    console.warn('Middleware: Supabase auth check skipped')
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
