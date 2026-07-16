import React, { useCallback, useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import SEO from '@/components/SEO';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Eye, EyeOff, Mic, ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import { getValidStripePaymentLink } from '@/utils/stripeLinks';
import { invokeSupabaseFunction } from '@/utils/supabaseFunctions';

const BRAND_BLUE = '#1a5fb4';
const STRIPE_PAID_LINK = getValidStripePaymentLink(
  import.meta.env.VITE_STRIPE_PAID_LINK,
);

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string') return message;
  }

  return fallback;
};

const isEmailRateLimitError = (error: unknown) =>
  {
    const message = getErrorMessage(error, '').toLowerCase();
    return message.includes('email rate limit')
      || message.includes('only request this after')
      || message.includes('rate limit');
  };

const getEmailRateLimitSeconds = (error: unknown) => {
  const message = getErrorMessage(error, '');
  const match = message.match(/after\s+(\d+)\s+seconds?/i);
  return match ? Number(match[1]) : 60;
};

const isDuplicateEmailError = (error: unknown) => {
  const message = getErrorMessage(error, '').toLowerCase();
  return message.includes('already registered')
    || message.includes('already exists')
    || message.includes('user already');
};

const isEmailConfirmationError = (error: unknown) => {
  const message = getErrorMessage(error, '').toLowerCase();
  return message.includes('email not confirmed') || message.includes('confirm your email');
};

// ─── Icons ────────────────────────────────────────────────────────────────────

const GoogleIcon = () => (
  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);


// ─── Types ────────────────────────────────────────────────────────────────────

type AuthStep =
  | 'main'             // Google + email OTP entry (sign in/up combined)
  | 'sign_in_options'  // alias for main
  | 'choose_plan'      // post-auth plan selection
  | 'email_otp_verify' // 6-digit email OTP
  | 'email_auth'       // email + password sign in
  | 'email_signup'     // create account with email (legacy, still reachable)
  | 'forgot_password'
  | 'reset_password';

type OtpVerificationType = 'email';

// ─── Component ────────────────────────────────────────────────────────────────

