/**
 * Auth API
 * Handles all authentication-related operations
 */

import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

/**
 * Signs in a user with email and password
 */
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Signs up a new user
 */
export async function signUp(email: string, password: string) {
  const redirectUrl = `${window.location.origin}/`;
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: redirectUrl
    }
  });

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Signs out the current user
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
}

/**
 * Gets the current session
 */
export async function getSession(): Promise<{ session: Session | null; user: User | null }> {
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  return {
    session,
    user: session?.user ?? null,
  };
}

/**
 * Sets up auth state change listener
 */
export function onAuthStateChange(callback: (session: Session | null, user: User | null) => void) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => {
      callback(session, session?.user ?? null);
    }
  );

  return subscription;
}
