import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? 'https://ckfphcamfaiegswjhwpb.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrZnBoY2FtZmFpZWdzd2pod3BiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwMzY2MzMsImV4cCI6MjA5NDYxMjYzM30.42_cujGpy9uEXLC1tEQnG862-SLkoe-rZM2JRvy2XtA';

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

