
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useUser, useClerk } from '@clerk/react';
import { supabase } from '@/integrations/supabase/client';

export interface AppUser {
  id: string;
  email: string | null;
  phone: string | null;
  user_metadata: Record<string, unknown>;
}

interface AuthContextType {
  user: AppUser | null;
  session: null;
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
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user: clerkUser, isLoaded, isSignedIn } = useUser();
  const clerk = useClerk();
  const [visitInserted, setVisitInserted] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const user: AppUser | null = (isLoaded && isSignedIn && clerkUser)
    ? {
        id: clerkUser.id,
        email: clerkUser.primaryEmailAddress?.emailAddress ?? null,
        phone: clerkUser.primaryPhoneNumber?.phoneNumber ?? null,
        user_metadata: {
          full_name: clerkUser.fullName ?? '',
          username: clerkUser.username ?? '',
        },
      }
    : null;

  const loading = !isLoaded;

  // Fetch isAdmin flag from profiles table
  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      return;
    }
    supabase
      .from('profiles')
      .select('isadmin')
      .eq('user_id', user.id)
      .single<{ isadmin: boolean }>()
      .then(({ data, error }) => {
        setIsAdmin(!error && !!data?.isadmin);
      });
  }, [user?.id]);

  // Auto-create profile row on first sign-in with a new phone number
  useEffect(() => {
    if (!user) return;
    const ensureProfile = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();
      if (!data) {
        await supabase.from('profiles').insert({
          user_id: user.id,
          phone: user.phone,
        });
      }
    };
    ensureProfile();
  }, [user?.id]);

  // Record a visit once per day
  useEffect(() => {
    if (!user) {
      setVisitInserted(false);
      return;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().slice(0, 10);

    const checkAndInsertVisit = async () => {
      const { data } = await supabase
        .from('user_visits')
        .select('id')
        .eq('user_id', user.id)
        .gte('visit_date', todayStr + 'T00:00:00.000Z')
        .lt('visit_date', todayStr + 'T23:59:59.999Z');
      if (!data || data.length === 0) {
        const { error: insertError } = await supabase
          .from('user_visits')
          .insert([{ user_id: user.id, visit_date: new Date().toISOString() }]);
        if (!insertError) setVisitInserted(true);
      }
    };
    checkAndInsertVisit();
  }, [user?.id]);

  const resetVisitInserted = () => setVisitInserted(false);

  // No-op stubs — Clerk handles the actual auth flow in Auth.tsx
  const signIn = async (_email: string, _password: string) => ({ error: null });
  const signUp = async (_email: string, _password: string, _username?: string, _phone?: string) => ({ error: null });

  const signOut = async () => {
    await clerk.signOut();
  };

  const value: AuthContextType = {
    user,
    session: null,
    signUp,
    signIn,
    signOut,
    loading,
    visitInserted,
    resetVisitInserted,
    isAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
