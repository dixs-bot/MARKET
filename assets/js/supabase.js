const SUPABASE_URL = 'https://mfixwlsfkgqibofujwlq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1maXh3bHNma2dxaWJvZnVqd2xxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwODI5MDksImV4cCI6MjA5MzY1ODkwOX0.On4A4b0qASEyjSm5-VcC0ik_X-D4N3anh3XA0x79ncY';

window.supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);
