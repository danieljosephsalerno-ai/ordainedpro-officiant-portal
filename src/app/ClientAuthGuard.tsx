"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/supabase/utils/client"
import type { User } from "@supabase/supabase-js"
import PortalClient from "./PortalClient"

export default function ClientAuthGuard() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [authState, setAuthState] = useState<'checking' | 'authenticated' | 'redirecting'>('checking')

  useEffect(() => {
    // Fast auth check using getSession() - this is instant (checks local storage only)
    const checkAuth = async () => {
      try {
        console.log("🔍 Checking authentication (fast check)...")

        // Safety check - make sure supabase is available
        if (!supabase || !supabase.auth) {
          console.error("❌ Supabase client not available")
          setAuthState('redirecting')
          router.replace("/auth")
          return
        }

        // getSession() is FAST - it only checks local JWT token, no server call
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          console.error("❌ Session error:", error.message)
          setAuthState('redirecting')
          router.replace("/auth")
          return
        }

        // If no session in local storage, redirect to login IMMEDIATELY
        if (!session?.user) {
          console.log("❌ No session found, redirecting to login")
          setAuthState('redirecting')
          router.replace("/auth")
          return
        }

        // Session exists - user is authenticated
        console.log("✅ User authenticated:", session.user.email)
        setUser(session.user)
        setAuthState('authenticated')

      } catch (error) {
        console.error("Auth check error:", error)
        setAuthState('redirecting')
        router.replace("/auth")
      }
    }

    checkAuth()

    // Listen for auth state changes (login/logout from other tabs)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("🔄 Auth state changed:", event)

      if (event === 'SIGNED_OUT' || !session?.user) {
        setUser(null)
        setAuthState('redirecting')
        router.replace("/auth")
      } else if (session?.user) {
        setUser(session.user)
        setAuthState('authenticated')
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router])

  // If redirecting to auth, show nothing (redirect is happening)
  if (authState === 'redirecting') {
    return null
  }

  // Show minimal loading only while checking (should be instant)
  if (authState === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  // User is authenticated - render the portal
  if (!user) {
    router.replace("/auth")
    return null
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
