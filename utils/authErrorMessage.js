export function authErrorMessage(err) {
  const raw = err?.message || String(err || '');

  // Common Supabase Auth (GoTrue) generic error when an auth.users trigger fails.
  if (/database error saving new user/i.test(raw)) {
    return (
      'Supabase Auth could not create the user because a database trigger failed while saving the new user.\n\n' +
      'In this project the usual cause is the auth.users trigger that auto-inserts a row into public.profiles (handle_new_user_profile). If your profiles table requires phone NOT NULL (email-only signup has phone=null) or the profiles table/columns are missing, signup will fail.\n\n' +
      'Fix: apply/verify supabase/migrations/001_customer_rls_and_rpc.sql and ensure public.profiles.phone is nullable. Check Supabase → Logs → Postgres for the exact failing constraint.'
    );
  }

  if (/user already registered/i.test(raw)) {
    return 'This email is already registered. Try logging in instead.';
  }

  if (/password should be at least/i.test(raw) || /weak password/i.test(raw)) {
    return 'Password is too weak. Use at least 6 characters (preferably longer).';
  }

  if (/email.*invalid/i.test(raw)) {
    return 'Email address looks invalid. Please check and try again.';
  }

  return raw || 'Something went wrong.';
}
