import PocketBase from 'pocketbase';

// URL will be set via env var at build time. Falls back to local dev.
const PB_URL = import.meta.env.VITE_POCKETBASE_URL || 'https://comediq-pb.fly.dev';

export const pb = new PocketBase(PB_URL);

// Keep auth token refreshed automatically
pb.autoCancellation(false);

// ─── Auth helpers (mirrors Supabase auth API shape used in the app) ───────────

export const pbAuth = {
  getUser: () => pb.authStore.record,
  isLoggedIn: () => pb.authStore.isValid,

  signInWithGoogle: async () => {
    return pb.collection('users').authWithOAuth2({ provider: 'google' });
  },

  signInWithEmail: async (email: string, password: string) => {
    return pb.collection('users').authWithPassword(email, password);
  },

  signUp: async (email: string, password: string, username?: string) => {
    const data = { email, password, passwordConfirm: password, username: username || '' };
    const record = await pb.collection('users').create(data);
    await pb.collection('users').authWithPassword(email, password);
    return record;
  },

  signOut: () => {
    pb.authStore.clear();
  },

  onAuthChange: (callback: (user: any) => void) => {
    return pb.authStore.onChange(() => callback(pb.authStore.record));
  },
};

// ─── Typed collection accessors ───────────────────────────────────────────────
// Usage: pbFrom('open_mics_historical').getFullList({ filter: 'active = true' })

export const pbFrom = (collection: string) => pb.collection(collection);

export default pb;
