import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export interface AppUser {
  id: string;
  email: string | null;
  phone: string | null;
  user_metadata: Record<string, unknown>;
}

interface AuthContextType {
  user: AppUser | null;
  session: Session | null;
  signUp: (email: string, password: string, username?: string, phone?: string) => Promise<{ error: unknown }>;
  signIn: (email: string, password: string) => Promise<{ error: unknown }>;
  signOut: () => Promise<void>;
  loading: boolean;
  visitInserted: boolean;
  resetVisitInserted: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

function toAppUser(u: User): AppUser {
  return {
    id: u.id,
    email: u.email ?? null,
    phone: u.phone ?? null,
    user_metadata: u.user_metadata ?? {},
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [visitInserted, setVisitInserted] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ? toAppUser(session.user) : null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ? toAppUser(session.user) : null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch isAdmin flag
  useEffect(() => {
    if (!user) { setIsAdmin(false); return; }
    supabase
      .from('profiles')
      .select('isadmin')
      .eq('user_id', user.id)
      .single<{ isadmin: boolean }>()
      .then(({ data, error }) => { setIsAdmin(!error && !!data?.isadmin); });
  }, [user?.id]);

  // Auto-create profile row on first sign-in
  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('id').eq('user_id', user.id).single().then(({ data }) => {
      if (!data) {
        supabase.from('profiles').insert({ user_id: user.id, phone: user.phone });
      }
    });
  }, [user?.id]);

  // Record a visit once per day
  useEffect(() => {
    if (!user) { setVisitInserted(false); return; }
    const todayStr = new Date().toISOString().slice(0, 10);
    supabase
      .from('user_visits')
      .select('id')
      .eq('user_id', user.id)
      .gte('visit_date', todayStr + 'T00:00:00.000Z')
      .lt('visit_date', todayStr + 'T23:59:59.999Z')
      .then(({ data }) => {
        if (!data || data.length === 0) {
          supabase.from('user_visits')
            .insert([{ user_id: user.id, visit_date: new Date().toISOString() }])
            .then(({ error }) => { if (!error) setVisitInserted(true); });
        }
      });
  }, [user?.id]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const resetVisitInserted = () => setVisitInserted(false);

  return (
    <AuthContext.Provider value={{ user, session, signUp, signIn, signOut, loading, visitInserted, resetVisitInserted, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};
