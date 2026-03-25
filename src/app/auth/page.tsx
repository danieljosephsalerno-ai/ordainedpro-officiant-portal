"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/supabase/utils/client"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

function AuthForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const nextUrl = searchParams.get("next") || "/"
    
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [isLogin, setIsLogin] = useState(true)
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState("")

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setMessage("")
        
        try {
            let result
            if (isLogin) {
                result = await supabase.auth.signInWithPassword({ email, password })
                console.log("Login result:", {
                    hasSession: !!result.data.session,
                    hasUser: !!result.data.user,
                    error: result.error?.message
                })
                
                if (result.error) throw result.error
                if (!result.data.session) {
                    throw new Error("No session returned from login")
                }
                
                setMessage("Login successful! Verifying session...")
                
                // Wait for Supabase's storage adapter to save the session
                await new Promise(resolve => setTimeout(resolve, 1000))
                
                // Verify session is readable by Supabase
                const { data: { session }, error: sessionError } = await supabase.auth.getSession()
                
                if (!session) {
                    throw new Error("Session not found after login")
                }
                
                setMessage("Success! Redirecting to dashboard...")
                await new Promise(resolve => setTimeout(resolve, 500))
                
                // Force a full page refresh to ensure clean state
                window.location.href = nextUrl
            } else {
                result = await supabase.auth.signUp({ email, password })
                setMessage("Signup successful! Please check your email to confirm your account. Login after confirmation.")
                console.log("Signup result:", result)
                if (result.error) throw result.error
            }
        } catch (err: any) {
            console.error("Auth error:", err)
            setMessage("Error: " + err.message)
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
                <p className="text-center mt-4 text-sm text-gray-700">{message}</p>
            )}
        </div>
    )
}

function AuthLoading() {
    return (
        <div className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-md">
            <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-1/2 mx-auto mb-6"></div>
                <div className="space-y-4">
                    <div className="h-10 bg-gray-200 rounded"></div>
                    <div className="h-10 bg-gray-200 rounded"></div>
                    <div className="h-10 bg-blue-200 rounded"></div>
                </div>
            </div>
        </div>
    )
}

export default function AuthPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
            <Suspense fallback={<AuthLoading />}>
                <AuthForm />
            </Suspense>
        </div>
    )
}
