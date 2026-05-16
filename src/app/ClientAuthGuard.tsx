"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/supabase/utils/client"
import type { User, AuthChangeEvent, Session } from "@supabase/supabase-js"
import PortalClient from "./PortalClient"

export default function ClientAuthGuard() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)

  // Supabase client is a singleton - no need for useMemo

  useEffect(() => {
    // Check current session with timeout protection
    const checkAuth = async () => {
      // Set a timeout to prevent infinite loading
      const authTimeout = setTimeout(() => {
        console.error("❌ Auth check timed out after 15 seconds")
        setAuthError("Authentication timed out. Please refresh the page.")
        setLoading(false)
      }, 15000)

      try {
        console.log("🔍 Checking authentication...")

        // Safety check - make sure supabase is available
        if (!supabase || !supabase.auth) {
          clearTimeout(authTimeout)
          console.error("❌ Supabase client not available")
          setAuthError("Authentication service unavailable")
          setLoading(false)
          return
        }

        // First try getSession for faster initial check
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          console.error("❌ Session error:", sessionError.message)
        }

        if (session?.user) {
          clearTimeout(authTimeout)
          console.log("✅ User authenticated via session:", session.user.email)
          setUser(session.user)
          setLoading(false)
          return
        }

        // Fallback to getUser() which validates with server
        const { data: { user }, error } = await supabase.auth.getUser()

        clearTimeout(authTimeout)
        console.log("🔍 Auth check result:", {
          hasUser: !!user,
          email: user?.email,
          error: error?.message
        })

        if (error || !user) {
          console.log("❌ No user found, redirecting to /auth")
          setIsRedirecting(true)
          setLoading(false)
          router.replace("/auth")
          return
        }

        console.log("✅ User authenticated:", user.email)
        setUser(user)
        setLoading(false)
      } catch (error) {
        clearTimeout(authTimeout)
        console.error("Auth check error:", error)
        setAuthError("Authentication check failed")
        setIsRedirecting(true)
        setLoading(false)
        router.replace("/auth")
      }
    }

    checkAuth()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      console.log("🔄 Auth state changed:", { event, hasUser: !!session?.user })

      if (event === 'SIGNED_OUT' || !session?.user) {
        setUser(null)
        setIsRedirecting(true)
        router.replace("/auth")
      } else if (session?.user) {
        setUser(session.user)
        setIsRedirecting(false)
        setLoading(false)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router, supabase])

  // Show loading state
  if (loading || isRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {isRedirecting ? "Redirecting to login..." : "Checking authentication..."}
          </p>
          {authError && (
            <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
              <p className="text-red-600 text-sm">{authError}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-2 text-sm text-blue-600 hover:underline"
              >
                Click here to refresh
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // This shouldn't happen if redirecting works, but keep as fallback
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  return (
    <PortalClient
      user={{
        id: user.id,
        email: user.email || "",
      }}
    />
  )
}
