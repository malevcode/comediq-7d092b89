import React, { useState, useEffect } from 'react';
import { useSignIn, useSignUp, useClerk } from '@clerk/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import PageHeader from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { startClerkOAuth, type ClerkOAuthStrategy } from '@/lib/clerkOAuth';

type Step = 'phone' | 'otp';
type Flow = 'signin' | 'signup';

const GoogleIcon = () => (
  <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 18 18">
    <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.91c1.7-1.57 2.69-3.88 2.69-6.62Z" />
    <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.91-2.26c-.81.54-1.84.86-3.05.86-2.35 0-4.33-1.58-5.04-3.71H.96v2.33A9 9 0 0 0 9 18Z" />
    <path fill="#FBBC05" d="M3.96 10.71A5.41 5.41 0 0 1 3.68 9c0-.59.1-1.17.28-1.71V4.96H.96A9 9 0 0 0 0 9c0 1.45.35 2.82.96 4.04l3-2.33Z" />
    <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.34l2.58-2.58C13.46.89 11.42 0 9 0A9 9 0 0 0 .96 4.96l3 2.33C4.67 5.16 6.65 3.58 9 3.58Z" />
  </svg>
);

const AppleIcon = () => (
  <svg aria-hidden="true" className="h-4 w-4 text-foreground" viewBox="0 0 24 24" fill="currentColor">
    <path d="M16.4 12.1c0-2.4 2-3.5 2.1-3.6-1.1-1.6-2.8-1.8-3.4-1.9-1.4-.1-2.8.8-3.5.8-.7 0-1.8-.8-3-.8-1.5 0-2.9.9-3.7 2.2-1.6 2.8-.4 7 1.1 9.2.8 1.1 1.7 2.4 2.9 2.3 1.2 0 1.6-.7 3-0.7s1.8.7 3 .7c1.2 0 2-1.1 2.8-2.2.9-1.3 1.2-2.5 1.2-2.6 0 0-2.5-1-2.5-3.4ZM14.2 5.2c.6-.8 1.1-1.9 1-3-.9 0-2 .6-2.6 1.4-.6.7-1.1 1.8-1 2.9 1 0 2-.5 2.6-1.3Z" />
  </svg>
);

