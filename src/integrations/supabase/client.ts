import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// External Supabase project (user-provided). Hardcoded so it overrides the
// Lovable Cloud-managed VITE_SUPABASE_* env vars that point at a different project.
const SUPABASE_URL = 'https://oyfuknyazahhaqealwnk.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95ZnVrbnlhemFoaGFxZWFsd25rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwMzA5NjIsImV4cCI6MjA5NDYwNjk2Mn0.J1kN146nvnsQBlz3Qv25RSSo-F5lrTODfQ4X4eJwskQ';

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  throw new Error('Missing Supabase Project URL or anon public key.');
}

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storageKey: 'medelectra-auth',
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

