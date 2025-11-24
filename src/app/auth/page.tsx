
"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/supabase/utils/client"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function AuthPage() {
    const router = useRouter()
    // const searchParams = useSearchParams()
    const nextUrl = "/"
    // const nextUrl = searchParams.get("next") || "/"

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
                console.log("Login result:", result)
                setMessage("Login successful!")
            } else {
                result = await supabase.auth.signUp({ email, password })
                 setMessage("Signup successful! Please check your email to confirm your account. Login after confirmation.")
                console.log("Signup result:", result)
            }

            if (result.error) throw result.error

            router.push(nextUrl)
        } catch (err: any) {
            console.error("Auth error:", err)
            setMessage("❌ " + err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
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
        </div>
    )
}
