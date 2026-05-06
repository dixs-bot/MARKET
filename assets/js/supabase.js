const SUPABASE_URL = 'PASTE_URL_KAMU';
const SUPABASE_ANON_KEY = 'PASTE_ANON_KEY_KAMU';

window.supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);