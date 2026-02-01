// Quick test script to verify Supabase email/password signup and login
// Usage: node tools/test-supabase-auth.js (from frontend folder)

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8');
const lines = env.split(/\r?\n/);
const map = {};
for (const l of lines) {
  const m = l.match(/^([^=]+)=([\s\S]*)$/);
  if (m) map[m[1]] = m[2];
}

const SUPABASE_URL = map.EXPO_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = map.EXPO_PUBLIC_SUPABASE_KEY || map.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Supabase URL or key not found in frontend/.env or env vars');
  process.exit(2);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

(async () => {
  try {
    const ts = Date.now();
    const email = `test+${ts}@example.com`;
    const password = 'Test1234!';
    console.log('Signing up user:', email);
    const { data: signupData, error: signupError } = await supabase.auth.signUp({ email, password }, { data: { full_name: 'Test User' } });
    if (signupError) {
      console.error('Signup error:', signupError.message || signupError);
    } else {
      console.log('Signup result:', signupData);
    }

    console.log('Attempting sign in for:', email);
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      console.error('Sign-in error:', signInError.message || signInError);
    } else {
      console.log('Sign-in success. Session user id:', signInData.session?.user?.id);
    }
  } catch (e) {
    console.error('Unexpected error:', e);
  }
})();
