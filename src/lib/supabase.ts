"use client"

// Re-export from the main Supabase client
export {
  supabase,
  getSupabaseClient,
  isSupabaseConfigured,
  checkConnection
} from "@/supabase/utils/client";