const Auth = () => {
  const [step, setStep] = useState<AuthStep>('main');
  const [otpEmail, setOtpEmail] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [otpVerificationType, setOtpVerificationType] = useState<OtpVerificationType>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pendingSignupPassword, setPendingSignupPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [resetConfirm, setResetConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [subscriptionRefreshRequested, setSubscriptionRefreshRequested] = useState(false);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([null, null, null, null, null, null]);
  const signInHeadingRef = useRef<HTMLHeadingElement | null>(null);
  const signInEmailRef = useRef<HTMLInputElement | null>(null);

  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, user, refreshProfile, subscriptionPlan } = useAuth();
  const { toast } = useToast();
  const searchParams = new URLSearchParams(location.search);
  const nextPathParam = searchParams.get('next');
  const shouldShowPlans = searchParams.get('plans') === 'true';
  const subscriptionSucceeded = searchParams.get('subscription') === 'success';
  const subscribeIntent = searchParams.get('subscribe') === 'true';
  const postAuthPath = nextPathParam?.startsWith('/') ? nextPathParam : '/';
  const authRedirectUrl = `${window.location.origin}/auth/sign-in?next=${encodeURIComponent(postAuthPath)}`;
  const plansParam = shouldShowPlans ? '&plans=true' : '';
  const subscribeParam = subscribeIntent ? '&subscribe=true' : '';
  const signInOptionsPath = `/auth/sign-in?next=${encodeURIComponent(postAuthPath)}${plansParam}${subscribeParam}`;
  const createAccountPath = `/auth/create?next=${encodeURIComponent(postAuthPath)}${plansParam}${subscribeParam}`;
  
  const authLandingPath = `/auth?next=${encodeURIComponent(postAuthPath)}${plansParam}${subscribeParam}`;
  const checkoutReturnPath = '/';

  // ── Redirect if already authed ────────────────────────────────────────────

  useEffect(() => {
    if (user && subscriptionSucceeded && !subscriptionRefreshRequested) {
      setSubscriptionRefreshRequested(true);
      refreshProfile();
      const retryId = window.setTimeout(refreshProfile, 2000);
      return () => window.clearTimeout(retryId);
    }
  }, [refreshProfile, subscriptionRefreshRequested, subscriptionSucceeded, user]);

  

  useEffect(() => {
    if (!user) return;
    if (step === 'reset_password') return;
    // Premium users — go straight to destination
    if (subscriptionPlan !== 'free') {
      navigate(postAuthPath);
      return;
    }
    // Free users — show plan chooser once after sign-in (unless explicitly skipped)
    if (step !== 'choose_plan' && !shouldShowPlans) {
      setStep('choose_plan');
    } else if (shouldShowPlans && step !== 'choose_plan') {
      setStep('choose_plan');
    }
  }, [user, subscriptionPlan, navigate, postAuthPath, shouldShowPlans, step]);

  // ── Detect password-reset link ────────────────────────────────────────────

  useEffect(() => {
    const params = new URLSearchParams(location.hash.substring(1));
    if (params.get('type') === 'recovery') setStep('reset_password');
  }, [location.hash]);

  useEffect(() => {
    if (step === 'reset_password' || step === 'choose_plan') return;
    if (user) return; // don't override step when authed
    // All auth routes show the unified sign-in screen by default
    if (step !== 'main' && step !== 'email_otp_verify' && step !== 'email_auth' && step !== 'email_signup' && step !== 'forgot_password') {
      setStep('main');
    }
  }, [location.pathname, step, user]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setStep('reset_password');
    });
    return () => subscription.unsubscribe();
  }, []);

  // ── Resend cooldown timer ─────────────────────────────────────────────────

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = setInterval(() => setResendCooldown(c => c - 1), 1000);
    return () => clearInterval(id);
  }, [resendCooldown]);

  useEffect(() => {
    if (step !== 'sign_in_options') return;
    const id = window.setTimeout(() => {
      signInEmailRef.current?.focus({ preventScroll: true });
    }, 100);
    return () => window.clearTimeout(id);
  }, [step]);

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleGoogleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: authRedirectUrl },
    });
    if (error) toast({ title: 'Google sign-in failed', description: error.message, variant: 'destructive' });
  };

  const routeToExistingAccountSignIn = (normalizedEmail: string, message: string) => {
    setLoading(false);
    setEmail(normalizedEmail);
    setPassword('');
    setPendingSignupPassword('');
    toast({
      title: 'Account already exists',
      description: message,
      variant: 'destructive',
    });
    navigate(signInOptionsPath, { replace: true });
    setStep('email_auth');
  };

  const handleVerifyOtp = useCallback(async (code?: string) => {
    const token = code ?? otpDigits.join('');
    if (token.length !== 6) return;
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      email: otpEmail,
      token,
      type: otpVerificationType,
    });
    if (error) {
      setLoading(false);
      toast({ title: 'Incorrect code', description: 'Check the code and try again.', variant: 'destructive' });
      setOtpDigits(['', '', '', '', '', '']);
      setTimeout(() => otpRefs.current[0]?.focus(), 50);
    } else {
      if (pendingSignupPassword) {
        const { error: passwordError } = await supabase.auth.updateUser({ password: pendingSignupPassword });
        if (passwordError) {
          setLoading(false);
          toast({
            title: 'Password was not saved',
            description: getErrorMessage(passwordError, 'You are signed in, but your password could not be saved.'),
            variant: 'destructive',
          });
          return;
        }
        setPendingSignupPassword('');
      }
      setLoading(false);
      navigate(postAuthPath);
    }
  }, [navigate, otpDigits, otpEmail, otpVerificationType, pendingSignupPassword, postAuthPath, toast]);

  // ── Auto-submit when all OTP digits filled ────────────────────────────────

  useEffect(() => {
    if (step === 'email_otp_verify' && otpDigits.every(d => d !== '')) {
      handleVerifyOtp(otpDigits.join(''));
    }
  }, [handleVerifyOtp, otpDigits, step]);


  const handleSendEmailCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: otpEmail,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: authRedirectUrl,
      },
    });
    setLoading(false);
    if (error) {
      if (isEmailRateLimitError(error)) {
        toast({
          title: 'Error',
          description: 'Email rate limit exceeded. Try again later.',
          variant: 'destructive',
        });
      } else {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      }
    } else {
      setOtpVerificationType('email');
      setOtpDigits(['', '', '', '', '', '']);
      setStep('email_otp_verify');
      setResendCooldown(60);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0 || loading) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: otpEmail,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: authRedirectUrl,
      },
    });
    setLoading(false);
    if (error) {
      if (isEmailRateLimitError(error)) {
        toast({
          title: 'Error',
          description: 'Email rate limit exceeded. Try again later.',
          variant: 'destructive',
        });
      } else {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      }
    } else {
      toast({ title: 'Code resent' });
      setResendCooldown(60);
      setOtpDigits(['', '', '', '', '', '']);
      setTimeout(() => otpRefs.current[0]?.focus(), 50);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      const digits = value.replace(/\D/g, '').slice(0, 6).split('');
      const next = ['', '', '', '', '', ''];
      digits.forEach((d, i) => { next[i] = d; });
      setOtpDigits(next);
      const focusIdx = Math.min(digits.length - 1, 5);
      otpRefs.current[focusIdx]?.focus();
      return;
    }
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...otpDigits];
    next[index] = digit;
    setOtpDigits(next);
    if (digit && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      if (isEmailConfirmationError(error)) {
        toast({
          title: 'Email confirmation required',
          description: 'Your password was saved, but this email needs to be confirmed before sign-in.',
          variant: 'destructive',
        });
      } else {
        toast({ title: 'Error', description: getErrorMessage(error, 'Sign in failed.'), variant: 'destructive' });
      }
    } else {
      setPendingSignupPassword('');
      navigate(postAuthPath);
    }
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const normalizedEmail = email.trim().toLowerCase();
    const enterVerificationStep = (message?: { title: string; description: string }, cooldown = 60) => {
      setLoading(false);
      setPendingSignupPassword(password);
      setOtpEmail(normalizedEmail);
      setOtpVerificationType('email');
      setOtpDigits(['', '', '', '', '', '']);
      setStep('email_otp_verify');
      setResendCooldown(cooldown);
      if (message) toast(message);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    };
    const showRateLimitMessage = (error: unknown) => {
      const seconds = getEmailRateLimitSeconds(error);
      setLoading(false);
      setResendCooldown(seconds);
      toast({
        title: 'Please wait before requesting another code',
        description: `No new code was sent. Try again in about ${seconds} seconds.`,
        variant: 'destructive',
      });
    };
    const sendVerificationCode = async () => supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: authRedirectUrl,
      },
    });

    const { data: accountStatus, error: duplicateCheckError } = await supabase.rpc('email_account_status', {
      p_email: normalizedEmail,
    });

    if (duplicateCheckError) {
      setLoading(false);
      toast({
        title: 'Error',
        description: getErrorMessage(duplicateCheckError, 'Could not check this email. Try again.'),
        variant: 'destructive',
      });
      return;
    }

    if (accountStatus === 'confirmed') {
      const { error } = await sendVerificationCode();

      if (error) {
        if (isEmailRateLimitError(error)) {
          showRateLimitMessage(error);
          return;
        }

        setLoading(false);
        toast({
          title: 'Error',
          description: getErrorMessage(error, 'We could not send a verification code. Try signing in with email and code.'),
          variant: 'destructive',
        });
        return;
      }

      enterVerificationStep({
        title: 'Verification code sent',
        description: 'This email already has an account. Enter the code sent to your email to continue.',
      });
      return;
    }

    if (accountStatus === 'unconfirmed') {
      const { error: confirmAccountError } = await invokeSupabaseFunction('create-email-account', {
        body: { email: normalizedEmail, prepareExisting: true },
      });

      if (confirmAccountError) {
        setLoading(false);
        toast({
          title: 'Error',
          description: getErrorMessage(confirmAccountError, 'Could not prepare this account for verification.'),
          variant: 'destructive',
        });
        return;
      }

      const { error } = await sendVerificationCode();

      if (error) {
        if (isEmailRateLimitError(error)) {
          showRateLimitMessage(error);
          return;
        }

        setLoading(false);
        toast({
          title: 'Error',
          description: getErrorMessage(error, 'We could not send a verification code. Try signing in with email and code.'),
          variant: 'destructive',
        });
        return;
      }

      enterVerificationStep({
        title: 'Verification code sent',
        description: 'Enter the verification code sent to your email.',
      });
      return;
    }

    const { data: createAccountData, error: createAccountError } = await invokeSupabaseFunction('create-email-account', {
      body: { email: normalizedEmail },
    });

    if (createAccountError || (createAccountData as { error?: unknown } | null)?.error) {
      setLoading(false);
      const message = (createAccountData as { error?: unknown } | null)?.error;
      toast({
        title: 'Error',
        description: typeof message === 'string'
          ? message
          : getErrorMessage(createAccountError, 'Could not create account.'),
        variant: 'destructive',
      });
      return;
    }

    const { error } = await sendVerificationCode();

    if (error) {
      if (isEmailRateLimitError(error)) {
        showRateLimitMessage(error);
      } else {
        setLoading(false);
        toast({
          title: 'Error',
          description: getErrorMessage(error, 'We could not send a verification code. Try signing in with email and code.'),
          variant: 'destructive',
        });
      }
      return;
    }

    enterVerificationStep({
      title: 'Verification code sent',
      description: 'Enter the verification code sent to your email.',
    });
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/auth`,
    });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Reset link sent', description: 'Check your email.' });
      setStep('email_auth');
      setResetEmail('');
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (resetPassword !== resetConfirm) {
      toast({ title: 'Passwords do not match', variant: 'destructive' });
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: resetPassword });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Password updated!' });
      setStep('email_auth');
      setResetPassword('');
      setResetConfirm('');
    }
  };

  const handleSubscribe = () => {
    if (!user) {
      navigate(`/auth/create?next=${encodeURIComponent(postAuthPath)}${plansParam}&subscribe=true`);
      return;
    }

    setLoading(true);
    invokeSupabaseFunction<{ url?: string }>('create-checkout-session', {
      body: { returnPath: checkoutReturnPath },
    }).then(({ data, error }) => {
      setLoading(false);

      if (error || !data?.url) {
        if (STRIPE_PAID_LINK) {
          window.location.assign(STRIPE_PAID_LINK);
          return;
        }

        toast({
          title: 'Checkout unavailable',
          description: getErrorMessage(error, 'Please try again later.'),
          variant: 'destructive',
        });
        return;
      }

      window.location.assign(data.url);
    });
  };

  // ─── Layout helpers ────────────────────────────────────────────────────────

  const Divider = ({ label = 'or' }: { label?: string }) => (
    <div className="relative my-5">
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t border-gray-200" />
      </div>
      <div className="relative flex justify-center">
        <span className="bg-white px-3 text-xs text-gray-400 uppercase tracking-wide">{label}</span>
      </div>
    </div>
  );

  const TierComparison = () => (
    <div className="grid gap-3 sm:grid-cols-[1.18fr_0.82fr]">
      <div className="relative rounded-2xl border-2 border-[#1a5fb4] bg-[#1a5fb4]/5 p-4 shadow-sm">
        <div className="absolute right-3 top-3 rounded-full bg-[#1a5fb4] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
          Best value
        </div>
        <p className="text-xs font-semibold uppercase tracking-wide text-[#1a5fb4]">Paid tier</p>
        <h2 className="mt-1 text-xl font-semibold text-gray-950">Full Pass</h2>
        <h2 className="mt-1 text-2xl font-bold text-gray-950">$20<span className="ml-1 text-base font-normal text-gray-700">/month</span></h2>
        <button
          type="button"
          onClick={handleSubscribe}
          disabled={loading}
          className="mt-4 w-full rounded-xl bg-[#1a5fb4] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1550a0]"
        >
          {loading ? 'Opening checkout...' : 'Subscribe'}
        </button>
        <p className="mt-4 space-y-2 text-sm text-gray-700">Everything in Basic, plus:</p>
        <ul className="mt-4 space-y-2 text-sm text-gray-700">
          {[
            'No ads',
            'Free entry to the expanding network of Comediq open mics for you and 1 guest',
            'Show you support the best database of NYC open mic data and want to contribute to maintaining and growing comedy digital infrastructure',
          ].map((feature) => (
            <li key={feature} className="flex gap-2">
              <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#1a5fb4]" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Free tier</p>
        <h2 className="mt-1 text-xl font-semibold text-gray-950">Basic</h2>
        <h2 className="mt-1 text-2xl font-bold text-gray-950">$0<span className="ml-1 text-base font-normal text-gray-700">/month</span></h2>
        <p className="mt-4 space-y-2 text-sm text-gray-700">Basic Features:</p>

        <ul className="mt-4 space-y-2 text-sm text-gray-600">
          {[
            'Browse open mics',
            'Save your favorite mics',
            'Basic signup access',
            'Community mic updates',
          ].map((feature) => (
            <li key={feature} className="flex gap-2">
              <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );

  // ─── Step renderers ────────────────────────────────────────────────────────

  const renderMain = () => (
    <>
      <button
        type="button"
        onClick={() => navigate('/')}
        className="mb-6 flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
      </button>

      <h1
        ref={signInHeadingRef}
        tabIndex={-1}
        className="text-2xl font-semibold text-gray-900 mb-2 focus:outline-none"
      >
        Sign in to Comediq
      </h1>
      <p className="text-sm text-gray-500 mb-7">New here? Signing in with Google creates your account automatically.</p>

      {/* Google — primary CTA */}
      <button
        type="button"
        onClick={handleGoogleSignIn}
        className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl text-white text-sm font-semibold shadow-sm transition-colors"
        style={{ background: BRAND_BLUE }}
      >
        <GoogleIcon />
        Continue with Google
      </button>

      <Divider label="or get a code emailed to you" />

      <form onSubmit={handleSendEmailCode} className="space-y-3">
        <div className="flex rounded-xl border border-gray-200 overflow-hidden focus-within:ring-2 focus-within:ring-[#1a5fb4] focus-within:border-[#1a5fb4]">
          <span className="flex items-center pl-3.5 pr-2 text-gray-400">
            <Mail className="w-4 h-4" />
          </span>
          <input
            ref={signInEmailRef}
            type="email"
            placeholder="you@example.com"
            value={otpEmail}
            onChange={e => setOtpEmail(e.target.value)}
            className="flex-1 py-3 pr-3 text-sm bg-white outline-none placeholder-gray-400"
            required
            autoComplete="email"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !otpEmail || resendCooldown > 0}
          className="w-full py-3 rounded-xl border border-gray-300 bg-white text-gray-900 text-sm font-semibold transition-colors hover:bg-gray-50 disabled:opacity-50"
        >
          {loading ? 'Sending…' : resendCooldown > 0 ? `Try again in ${resendCooldown}s` : 'Email me a code'}
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-gray-500">
        Have a password?{' '}
        <button
          type="button"
          onClick={() => setStep('email_auth')}
          className="font-medium hover:underline"
          style={{ color: BRAND_BLUE }}
        >
          Sign in with email & password
        </button>
      </p>

      <p className="mt-4 text-center text-[11px] text-gray-400 leading-relaxed">
        By continuing you agree to our <a href="/privacy" className="underline hover:text-gray-600">Privacy Policy</a>.
      </p>
    </>
  );

  const renderChoosePlan = () => (
    <>
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">You're signed in 🎉</h1>
      <p className="text-sm text-gray-500 mb-6">Choose how you'd like to use Comediq.</p>
      <div className="mb-6">
        <TierComparison />
      </div>
      <button
        type="button"
        onClick={() => navigate(postAuthPath)}
        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-900 transition-colors hover:bg-gray-50"
      >
        Continue with Basic (free)
      </button>
    </>
  );

  const renderSignInOptions = () => (
    <>
      <button
        type="button"
        onClick={() => navigate(authLandingPath)}
        className="mb-6 flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back
      </button>

      <h1
        ref={signInHeadingRef}
        tabIndex={-1}
        className="text-2xl font-semibold text-gray-900 mb-7 focus:outline-none"
      >
        Sign in to Comediq
      </h1>

        {/* Google — primary CTA */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl border-2 border-gray-200 bg-white text-gray-800 text-sm font-semibold hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-sm"
        >
          <GoogleIcon />
          Continue with Google
        </button>

        <Divider label="or get a code emailed to you" />

        {/* Email OTP — secondary */}
        <form onSubmit={handleSendEmailCode} className="space-y-3">
          <div className="flex rounded-xl border border-gray-200 overflow-hidden focus-within:ring-2 focus-within:ring-[#1a5fb4] focus-within:border-[#1a5fb4]">
            <span className="flex items-center pl-3.5 pr-2 text-gray-400">
              <Mail className="w-4 h-4" />
            </span>
            <input
              ref={signInEmailRef}
              type="email"
              placeholder="you@example.com"
              value={otpEmail}
              onChange={e => setOtpEmail(e.target.value)}
              className="flex-1 py-3 pr-3 text-sm bg-white outline-none placeholder-gray-400"
              required
              autoComplete="email"
              autoFocus
            />
          </div>
          <button
            type="submit"
            disabled={loading || !otpEmail || resendCooldown > 0}
            className="w-full py-3 rounded-xl text-white text-sm font-medium transition-colors disabled:opacity-50"
            style={{ background: BRAND_BLUE }}
          >
            {loading ? 'Sending…' : resendCooldown > 0 ? `Try again in ${resendCooldown}s` : 'Send code'}
          </button>
        </form>

        <Divider label="or use a password" />

        <div className="w-full flex items-center justify-center">
          <button
            type="button"
            onClick={() => {
              navigate(signInOptionsPath);
              setStep('email_auth');
            }}
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-center text-sm font-semibold text-gray-900 transition-colors hover:bg-gray-50"
          >
            Sign in with password
          </button>
        </div>
    </>
  );

  const renderEmailOtpVerify = () => {
    const isCreatingAccount = Boolean(pendingSignupPassword);

    return (
    <>
      <button
        type="button"
        onClick={() => {
          if (isCreatingAccount) {
            setPendingSignupPassword('');
            navigate(createAccountPath);
            setStep('email_signup');
          } else {
            setStep('sign_in_options');
          }
        }}
        className="mb-6 flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back
      </button>

      <h1 className="text-2xl font-semibold text-gray-900 mb-1">
        {isCreatingAccount ? 'Create your account' : 'Check your email'}
      </h1>
      <p className="text-sm text-gray-500 mb-8">
        {isCreatingAccount ? 'Enter the verification code sent to ' : 'We sent a 6-digit code to '}
        <span className="font-medium text-gray-700">{otpEmail}</span>
      </p>

      <div className="flex gap-2.5 mb-6 justify-center">
        {otpDigits.map((digit, i) => (
          <input
            key={i}
            ref={(el) => { otpRefs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={digit}
            onChange={e => handleOtpChange(i, e.target.value)}
            onKeyDown={e => handleOtpKeyDown(i, e)}
            onFocus={e => e.target.select()}
            className="w-11 h-14 text-center text-xl font-semibold rounded-xl border border-gray-200 outline-none focus:border-[#1a5fb4] focus:ring-2 focus:ring-[#1a5fb4]/20 transition-colors"
            aria-label={`Digit ${i + 1}`}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={() => handleVerifyOtp()}
        disabled={loading || otpDigits.some(d => d === '')}
        className="w-full py-3 rounded-xl text-white text-sm font-medium transition-colors disabled:opacity-50 mb-4"
        style={{ background: BRAND_BLUE }}
      >
        {loading ? 'Verifying…' : 'Verify code'}
      </button>

      <p className="text-center text-sm text-gray-500">
        Didn't get it?{' '}
        <button
          type="button"
          onClick={handleResendCode}
          disabled={loading || resendCooldown > 0}
          className="font-medium hover:underline disabled:opacity-40"
          style={{ color: BRAND_BLUE }}
        >
          {loading ? 'Sending...' : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
        </button>
      </p>
    </>
    );
  };

  const renderEmailAuth = () => (
    <>
      <button
        type="button"
        onClick={() => {
          navigate(signInOptionsPath);
          setStep('sign_in_options');
        }}
        className="mb-6 flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back
      </button>

      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Sign in with email</h1>
      <p className="text-sm text-gray-500 mb-7">Welcome back.</p>

      <form onSubmit={handleEmailAuth} className="space-y-3">
        <Input type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
        <div className="relative">
          <Input type={showPassword ? 'text' : 'password'} placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} className="pr-10" autoComplete="current-password" />
          <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" tabIndex={-1}>
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <div className="text-right">
          <button type="button" onClick={() => setStep('forgot_password')} className="text-xs text-gray-500 hover:text-gray-700">Forgot password?</button>
        </div>
        <button type="submit" disabled={loading} className="w-full py-3 rounded-xl text-white text-sm font-medium transition-colors disabled:opacity-50" style={{ background: BRAND_BLUE }}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </>
  );

  const renderEmailSignup = () => (
    <>
      <button
        type="button"
        onClick={() => navigate(authLandingPath)}
        className="mb-6 flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back
      </button>

      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Create your account</h1>
      <p className="text-sm text-gray-500 mb-7">Welcome to Comediq.</p>

      {subscribeIntent && (
        <div className="mb-5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          <p className="font-medium">Create an account or sign in first.</p>
          <p className="mt-1 text-blue-800/80">
            You need a Comediq account before subscribing to Full Pass.
          </p>
          <button
            type="button"
            onClick={() => {
              navigate(signInOptionsPath);
              setStep('sign_in_options');
            }}
            className="mt-3 text-sm font-semibold text-[#1a5fb4] hover:underline"
          >
            Sign in instead
          </button>
        </div>
      )}

      <form onSubmit={handleEmailSignup} className="space-y-3">
        <Input type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
        <div className="relative">
          <Input type={showPassword ? 'text' : 'password'} placeholder="Password (6+ characters)" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} className="pr-10" autoComplete="new-password" />
          <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" tabIndex={-1}>
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <button type="submit" disabled={loading} className="w-full py-3 rounded-xl text-white text-sm font-medium transition-colors disabled:opacity-50" style={{ background: BRAND_BLUE }}>
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>
      <p className="mt-4 text-xs text-gray-400 text-center leading-relaxed">
        By signing up you agree to our <a href="/privacy" className="underline hover:text-gray-600">Privacy Policy</a>.
      </p>
    </>
  );

  const renderForgotPassword = () => (
    <>
      <button
        type="button"
        onClick={() => setStep('email_auth')}
        className="mb-6 flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back
      </button>

      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Reset password</h1>
      <p className="text-sm text-gray-500 mb-7">We'll email you a link to reset it.</p>
      <form onSubmit={handleForgotPassword} className="space-y-3">
        <Input type="email" placeholder="Email address" value={resetEmail} onChange={e => setResetEmail(e.target.value)} required />
        <button type="submit" className="w-full py-3 rounded-xl text-white text-sm font-medium" style={{ background: BRAND_BLUE }}>Send reset link</button>
      </form>
    </>
  );

  const renderResetPassword = () => (
    <>
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Set new password</h1>
      <p className="text-sm text-gray-500 mb-7">Choose a strong password for your account.</p>
      <form onSubmit={handlePasswordReset} className="space-y-3">
        <div className="relative">
          <Input type={showPassword ? 'text' : 'password'} placeholder="New password" value={resetPassword} onChange={e => setResetPassword(e.target.value)} required minLength={6} className="pr-10" />
          <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" tabIndex={-1}>
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <Input type={showPassword ? 'text' : 'password'} placeholder="Confirm password" value={resetConfirm} onChange={e => setResetConfirm(e.target.value)} required minLength={6} />
        <button type="submit" className="w-full py-3 rounded-xl text-white text-sm font-medium" style={{ background: BRAND_BLUE }}>Update password</button>
      </form>
    </>
  );

  const stepContent = {
    main: renderMain,
    sign_in_options: renderMain,
    choose_plan: renderChoosePlan,
    email_otp_verify: renderEmailOtpVerify,
    email_auth: renderEmailAuth,
    email_signup: renderEmailSignup,
    forgot_password: renderForgotPassword,
    reset_password: renderResetPassword,
  }[step]();

  const seoTitle = {
    main: 'Sign In | Comediq',
    sign_in_options: 'Sign In | Comediq',
    choose_plan: 'Choose Your Plan | Comediq',
    email_otp_verify: 'Check Your Email | Comediq',
    email_auth: 'Sign In | Comediq',
    email_signup: 'Join Comediq',
    forgot_password: 'Reset Password | Comediq',
    reset_password: 'Set New Password | Comediq',
  }[step];

  return (
    <>
      <SEO title={seoTitle} description="Sign in or create a free Comediq account to save open mics, track your comedy journey, and connect with the NYC comedy community." url="https://comediq.us/auth" noindex={true} />
      <div className="min-h-screen flex">
        <div className="relative hidden overflow-hidden lg:flex lg:w-[36%] xl:w-[34%] flex-col justify-between p-12 text-white">
          <video
            className="absolute inset-0 h-full w-full object-cover"
            src="/videos/sign-in-loop.mp4"
            autoPlay
            loop
            muted
            playsInline
          >
            "The best tool for tracking NYC open mics. I use it every week before I hit the road."
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/20 to-black/60" />
          <div className="relative z-10 flex items-center gap-3">
            <span className="font-semibold text-lg tracking-tight">Comediq</span>
          </div>
          <div className="relative z-10" />
          <div className="relative z-10 grid grid-cols-2 gap-4 pt-4 border-t border-white/20">
            <div><p className="text-2xl font-bold">1,250+</p><p className="text-white/60 text-sm">comedians per week</p></div>
            <div><p className="text-2xl font-bold">500+</p><p className="text-white/60 text-sm">open mics tracked</p></div>
          </div>
        </div>
        <div className="flex-1 flex min-h-screen flex-col items-center justify-center overflow-y-auto bg-white px-6 py-12">
          <div className="lg:hidden mb-8 flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: BRAND_BLUE }}>
              <Mic className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-semibold text-lg">Comediq</span>
          </div>
          <div className={step === 'choose_plan' ? 'w-full max-w-2xl' : 'w-full max-w-sm'}>{stepContent}</div>
        </div>
      </div>
    </>
  );
};

export default Auth;
