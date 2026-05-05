import React, { useState, useEffect } from 'react';
import { useSignIn, useSignUp } from '@clerk/react';
import { Apple } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

type Step = 'phone' | 'otp';
type Flow = 'signin' | 'signup';

const Auth = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { signIn, isLoaded: signInLoaded } = useSignIn();
  const { signUp, isLoaded: signUpLoaded } = useSignUp();

  const [step, setStep] = useState<Step>('phone');
  const [flow, setFlow] = useState<Flow>('signin');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<'oauth_google' | 'oauth_apple' | null>(null);

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
    if (!signInLoaded || !signUpLoaded) return;

    setSending(true);
    setError('');

    try {
      await signIn!.create({ identifier: e164(phone), strategy: 'phone_code' });
      setFlow('signin');
      setStep('otp');
    } catch (err: unknown) {
      const clerkErr = err as { errors?: Array<{ code?: string; message?: string }> };
      if (clerkErr?.errors?.[0]?.code === 'form_identifier_not_found') {
        try {
          await signUp!.create({ phoneNumber: e164(phone) });
          await signUp!.preparePhoneNumberVerification({ strategy: 'phone_code' });
          setFlow('signup');
          setStep('otp');
        } catch (signUpErr: unknown) {
          const e = signUpErr as { errors?: Array<{ message?: string }> };
          setError(e?.errors?.[0]?.message ?? 'Could not send code. Try again.');
        }
      } else {
        setError(clerkErr?.errors?.[0]?.message ?? 'Could not send code. Try again.');
      }
    } finally {
      setSending(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!signInLoaded || !signUpLoaded) return;
    setVerifying(true);
    setError('');
    try {
      if (flow === 'signin') {
        const result = await signIn!.attemptFirstFactor({ strategy: 'phone_code', code: otp });
        if (result.status === 'complete') navigate('/perform', { replace: true });
      } else {
        const result = await signUp!.attemptPhoneNumberVerification({ code: otp });
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

  const handleOAuthSignIn = async (strategy: 'oauth_google' | 'oauth_apple') => {
    if (!signInLoaded) return;

    setOauthLoading(strategy);
    setError('');

    try {
      await signIn!.authenticateWithRedirect({
        strategy,
        redirectUrl: '/sso-callback',
        redirectUrlComplete: '/perform',
        continueSignIn: true,
        continueSignUp: true,
      });
    } catch (err: unknown) {
      const e = err as { errors?: Array<{ message?: string }> };
      setError(e?.errors?.[0]?.message ?? 'Could not start sign in. Try again.');
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
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm shadow-lg">
        <CardContent className="pt-8 pb-8 px-6">
          {step === 'phone' ? (
            <div className="space-y-6">
              <div className="text-center space-y-1">
                <h1 className="text-2xl font-bold">Welcome to Comediq</h1>
                <p className="text-muted-foreground text-sm">Enter your phone number to continue</p>
              </div>
              <div className="space-y-3">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => handleOAuthSignIn('oauth_google')}
                  disabled={!signInLoaded || !!oauthLoading}
                >
                  <span className="flex h-4 w-4 items-center justify-center font-semibold text-[15px] leading-none text-[#4285F4]">
                    G
                  </span>
                  {oauthLoading === 'oauth_google' ? 'Opening Google...' : 'Continue with Google'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => handleOAuthSignIn('oauth_apple')}
                  disabled={!signInLoaded || !!oauthLoading}
                >
                  <Apple className="h-4 w-4" aria-hidden="true" />
                  {oauthLoading === 'oauth_apple' ? 'Opening Apple...' : 'Continue with Apple'}
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
                  disabled={sending || !signInLoaded || !signUpLoaded}
                >
                  {sending ? 'Sending...' : 'Send code'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center space-y-1">
                <h1 className="text-2xl font-bold">Check your texts</h1>
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
  );
};

export default Auth;
