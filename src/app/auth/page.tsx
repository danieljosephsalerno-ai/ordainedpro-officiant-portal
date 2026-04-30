"use client"

import dynamic from 'next/dynamic'

// Loading component shown while AuthForm is loading (client-side only)
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
                <div className="h-4 bg-gray-100 rounded w-3/4 mx-auto mt-4"></div>
            </div>
        </div>
    )
}

// Dynamically import AuthForm with no SSR to avoid hydration issues
const AuthForm = dynamic(() => import('@/components/AuthForm'), {
    ssr: false,
    loading: () => <AuthLoading />
})

export default function AuthPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
            <AuthForm />
        </div>
    )
}
