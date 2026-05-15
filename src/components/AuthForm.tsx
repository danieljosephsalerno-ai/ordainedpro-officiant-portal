"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase, isSupabaseConfigured } from "@/supabase/utils/client"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function AuthForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [nextUrl, setNextUrl] = useState("/")

    // Check if Supabase is configured on mount
    useEffect(() => {
        if (!isSupabaseConfigured()) {
            console.error("Supabase is not configured! Check environment variables.")
        } else {
            console.log("Supabase configured correctly")
        }
    }, [])

    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [isLogin, setIsLogin] = useState(true)
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState("")

    // Supabase client is imported as a singleton - no need for useMemo

    // Read searchParams after component mounts
    useEffect(() => {
        const next = searchParams.get("next")
        if (next) {
            setNextUrl(next)
        }
    }, [searchParams])

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setMessage("")

        try {
            if (isLogin) {
                console.log("Attempting login...")

                // Add timeout to prevent hanging forever
                const loginPromise = supabase.auth.signInWithPassword({
                    email,
                    password
                })

                const timeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => reject(new Error("Login timed out. Please check your connection and try again.")), 15000)
                })

                const { data, error } = await Promise.race([loginPromise, timeoutPromise]) as any

                if (error) {
                    console.error("Login error:", error.message)
                    throw error
                }

                if (!data.session) {
                    throw new Error("No session returned from login")
                }

                console.log("Login successful:", {
                    hasSession: !!data.session,
                    email: data.user?.email
                })

                setMessage("Login successful! Redirecting...")

                // Use window.location for full page reload to ensure cookies are properly read
                await new Promise(resolve => setTimeout(resolve, 300))
                window.location.href = nextUrl
            } else {
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password
                })

                if (error) throw error

                setMessage("Signup successful! Please check your email to confirm your account.")
                console.log("✅ Signup result:", data)
                setLoading(false)
            }
        } catch (err: unknown) {
            console.error("Auth error:", err)
            const errorMessage = err instanceof Error ? err.message : "An error occurred"
            setMessage("❌ " + errorMessage)
            setLoading(false)
        }
    }

    return (
        <div className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-md">
            <h1 className="text-2xl font-bold text-center text-blue-800 mb-6">
                {isLogin ? "Sign In" : "Create Account"}
            </h1>

            <form onSubmit={handleAuth} className="space-y-4">
                <Input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <Input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <Button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    disabled={loading}
                >
                    {loading ? "Please wait..." : isLogin ? "Sign In" : "Sign Up"}
                </Button>
            </form>

            <p className="text-center text-sm text-gray-600 mt-4">
                {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
                <button
                    onClick={() => setIsLogin(!isLogin)}
                    className="text-blue-600 hover:underline"
                >
                    {isLogin ? "Sign Up" : "Sign In"}
                </button>
            </p>

            {message && (
                <p className={`text-center mt-4 text-sm ${
                    message.startsWith("❌") ? "text-red-600" : "text-green-600"
                }`}>
                    {message}
                </p>
            )}
        </div>
    )
}
