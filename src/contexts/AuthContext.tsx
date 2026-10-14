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
type SubscriptionPlan = 'free' | 'premium';

interface ProfileAccessFields {
  isadmin: boolean;
  subscription_plan: SubscriptionPlan;
  credits_balance: number;
  is_comedian: boolean | null;
}

interface UserRoleRow {
  role: Exclude<UserRole, null>;
}

interface AuthContextType {
  user: AppUser | null;
  session: Session | null;
  signIn: (email: string, password: string) => Promise<{ error: unknown }>;
  signOut: () => Promise<void>;
  loading: boolean;
  visitInserted: boolean;
  resetVisitInserted: () => void;
  isAdmin: boolean;
  role: UserRole;
  subscriptionPlan: SubscriptionPlan;
  creditsBalance: number;
  /** null until they answer at signup, which is what the prompt keys off. */
  isComedian: boolean | null;
  needsOnboarding: boolean;
  refreshProfile: () => void;
}

const PROFILE_COLUMNS = 'isadmin, subscription_plan, credits_balance, is_comedian';
const PROFILE_COLUMNS_WITHOUT_COMEDIAN = 'isadmin, subscription_plan, credits_balance';

/**
 * One request normally. If it fails, try again without is_comedian.
 *
 * That column arrives in a migration, and this app has shipped ahead of its
 * database before. Selecting a column Postgres does not have fails the whole
 * row, which would quietly drop admin rights and subscription state for
 * everyone. Losing the onboarding prompt until the migration lands is the far
 * cheaper failure, so the fallback reports is_comedian as answered.
 */
async function fetchProfileAccess(userId: string): Promise<ProfileAccessFields | null> {
  const full = await supabase
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .eq('user_id', userId)
    .maybeSingle<ProfileAccessFields>();

  if (!full.error) return full.data;

  const legacy = await supabase
    .from('profiles')
    .select(PROFILE_COLUMNS_WITHOUT_COMEDIAN)
    .eq('user_id', userId)
    .maybeSingle<Omit<ProfileAccessFields, 'is_comedian'>>();

  return legacy.data ? { ...legacy.data, is_comedian: false } : null;
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

function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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
  const [isComedian, setIsComedian] = useState<boolean | null>(null);

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
      setIsComedian(null);
      return;
    }
    setProfileLoading(true);
    setProfileChecked(false);
    Promise.all([
      fetchProfileAccess(user.id),
      supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id),
    ]).then(([profile, rolesResult]) => {
      const roles = ((rolesResult.data || []) as UserRoleRow[]).map(row => row.role);
      const primaryRole = roles.find(r => r !== 'admin') ?? null;

      setRole(primaryRole);
      setIsAdmin(!!profile?.isadmin || roles.includes('admin'));
      setSubscriptionPlan(profile?.subscription_plan ?? 'free');
      setCreditsBalance(profile?.credits_balance ?? 0);
      setIsComedian(profile?.is_comedian ?? null);
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
    const todayStr = getLocalDateKey();
    supabase
      .from('user_visits')
      .select('id')
      .eq('user_id', user.id)
      .eq('visit_date', todayStr)
      .then(({ data }) => {
        if (!data || data.length === 0) {
          supabase.from('user_visits')
            .insert([{ user_id: user.id, visit_date: todayStr }])
            .then(({ error }) => { if (!error) setVisitInserted(true); });
        }
      });
  }, [user?.id]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
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

  // Asked once, on the first signed-in load where the answer is still missing.
  // profileChecked gates it so a slow fetch does not flash the prompt at people
  // who already answered.
  const needsOnboarding = !!user && profileChecked && isComedian === null;

  return (
    <AuthContext.Provider value={{ user, session, signIn, signOut, loading: loading || profileLoading || (!!user && !profileChecked), visitInserted, resetVisitInserted, isAdmin, role, subscriptionPlan, creditsBalance, isComedian, needsOnboarding, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
