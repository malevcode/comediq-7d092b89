import React, { createContext, useContext, useEffect, useState } from 'react';
import { pb } from '@/integrations/pocketbase/client';
import { recordUserVisit } from '@/api/pb/profiles';

// Mirrors AuthContextType exactly so all useAuth() call sites work unchanged
interface AuthContextType {
  user: any | null;
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
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(pb.authStore.isValid ? pb.authStore.record : null);
  const [loading, setLoading] = useState(true);
  const [visitInserted, setVisitInserted] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Subscribe to auth store changes (replaces supabase.auth.onAuthStateChange)
  useEffect(() => {
    setLoading(false);

    const unsubscribe = pb.authStore.onChange(() => {
      const current = pb.authStore.isValid ? pb.authStore.record : null;
      setUser(current);
    });

    return () => unsubscribe();
  }, []);

  // Fetch isAdmin from profiles whenever user changes
  useEffect(() => {
    if (!user) { setIsAdmin(false); return; }

    pb.collection('profiles').getFullList({
      filter: `supabase_user_id = "${user.id}" || user = "${user.id}"`,
      fields: 'isadmin',
    }).then(records => {
      setIsAdmin(!!(records[0] as any)?.isadmin);
    }).catch(() => setIsAdmin(false));
  }, [user?.id]);

  // Record daily visit
  useEffect(() => {
    if (!user) return;
    recordUserVisit(user.id)
      .then(() => setVisitInserted(true))
      .catch(console.error);
  }, [user?.id]);

  const signUp = async (
    email: string,
    password: string,
    username?: string,
    phone?: string
  ): Promise<{ error: Error | null }> => {
    try {
      // Check username uniqueness
      if (username) {
        const existing = await pb.collection('profiles').getFullList({
          filter: `username = "${username}"`,
          fields: 'id',
        });
        if (existing.length > 0) {
          return { error: new Error('That username is already taken.') };
        }
      }

      // Create auth user
      await pb.collection('users').create({
        email,
        password,
        passwordConfirm: password,
        username: username || email.split('@')[0],
      });

      // Sign in immediately
      const authData = await pb.collection('users').authWithPassword(email, password);

      // Create profile record
      await pb.collection('profiles').create({
        user: authData.record.id,
        supabase_user_id: authData.record.id,
        username: username || email.split('@')[0],
        phone: phone || null,
        isadmin: false,
        points_balance: 0,
      });

      return { error: null };
    } catch (err: any) {
      return { error: new Error(err?.message || 'Signup failed') };
    }
  };

  const signIn = async (email: string, password: string): Promise<{ error: unknown }> => {
    try {
      await pb.collection('users').authWithPassword(email, password);
      return { error: null };
    } catch (err) {
      return { error: err };
    }
  };

  const signOut = async () => {
    pb.authStore.clear();
  };

  const resetVisitInserted = () => setVisitInserted(false);

  return (
    <AuthContext.Provider value={{
      user,
      session: null,
      signUp,
      signIn,
      signOut,
      loading,
      visitInserted,
      resetVisitInserted,
      isAdmin,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