const Auth = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const clerk = useClerk();
  const { signIn, isLoaded: signInLoaded } = useSignIn();
  const { signUp, isLoaded: signUpLoaded } = useSignUp();

  const [step, setStep] = useState<Step>('phone');
  const [flow, setFlow] = useState<Flow>('signin');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<ClerkOAuthStrategy | null>(null);
  const [forceLoaded, setForceLoaded] = useState(false);

  // Diagnostic logging
  useEffect(() => {
    console.log('Auth Hook Status:', { signInLoaded, signUpLoaded, authLoading: !user && !signInLoaded });
    const timer = setTimeout(() => {
      console.log('Forcing load state after timeout');
      setForceLoaded(true);
    }, 3500);
    return () => clearTimeout(timer);
  }, [signInLoaded, signUpLoaded]);

  const isLoaded = signInLoaded || signUpLoaded || forceLoaded;

  const finalSignIn = signIn ?? clerk.client?.signIn;
  const finalSignUp = signUp ?? clerk.client?.signUp;

  useEffect(() => {
    if (user) navigate('/perform', { replace: true });
  }, [user, navigate]);

  const e164 = (raw: string) => {
    const digits = raw.replace(/\D/g, '');
    return '+1' + digits.slice(-10);
  };

  const displayPhone = (raw: string) => {
    const d = raw.replace(/\D/g, '').slice(-10);
    if (d.length < 10) return raw;
    return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  };

  const handleSendCode = async () => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) {
      setError('Enter a valid 10-digit US phone number');
      return;
    }
    if (!isLoaded || !finalSignIn) return;

    setSending(true);
    setError('');

    try {
      console.log('Sending code to:', e164(phone));
      await finalSignIn!.create({ identifier: e164(phone), strategy: 'phone_code' });
      setFlow('signin');
      setStep('otp');
    } catch (err: unknown) {
      console.error('Clerk Sign In Error:', err);
      const clerkErr = err as { errors?: Array<{ code?: string; message?: string }> };
      
      // If user doesn't exist, try signing them up
      if (clerkErr?.errors?.[0]?.code === 'form_identifier_not_found') {
        try {
          console.log('User not found, attempting signup for:', e164(phone));
          await finalSignUp!.create({ phoneNumber: e164(phone) });
          await finalSignUp!.preparePhoneNumberVerification({ strategy: 'phone_code' });
          setFlow('signup');
          setStep('otp');
        } catch (signUpErr: unknown) {
          console.error('Clerk Sign Up Error:', signUpErr);
          const e = signUpErr as { errors?: Array<{ message?: string }> };
          setError(e?.errors?.[0]?.message ?? 'Could not send code. Ensure SMS is enabled in Clerk dashboard.');
        }
      } else {
        setError(clerkErr?.errors?.[0]?.message ?? 'Could not send code. Try again.');
      }
    } finally {
      setSending(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!isLoaded) return;
    setVerifying(true);
    setError('');
    try {
      if (flow === 'signin') {
        const result = await finalSignIn!.attemptFirstFactor({ strategy: 'phone_code', code: otp });
        if (result.status === 'complete') navigate('/perform', { replace: true });
      } else {
        const result = await finalSignUp!.attemptPhoneNumberVerification({ code: otp });
        if (result.status === 'complete') navigate('/perform', { replace: true });
      }
    } catch (err: unknown) {
      const e = err as { errors?: Array<{ message?: string }> };
      setError(e?.errors?.[0]?.message ?? 'Invalid code. Try again.');
      setOtp('');
    } finally {
      setVerifying(false);
    }
  };

  const handleOAuthSignIn = async (strategy: ClerkOAuthStrategy) => {
    setOauthLoading(strategy);
    setError('');

    try {
      console.log('Starting OAuth with strategy:', strategy);
      await startClerkOAuth(finalSignIn, strategy);
    } catch (err: unknown) {
      console.error('Clerk OAuth Error:', err);
      const e = err as { errors?: Array<{ message?: string }> };
      setError(e?.errors?.[0]?.message ?? (err instanceof Error ? err.message : 'Could not start sign in. Try again.'));
      setOauthLoading(null);
    }
  };

  const handleResend = async () => {
    setOtp('');
    setError('');
    setStep('phone');
    await handleSendCode();
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Comediq" subtitle="Comedy Starts Here" />
      <div className="min-h-screen flex items-center justify-center px-4 pt-28 pb-24">
      <Card className="w-full max-w-sm shadow-lg">
        <CardContent className="pt-8 pb-8 px-6">
          {step === 'phone' ? (
            <div className="space-y-6">
              <div className="text-center space-y-1">
                <h1 className="font-display text-2xl font-bold">Welcome to Comediq</h1>
                <p className="text-muted-foreground text-sm">Enter your phone number to continue</p>
              </div>
              <div className="space-y-3">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => handleOAuthSignIn('oauth_google')}
                  disabled={!!oauthLoading || !isLoaded}
                >
                  <GoogleIcon />
                  {!isLoaded ? 'Loading...' : oauthLoading === 'oauth_google' ? 'Opening Google...' : 'Continue with Google'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => handleOAuthSignIn('oauth_apple')}
                  disabled={!!oauthLoading || !isLoaded}
                >
                  <AppleIcon />
                  {!isLoaded ? 'Loading...' : oauthLoading === 'oauth_apple' ? 'Opening Apple...' : 'Continue with Apple'}
                </Button>
                <div className="flex items-center gap-3 text-xs uppercase text-muted-foreground">
                  <div className="h-px flex-1 bg-border" />
                  <span>or</span>
                  <div className="h-px flex-1 bg-border" />
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <span className="flex items-center px-3 border rounded-md bg-muted text-sm font-medium select-none shrink-0">
                    +1
                  </span>
                  <Input
                    type="tel"
                    placeholder="(212) 555-1234"
                    value={phone}
                    onChange={(e) => { setPhone(e.target.value); setError(''); }}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendCode()}
                    autoFocus
                    autoComplete="tel-national"
                    className="flex-1"
                  />
                </div>
                {error && <p className="text-destructive text-sm">{error}</p>}
                <Button
                  className="w-full"
                  onClick={handleSendCode}
                  disabled={sending || !isLoaded}
                >
                  {sending ? 'Sending...' : 'Send code'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center space-y-1">
                <h1 className="font-display text-2xl font-bold">Check your texts</h1>
                <p className="text-muted-foreground text-sm">
                  Code sent to +1 {displayPhone(phone)}
                </p>
              </div>
              <div className="space-y-3">
                <Input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="6-digit code"
                  value={otp}
                  onChange={(e) => {
                    setOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
                    setError('');
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && otp.length === 6 && handleVerifyOtp()}
                  autoFocus
                  autoComplete="one-time-code"
                  maxLength={6}
                  className="text-center text-xl tracking-[0.5em]"
                />
                {error && <p className="text-destructive text-sm">{error}</p>}
                <Button
                  className="w-full"
                  onClick={handleVerifyOtp}
                  disabled={verifying || otp.length < 6}
                >
                  {verifying ? 'Verifying...' : 'Continue'}
                </Button>
                <button
                  type="button"
                  onClick={handleResend}
                  className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Resend code
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
};

export default Auth;
