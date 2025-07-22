
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  signUp: (email: string, password: string, username?: string, phone?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
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
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [visitInserted, setVisitInserted] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch isAdmin from profiles table whenever user changes
  useEffect(() => {
    if (user) {
      supabase
        .from('profiles')
        .select('isadmin')
        .eq('user_id', user.id)
        .single<{ isadmin: boolean }>()
        .then(({ data, error }) => {
          if (error || !data) {
            setIsAdmin(false);
          } else {
            setIsAdmin(!!(data as { isadmin: boolean }).isadmin);
          }
        });
    } else {
      setIsAdmin(false);
    }
  }, [user]);

  // Record a visit whenever a user is logged in (session restored or login), but only once per day
  useEffect(() => {
    if (!user) return;

    // Get today's date in YYYY-MM-DD (local time)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().slice(0, 10);

    // Check if a visit for today already exists
    const checkAndInsertVisit = async () => {
      const { data, error } = await supabase
        .from('user_visits')
        .select('id, visit_date')
        .eq('user_id', user.id)
        .gte('visit_date', todayStr + 'T00:00:00.000Z')
        .lt('visit_date', todayStr + 'T23:59:59.999Z');
      if (error) {
        console.error('Error checking user_visits:', error);
        return;
      }
      if (!data || data.length === 0) {
        // No visit for today, insert one
        const visitDate = new Date().toISOString();
        const { error: insertError, data: insertData } = await supabase
          .from('user_visits')
          .insert([{ user_id: user.id, visit_date: visitDate }]);
        if (insertError) {
          console.error('user_visits insert error:', insertError);
        } else {
          console.log('user_visits insert success (session restore):', insertData);
          setVisitInserted(true);
        }
      }
    };

    checkAndInsertVisit();
    // Only run when user changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const signUp = async (
    email: string,
    password: string,
    username?: string,
    phone?: string
  ): Promise<{ error: Error | null }> => {
    // 0️⃣ PRE-CHECK username uniqueness
    if (username) {
      const { count, error: countError } = await supabase
        .from('profiles')
        .select('*', { head: true, count: 'exact' })
        .eq('username', username);
  
      if (countError) {
        return { error: new Error(countError.message) };
      }
      if (count! > 0) {
        return { error: new Error('That username is already taken.') };
      }
    }
  
    // 1️⃣ sign up in Auth…
    const { data: { user }, error: signUpErr } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/perform`,
        data: { username: username || email.split('@')[0], ...(phone ? { phone } : {}) }
      }
    });
    if (signUpErr || !user) {
      return { error: new Error(signUpErr?.message || 'Signup failed') };
    }
  
    // 2️⃣ upsert your profile
    const { error: profileErr, status } = await supabase
      .from('profiles')
      .upsert(
        { user_id: user.id, username: username || email.split('@')[0], phone: phone ?? null },
        { onConflict: 'user_id' }
      );
    if (profileErr) {
      if (status === 409) {
        return { error: new Error('That username is already taken.') };
      }
      return { error: new Error(profileErr.message) };
    }
  
    // 3️⃣ success
    return { error: null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    // Record visit if login successful and user is available
    if (!error) {
      // Wait for user state to update
      setTimeout(async () => {
        const currentUser = supabase.auth.getUser ? (await supabase.auth.getUser()).data.user : null;
        const userId = currentUser?.id || user?.id;
        if (userId) {
          const visitDate = new Date().toISOString();
          console.log('Inserting user_visits:', { userId, visitDate });
          const { error: insertError, data: insertData } = await supabase
            .from('user_visits')
            .insert([{ user_id: userId, visit_date: visitDate }]);
          if (insertError) {
            console.error('user_visits insert error:', insertError);
          } else {
            console.log('user_visits insert success:', insertData);
            setVisitInserted(true); // Trigger visitInserted
          }
        }
      }, 500);
    }
    return { error };
  };

  // Function to reset visitInserted after Home refetches
  const resetVisitInserted = () => setVisitInserted(false);

  const signOut = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setUser(null);
      setSession(null);
      return;
    }
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
      // Fallback: clear local state anyway
      setUser(null);
      setSession(null);
    }
  };

  const value = {
    user,
    session,
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
