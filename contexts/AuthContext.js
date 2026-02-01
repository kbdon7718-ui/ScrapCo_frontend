import React, {createContext, useEffect, useMemo, useState} from 'react';
import {isAuthBypassed, isSupabaseConfigured, supabase} from '../lib/supabase';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [directMode, setDirectMode] = useState(false);

  useEffect(() => {
    if (isAuthBypassed) {
      setDirectMode(true);
      setSession({
        user: {
          id: 'dev-user',
          phone: '+0000000000',
          user_metadata: {full_name: 'Dev User'},
        },
      });
      setLoading(false);
      return;
    }

    if (!isSupabaseConfigured || !supabase) {
      setSession(null);
      setLoading(false);
      return;
    }

    let mounted = true;

    (async () => {
      try {
        const {data} = await supabase.auth.getSession();
        if (!mounted) return;
        setSession(data.session ?? null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    const {data: sub} = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession ?? null);
    });

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe();
    };
  }, []);

  async function loginWithEmail(email, password) {
    if (isAuthBypassed || directMode) return;
    if (!supabase) throw new Error('Supabase is not configured');
    const {error} = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async function signupWithEmail(fullName, email, password) {
    if (isAuthBypassed || directMode) return;
    if (!supabase) throw new Error('Supabase is not configured');
    const {error} = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });
    if (error) throw error;
  }

  function directLogin() {
    setDirectMode(true);
    setSession({
      user: {
        id: 'dev-user',
        phone: '+0000000000',
        user_metadata: {full_name: 'Dev User'},
      },
    });
    setLoading(false);
  }

  async function logout() {
    if (isAuthBypassed || directMode) {
      setSession(null);
      return;
    }
    if (!supabase) return;
    await supabase.auth.signOut();
  }

  const value = useMemo(() => {
    const user = session?.user ?? null;
    return {
      session,
      user,
      loading,
      configured: isSupabaseConfigured || isAuthBypassed || directMode,
      bypassed: isAuthBypassed || directMode,
      directLogin,
      loginWithEmail,
      signupWithEmail,
      logout,
    };
  }, [session, loading, directMode]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
