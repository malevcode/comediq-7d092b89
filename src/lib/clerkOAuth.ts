export type ClerkOAuthStrategy = 'oauth_google' | 'oauth_apple';

export const CLERK_OAUTH_REDIRECT_OPTIONS = {
  redirectUrl: '/sso-callback',
  redirectUrlComplete: '/perform',
  continueSignIn: true,
  continueSignUp: true,
} as const;

export async function startClerkOAuth(
  signIn: { authenticateWithRedirect: (params: typeof CLERK_OAUTH_REDIRECT_OPTIONS & { strategy: ClerkOAuthStrategy }) => Promise<void> } | null | undefined,
  strategy: ClerkOAuthStrategy,
) {
  if (!signIn?.authenticateWithRedirect) {
    throw new Error('Clerk is still initializing. Please wait a moment and try again.');
  }

  await signIn.authenticateWithRedirect({
    strategy,
    ...CLERK_OAUTH_REDIRECT_OPTIONS,
  });
}
