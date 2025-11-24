
"use client";

import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// ✅ Do NOT override cookies here — browser handles them automatically
export const supabase = createBrowserClient(supabaseUrl, supabaseKey);
