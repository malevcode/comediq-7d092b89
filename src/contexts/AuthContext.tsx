
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
        emailRedirectTo: `${window.location.origin}/open-mics`,
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
          }
        }
      }, 500);
    }
    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Error signing out:', error);
  };

  const value = {
    user,
    session,
    signUp,
    signIn,
    signOut,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
