import { pb } from '@/integrations/pocketbase/client';

// PocketBase auth — same function signatures as src/api/auth.ts

export async function signIn(email: string, password: string) {
  const authData = await pb.collection('users').authWithPassword(email, password);
  return { user: authData.record, session: null };
}

export async function signUp(email: string, password: string) {
  await pb.collection('users').create({
    email,
    password,
    passwordConfirm: password,
  });
  const authData = await pb.collection('users').authWithPassword(email, password);
  return { user: authData.record, session: null };
}

export async function signOut() {
  pb.authStore.clear();
}

export async function getSession() {
  const user = pb.authStore.isValid ? pb.authStore.record : null;
  return { session: null, user };
}

export function onAuthStateChange(callback: (session: null, user: any) => void) {
  const unsubscribe = pb.authStore.onChange(() => {
    const user = pb.authStore.isValid ? pb.authStore.record : null;
    callback(null, user);
  });
  // Return a subscription-like object matching Supabase's interface
  return { unsubscribe };
}

export async function signInWithGoogle() {
  return pb.collection('users').authWithOAuth2({ provider: 'google' });
}
