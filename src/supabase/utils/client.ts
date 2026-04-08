"use client";

import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Validate that the URL is actually valid (starts with http:// or https://)
const isValidUrl = (url: string) => {
  return url.startsWith('http://') || url.startsWith('https://');
};

const validSupabaseUrl = isValidUrl(supabaseUrl) ? supabaseUrl : "https://placeholder.supabase.co";
const validSupabaseKey = supabaseKey && !supabaseKey.includes('your-') ? supabaseKey : "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDUxOTI4MDAsImV4cCI6MTk2MDc2ODgwMH0.placeholder";

// Custom storage adapter - use localStorage (works better in iframes)
const customStorageAdapter = {
  getItem: (key: string) => {
    if (typeof window === 'undefined') return null;

    // Try localStorage first (works better in iframes)
    try {
      const value = window.localStorage.getItem(key);
      if (value) return value;
    } catch (e) {
      // localStorage not available
    }

    // Fallback to sessionStorage
    try {
      const value = window.sessionStorage.getItem(key);
      if (value) return value;
    } catch (e) {
      // sessionStorage not available
    }

    return null;
  },

  setItem: (key: string, value: string) => {
    if (typeof window === 'undefined') return;

    // Try localStorage first (works better in iframes)
    try {
      window.localStorage.setItem(key, value);
    } catch (e) {
      // localStorage not available
    }

    // Also try sessionStorage as backup
    try {
      window.sessionStorage.setItem(key, value);
    } catch (e) {
      // sessionStorage not available
    }
  },

  removeItem: (key: string) => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.removeItem(key);
      window.sessionStorage.removeItem(key);
    } catch (e) {
      // Storage not available
    }
  }
};

// ✅ Simple browser-only client - no SSR complexity
if (typeof window !== 'undefined' && !(window as any).__supabase) {
  (window as any).__supabase = createClient(
    validSupabaseUrl,
    validSupabaseKey,
    {
      auth: {
        persistSession: true,
        storage: customStorageAdapter,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
        storageKey: 'sb-ailrvrxibpizbvyroonp-auth-token'
      }
    }
  );
}

// Export the global instance (or create server-side dummy)
export const supabase = typeof window !== 'undefined'
  ? (window as any).__supabase
  : createClient(validSupabaseUrl, validSupabaseKey, {
      auth: { persistSession: false }
    });
