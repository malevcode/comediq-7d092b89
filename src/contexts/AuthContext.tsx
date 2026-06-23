import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export interface AppUser {
  id: string;
  email: string | null;
  phone: string | null;
  user_metadata: Record<string, unknown>;
}

type UserRole = 'performer' | 'host' | 'showrunner' | 'admin' | null;
type SubscriptionPlan = 'free' | 'standard' | 'premium';

interface ProfileAccessFields {
  isadmin: boolean;
  subscription_plan: SubscriptionPlan;
  credits_balance: number;
}

interface UserRoleRow {
  role: Exclude<UserRole, null>;
}

interface AuthContextType {
  user: AppUser | null;
  session: Session | null;
  signUp: (email: string, password: string, username?: string, phone?: string, emailRedirectTo?: string) => Promise<{ error: unknown }>;
  signIn: (email: string, password: string) => Promise<{ error: unknown }>;
  signOut: () => Promise<void>;
  loading: boolean;
  visitInserted: boolean;
  resetVisitInserted: () => void;
  isAdmin: boolean;
  role: UserRole;
  subscriptionPlan: SubscriptionPlan;
  creditsBalance: number;
  needsOnboarding: boolean;
  refreshProfile: () => void;
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
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileChecked, setProfileChecked] = useState(false);
  const [visitInserted, setVisitInserted] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [role, setRole] = useState<UserRole>(null);
  const [subscriptionPlan, setSubscriptionPlan] = useState<SubscriptionPlan>('free');
  const [creditsBalance, setCreditsBalance] = useState(0);
  const [profileFetchKey, setProfileFetchKey] = useState(0);

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

  // Fetch access from dedicated role rows. Profile admin remains a legacy fallback.
  useEffect(() => {
    if (!user) {
      setProfileLoading(false);
      setProfileChecked(true);
      setIsAdmin(false);
      setRole(null);
      setSubscriptionPlan('free');
      setCreditsBalance(0);
      return;
    }
    setProfileLoading(true);
    setProfileChecked(false);
    Promise.all([
      supabase
      .from('profiles')
      .select('isadmin, subscription_plan, credits_balance')
      .eq('user_id', user.id)
        .maybeSingle<ProfileAccessFields>(),
      supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id),
    ]).then(([profileResult, rolesResult]) => {
      const roles = ((rolesResult.data || []) as UserRoleRow[]).map(row => row.role);
      const primaryRole = roles.find(r => r !== 'admin') ?? null;

      setRole(primaryRole);
      setIsAdmin(!!profileResult.data?.isadmin || roles.includes('admin'));
      setSubscriptionPlan(profileResult.data?.subscription_plan ?? 'free');
      setCreditsBalance(profileResult.data?.credits_balance ?? 0);
    }).finally(() => {
      setProfileLoading(false);
      setProfileChecked(true);
    });
  }, [user?.id, profileFetchKey]);

  // Auto-create profile row on first sign-in
  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').upsert(
      { user_id: user.id, phone: user.phone },
      { onConflict: 'user_id', ignoreDuplicates: true }
    );
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

  const signUp = async (email: string, password: string, _username?: string, _phone?: string, emailRedirectTo?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: emailRedirectTo ? { emailRedirectTo } : undefined,
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const resetVisitInserted = () => setVisitInserted(false);
  const refreshProfile = () => {
    setProfileLoading(true);
    setProfileChecked(false);
    setProfileFetchKey(k => k + 1);
  };

  const needsOnboarding = false;

  return (
    <AuthContext.Provider value={{ user, session, signUp, signIn, signOut, loading: loading || profileLoading || (!!user && !profileChecked), visitInserted, resetVisitInserted, isAdmin, role, subscriptionPlan, creditsBalance, needsOnboarding, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
