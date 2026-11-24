import React, { useCallback, useState, useEffect, useRef } from 'react';
import { V3_DISPLAY_STYLE } from '@/theme/v3';
import './auth.css';
import { COMEDIQ_Q_LOGO } from '@/lib/brand';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import SEO from '@/components/SEO';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Eye, EyeOff, Mic, ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import { getValidStripePaymentLink } from '@/utils/stripeLinks';
import { invokeSupabaseFunction } from '@/utils/supabaseFunctions';

/** The primary blue, same value as AUTH_PRIMARY below. */
const BRAND_BLUE = '#1E4894';
const STRIPE_PAID_LINK = getValidStripePaymentLink(
  import.meta.env.VITE_STRIPE_PAID_LINK,
);
/**
 * Comediq brand palette for this page. Blue and white only.
 *
 * The page sits on the deep navy rather than the old translucent white, so
 * every field, button and link is restated here against that ground instead
 * of inheriting the light-theme defaults.
 */
const AUTH_INK = "#08142B";        // page background
const AUTH_FIELD = "#0F1E3D";      // input fill
const AUTH_FIELD_BORDER = "#2B56A6";
const AUTH_FIELD_FOCUS = "#8FC2F5";
const AUTH_PRIMARY = "#1E4894";    // primary button
const AUTH_LINK = "#8FC2F5";

/**
 * Headings use Archivo at weight 800 and 112% width. That is already a token
 * (V3_DISPLAY_STYLE, used by the map and listing screens) so it is reused
 * rather than redefined; only the tighter line height is added here, because
 * the shared token is also used for inline venue names where 0.95 would be
 * too tight.
 */
const AUTH_HEADING = { ...V3_DISPLAY_STYLE, lineHeight: 0.95 } as const;

const AUTH_INPUT_CLASS =
  "h-12 rounded-xl border-[1.5px] px-3 py-3 text-sm border-[#2B56A6] bg-[#0F1E3D] text-white placeholder:text-white/45 focus-visible:border-[#8FC2F5] focus-visible:ring-2 focus-visible:ring-[#8FC2F5]/40 focus-visible:ring-offset-0 dark:border-[#2B56A6] dark:bg-[#0F1E3D] dark:text-white dark:placeholder:text-white/45";
const AUTH_PASSWORD_INPUT_CLASS = `${AUTH_INPUT_CLASS} pr-10`;

/** Primary action: Comediq royal, white text, half opacity when disabled. */
const AUTH_PRIMARY_BUTTON_CLASS =
  "w-full rounded-xl py-3 text-sm font-semibold text-white transition-colors bg-[#1E4894] hover:bg-[#173A7A] disabled:opacity-50";

/** Secondary action on the navy: outlined, not a white slab. */
const AUTH_SECONDARY_BUTTON_CLASS =
  "w-full rounded-xl border-[1.5px] border-[#2B56A6] bg-[#0F1E3D] px-4 py-3 text-sm font-semibold text-white transition-colors hover:border-[#8FC2F5] disabled:opacity-50";

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

const getEmailRateLimitToast = (error: unknown) => {
  const message = getErrorMessage(error, '').toLowerCase();
  const hasExplicitCooldown = /after\s+\d+\s+seconds?/i.test(message);
  const isHourlyEmailLimit = message.includes('email rate limit') && !hasExplicitCooldown;

  if (isHourlyEmailLimit) {
    return {
      title: 'Hourly email limit reached',
      description: 'Supabase has paused sending verification emails for this project. Please wait about an hour before requesting another code.',
      cooldown: 60 * 60,
    };
  }

  const seconds = getEmailRateLimitSeconds(error);
  return {
    title: 'Please wait before requesting another code',
    description: `No new code was sent. Try again in about ${seconds} seconds. If no email arrives after that, the hourly email limit may be reached and you may need to wait about an hour.`,
    cooldown: seconds,
  };
};

const isDuplicateEmailError = (error: unknown) => {
  const message = getErrorMessage(error, '').toLowerCase();
  return message.includes('already registered')
    || message.includes('already exists')
    || message.includes('user already');
};

const isMissingEmailStatusRpcError = (error: unknown) => {
  const message = getErrorMessage(error, '').toLowerCase();
  return message.includes('email_account_status')
    && (message.includes('schema cache') || message.includes('could not find the function'));
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


const FIELD_WRAP_CLASS =
  'relative overflow-hidden rounded-xl border-[1.5px] border-[#2B56A6] bg-[#0F1E3D] focus-within:border-[#8FC2F5] focus-within:ring-2 focus-within:ring-[#8FC2F5]/40';
const FIELD_ICON_CLASS =
  'pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-white/50';
const BARE_INPUT_CLASS =
  'w-full bg-transparent py-3 pl-10 pr-3 text-sm text-white outline-none placeholder-white/45';

// ─── Types ────────────────────────────────────────────────────────────────────

type AuthStep =
  | 'main'             // Google + Apple + email OTP entry
  | 'sign_in_options'
  | 'email_otp_verify' // 6-digit email OTP
  | 'email_auth'       // email + password sign in
  | 'email_signup'     // create account with email
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

  const otpRefs = useRef<(HTMLInputElement | null)[]>([null, null, null, null, null, null]);
  const signInHeadingRef = useRef<HTMLHeadingElement | null>(null);
  const signInEmailRef = useRef<HTMLInputElement | null>(null);

  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, user, refreshProfile } = useAuth();
  const { toast } = useToast();
  const searchParams = new URLSearchParams(location.search);
  const nextPathParam = searchParams.get('next');
  const shouldShowPlans = searchParams.get('plans') === 'true';
  const subscribeIntent = searchParams.get('subscribe') === 'true';
  // The mic list is what people came for, so that is where auth lands them.
  const postAuthPath = nextPathParam?.startsWith('/') ? nextPathParam : '/perform';
  const authRedirectUrl = `${window.location.origin}/auth/sign-in?next=${encodeURIComponent(postAuthPath)}`;
  const plansParam = shouldShowPlans ? '&plans=true' : '';
  const subscribeParam = subscribeIntent ? '&subscribe=true' : '';
  const signInOptionsPath = `/auth/sign-in?next=${encodeURIComponent(postAuthPath)}${plansParam}${subscribeParam}`;
  const createAccountPath = `/auth/create?next=${encodeURIComponent(postAuthPath)}${plansParam}${subscribeParam}`;
  const basicCreateAccountPath = `/auth/create?next=${encodeURIComponent(postAuthPath)}${plansParam}`;
  const authLandingPath = `/auth?next=${encodeURIComponent(postAuthPath)}${plansParam}${subscribeParam}`;
  const checkoutReturnPath = postAuthPath === '/book-me-mic' ? '/book-me-mic' : '/';

  // ── Redirect if already authed ────────────────────────────────────────────

  useEffect(() => {
    if (user && step !== 'reset_password' && !shouldShowPlans) navigate(postAuthPath);
  }, [user, navigate, postAuthPath, shouldShowPlans, step]);

  // ── Detect password-reset link ────────────────────────────────────────────

  useEffect(() => {
    const params = new URLSearchParams(location.hash.substring(1));
    if (params.get('type') === 'recovery') setStep('reset_password');
  }, [location.hash]);

  useEffect(() => {
    if (step === 'reset_password') return;
    if (location.pathname === '/auth/create') {
      if (step === 'main' || step === 'sign_in_options') setStep('email_signup');
    } else if (location.pathname === '/auth/sign-in') {
      if (step === 'main' || step === 'email_signup') setStep('sign_in_options');
    } else if (location.pathname === '/auth' && (step === 'sign_in_options' || step === 'email_signup')) {
      setStep('main');
    }
  }, [location.pathname, step]);

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
      // The signup answers were collected before this account existed, so they
      // get written here. A failure never blocks the way in: they are signed in
      // already and every field is editable on the profile page.
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
        const rateLimitToast = getEmailRateLimitToast(error);
        setResendCooldown(rateLimitToast.cooldown);
        toast({
          title: rateLimitToast.title,
          description: rateLimitToast.description,
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
        const rateLimitToast = getEmailRateLimitToast(error);
        setResendCooldown(rateLimitToast.cooldown);
        toast({
          title: rateLimitToast.title,
          description: rateLimitToast.description,
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
      const rateLimitToast = getEmailRateLimitToast(error);
      setLoading(false);
      setResendCooldown(rateLimitToast.cooldown);
      toast({
        title: rateLimitToast.title,
        description: rateLimitToast.description,
        variant: 'destructive',
      });
    };
    const sendVerificationCode = async (shouldCreateUser = false) => supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        shouldCreateUser,
        emailRedirectTo: authRedirectUrl,
      },
    });

    const { data: accountStatusResult, error: duplicateCheckError } = await supabase.rpc('email_account_status', {
      p_email: normalizedEmail,
    });

    if (duplicateCheckError && !isMissingEmailStatusRpcError(duplicateCheckError)) {
      setLoading(false);
      toast({
        title: 'Error',
        description: getErrorMessage(duplicateCheckError, 'Could not check this email. Try again.'),
        variant: 'destructive',
      });
      return;
    }

    const accountStatus = duplicateCheckError ? null : accountStatusResult;

    if (accountStatus === 'confirmed') {
      routeToExistingAccountSignIn(
        normalizedEmail,
        'This email already has an account. Sign in with your password instead.',
      );
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

    const { error } = await sendVerificationCode(true);

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
      body: {
        returnPath: checkoutReturnPath,
        returnUrl: `${window.location.origin}${checkoutReturnPath}`,
      },
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
        <span className="w-full border-t border-white/15" />
      </div>
      <div className="relative flex justify-center">
        <span className="px-3 text-xs tracking-wide text-white/55">{label}</span>
      </div>
    </div>
  );

  const TierComparison = () => (
    <div className="grid gap-3 sm:grid-cols-[1.18fr_0.82fr]">
      <div className="relative rounded-2xl border-[1.5px] border-[#2B56A6] bg-[#0F1E3D] p-4 shadow-[0_12px_38px_rgba(2,10,30,0.12)] backdrop-blur-xl">
        <div className="absolute right-3 top-3 rounded-full bg-[#1E4894] px-2 py-0.5 text-[10px] font-semibold tracking-wide text-[#fff]">
          Best value
        </div>
        <p className="text-xs font-semibold tracking-wide text-blue-400">Paid tier</p>
        <h2 className="mt-1 text-xl font-semibold text-white">Full Pass</h2>
        <h2 className="mt-1 text-2xl font-bold text-white">$20<span className="ml-1 text-base font-normal text-white/70">/month</span></h2>
        <button
          type="button"
          onClick={handleSubscribe}
          disabled={loading}
          className={`mt-4 ${AUTH_PRIMARY_BUTTON_CLASS}`}
        >
          {loading ? 'Opening checkout...' : 'Subscribe'}
        </button>
        <p className="mt-4 space-y-2 text-sm text-white/70">Everything in Basic, plus:</p>
        <ul className="mt-4 space-y-2 text-sm text-white/70">
          {[
            'No ads',
            '1st access to the newest features',
            'Free entry to all Comediq open mics\u00A0\n',
            'Show you support the best database of NYC open mic data and want to contribute to maintaining and growing comedy digital infrastructure',
          ].map((feature) => (
            <li key={feature} className="flex gap-2">
              <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" />
              <span className="whitespace-pre-wrap">{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl border-[1.5px] border-[#2B56A6] bg-[#0F1E3D] p-4 shadow-[0_12px_38px_rgba(2,10,30,0.10)] backdrop-blur-xl">
        <p className="text-xs font-semibold tracking-wide text-white/55">Free tier</p>
        <h2 className="mt-1 text-xl font-semibold text-white">Basic</h2>
        <h2 className="mt-1 text-2xl font-bold text-white">$0<span className="ml-1 text-base font-normal text-white/70">/month and pay per mic</span></h2>
        <button
          type="button"
          onClick={() => navigate(basicCreateAccountPath)}
          className={`mt-4 ${AUTH_SECONDARY_BUTTON_CLASS}`}
        >
          Create an Account
        </button>
        <p className="mt-4 space-y-2 text-sm text-white/70 dark:text-white/72">Basic Features:</p>

        <ul className="mt-4 space-y-2 text-sm text-white/70 dark:text-white/64">
          {[
            'Browse open mics',
            'Save your favorite mics',
            'Basic signup access',
            'Community mic updates',
          ].map((feature) => (
            <li key={feature} className="flex gap-2">
              <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-white/50" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );

  /**
   * Google, an emailed code, or a password. The code path runs with
   * shouldCreateUser, so one email box both makes an account and signs an
   * existing one in. Nothing here needs a plan chosen first.
   */
  const renderAuthMethods = () => (
    <>
      <button
        type="button"
        onClick={handleGoogleSignIn}
        className={`flex items-center justify-center gap-3 ${AUTH_SECONDARY_BUTTON_CLASS}`}
      >
        <GoogleIcon />
        Continue with Google
      </button>

      <Divider label="or get a code emailed to you" />

      <form onSubmit={handleSendEmailCode} className="space-y-3">
        <div className="flex overflow-hidden rounded-xl border-[1.5px] border-[#2B56A6] bg-[#0F1E3D] focus-within:border-[#8FC2F5] focus-within:ring-2 focus-within:ring-[#8FC2F5]/40">
          <span className="flex items-center pl-3.5 pr-2 text-white/50">
            <Mail className="w-4 h-4 mr-1" />
          </span>
          <input
            ref={signInEmailRef}
            type="email"
            placeholder="you@example.com"
            value={otpEmail}
            onChange={e => setOtpEmail(e.target.value)}
            className="flex-1 bg-transparent py-3 pl-2 pr-3 text-sm text-white outline-none placeholder-white/45"
            required
            autoComplete="email"
            autoFocus
          />
        </div>
        <button
          type="submit"
          disabled={loading || !otpEmail || resendCooldown > 0}
          className={AUTH_PRIMARY_BUTTON_CLASS}
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
          className={`text-center ${AUTH_SECONDARY_BUTTON_CLASS}`}
        >
          Sign in with password
        </button>
      </div>
    </>
  );

  // ─── Step renderers ────────────────────────────────────────────────────────

  const renderMain = () => (
    <>
      <button
        type="button"
        onClick={() => navigate('/')}
        className="mb-6 flex items-center gap-1.5 text-sm text-white/70 hover:text-white"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
      </button>

      {shouldShowPlans ? (
        <>
          <h1 className="mb-4 text-[30px] text-white" style={AUTH_HEADING}>Choose your plan</h1>
          <div className="mb-8">
            <TierComparison />
          </div>
          <div className="mx-auto w-full max-w-sm">
            <button
              type="button"
              onClick={() => navigate(signInOptionsPath)}
              className={AUTH_SECONDARY_BUTTON_CLASS}
            >
              Skip for now, just sign in
            </button>
          </div>
        </>
      ) : (
        <>
          <h1 className="mb-1 text-[30px] text-white" style={AUTH_HEADING}>Make your free account</h1>
          <p className="mb-6 text-sm text-white/70">
            No card, no password to invent.
          </p>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            className={`flex items-center justify-center gap-3 ${AUTH_SECONDARY_BUTTON_CLASS}`}
          >
            <GoogleIcon />
            Continue with Google
          </button>

          <Divider label="or sign up with your email" />

          <form onSubmit={handleSendEmailCode} className="space-y-3">
            <div className={FIELD_WRAP_CLASS}>
              <Mail className={`${FIELD_ICON_CLASS} h-4 w-4`} />
              <input
                ref={signInEmailRef}
                type="email"
                placeholder="you@example.com"
                value={otpEmail}
                onChange={e => setOtpEmail(e.target.value)}
                className={BARE_INPUT_CLASS}
                autoComplete="email"
                autoFocus
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading || !otpEmail || resendCooldown > 0}
              className={AUTH_PRIMARY_BUTTON_CLASS}
              style={{ background: BRAND_BLUE }}
            >
              {loading ? 'Sending…' : resendCooldown > 0 ? `Try again in ${resendCooldown}s` : 'Send me a code'}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-white/70">
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => navigate(signInOptionsPath)}
              className="font-semibold underline underline-offset-2 hover:text-white"
            >
              Sign in
            </button>
          </p>

          <p className="mt-2 text-center text-xs text-white/50 dark:text-white/35">
            <button
              type="button"
              onClick={() => navigate(`/auth?next=${encodeURIComponent(postAuthPath)}&plans=true`)}
              className="underline underline-offset-2"
            >
              See Full Pass
            </button>
          </p>
        </>
      )}
    </>
  );

  const renderSignInOptions = () => (
    <>
      <button
        type="button"
        onClick={() => navigate(authLandingPath)}
        className="mb-6 flex items-center gap-1.5 text-sm text-white/70 hover:text-white"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back
      </button>

      <h1
        ref={signInHeadingRef}
        tabIndex={-1}
        className="mb-7 text-[30px] text-white focus:outline-none"
        style={AUTH_HEADING}
      >
        Sign in to Comediq
      </h1>

        {renderAuthMethods()}
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
        className="mb-6 flex items-center gap-1.5 text-sm text-white/70 hover:text-white"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back
      </button>

      <h1 className="mb-1 text-[30px] text-white" style={AUTH_HEADING}>
        {isCreatingAccount ? 'Create your account' : 'Check your email'}
      </h1>
      <p className="text-sm text-white/70 mb-8">
        {isCreatingAccount ? 'Enter the verification code sent to ' : 'We sent a 6-digit code to '}
        <span className="font-medium text-white/70">{otpEmail}</span>
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
            className="h-14 w-11 rounded-xl border-[1.5px] border-[#2B56A6] bg-[#0F1E3D] text-center text-xl font-semibold text-white outline-none transition-colors focus:border-[#8FC2F5] focus:ring-2 focus:ring-[#8FC2F5]/40"
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

      <p className="text-center text-sm text-white/70 dark:text-white/70">
        Didn't get it?{' '}
        <button
          type="button"
          onClick={handleResendCode}
          disabled={loading || resendCooldown > 0}
          className="font-medium hover:underline disabled:opacity-40"
          style={{ color: AUTH_LINK }}
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
        className="mb-6 flex items-center gap-1.5 text-sm text-white/70 hover:text-white"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back
      </button>

      <h1 className="mb-1 text-[30px] text-white" style={AUTH_HEADING}>Sign in with email</h1>
      <p className="mb-7 text-[30px] text-white" style={AUTH_HEADING}>Welcome back</p>

      <form onSubmit={handleEmailAuth} className="space-y-3">
        <Input type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" className={AUTH_INPUT_CLASS} />
        <div className="relative">
          <Input type={showPassword ? 'text' : 'password'} placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} className={AUTH_PASSWORD_INPUT_CLASS} autoComplete="current-password" />
          <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white/70" tabIndex={-1}>
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <div className="text-right">
          <button type="button" onClick={() => setStep('forgot_password')} className="text-xs text-white/70 hover:text-white">Forgot password?</button>
        </div>
        <button type="submit" disabled={loading} className={AUTH_PRIMARY_BUTTON_CLASS} style={{ background: BRAND_BLUE }}>
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
        className="mb-6 flex items-center gap-1.5 text-sm text-white/70 hover:text-white"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back
      </button>

      <h1 className="mb-1 text-[30px] text-white" style={AUTH_HEADING}>Create your account</h1>
      <p className="text-sm text-white/70 mb-7">Welcome to Comediq.</p>

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
            className="mt-3 text-sm font-semibold text-[#8FC2F5] hover:underline"
          >
            Sign in instead
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={handleGoogleSignIn}
        className={`flex items-center justify-center gap-3 ${AUTH_SECONDARY_BUTTON_CLASS}`}
      >
        <GoogleIcon />
        Create account with Google
      </button>

      <Divider label="or create with email" />

      <form onSubmit={handleEmailSignup} className="space-y-3">
        <Input type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" className={AUTH_INPUT_CLASS} />
        <div className="relative">
          <Input type={showPassword ? 'text' : 'password'} placeholder="Password (6+ characters)" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} className={AUTH_PASSWORD_INPUT_CLASS} autoComplete="new-password" />
          <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white/70" tabIndex={-1}>
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <button type="submit" disabled={loading} className={AUTH_PRIMARY_BUTTON_CLASS} style={{ background: BRAND_BLUE }}>
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>
      <p className="mt-4 text-xs text-white/50 text-center leading-relaxed">
        By signing up you agree to our <a href="/terms" className="underline hover:text-white/70">Terms of Service</a> and <a href="/privacy" className="underline hover:text-white/70">Privacy Policy</a>.
      </p>
    </>
  );

  const renderForgotPassword = () => (
    <>
      <button
        type="button"
        onClick={() => setStep('email_auth')}
        className="mb-6 flex items-center gap-1.5 text-sm text-white/70 hover:text-white"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back
      </button>

      <h1 className="mb-1 text-[30px] text-white" style={AUTH_HEADING}>Reset password</h1>
      <p className="text-sm text-white/70 mb-7">We'll email you a link to reset it.</p>
      <form onSubmit={handleForgotPassword} className="space-y-3">
        <Input type="email" placeholder="Email address" value={resetEmail} onChange={e => setResetEmail(e.target.value)} required className={AUTH_INPUT_CLASS} />
        <button type="submit" className={AUTH_PRIMARY_BUTTON_CLASS} style={{ background: BRAND_BLUE }}>Send reset link</button>
      </form>
    </>
  );

  const renderResetPassword = () => (
    <>
      <h1 className="mb-1 text-[30px] text-white" style={AUTH_HEADING}>Set new password</h1>
      <p className="text-sm text-white/70 mb-7">Choose a strong password for your account.</p>
      <form onSubmit={handlePasswordReset} className="space-y-3">
        <div className="relative">
          <Input type={showPassword ? 'text' : 'password'} placeholder="New password" value={resetPassword} onChange={e => setResetPassword(e.target.value)} required minLength={6} className={AUTH_PASSWORD_INPUT_CLASS} />
          <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white/70" tabIndex={-1}>
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <Input type={showPassword ? 'text' : 'password'} placeholder="Confirm password" value={resetConfirm} onChange={e => setResetConfirm(e.target.value)} required minLength={6} className={AUTH_INPUT_CLASS} />
        <button type="submit" className={AUTH_PRIMARY_BUTTON_CLASS} style={{ background: BRAND_BLUE }}>Update password</button>
      </form>
    </>
  );

  const stepContent = {
    main: renderMain,
    sign_in_options: renderSignInOptions,
    email_otp_verify: renderEmailOtpVerify,
    email_auth: renderEmailAuth,
    email_signup: renderEmailSignup,
    forgot_password: renderForgotPassword,
    reset_password: renderResetPassword,
  }[step]();

  const seoTitle = {
    main: 'Sign In | Comediq',
    sign_in_options: 'Sign In | Comediq',
    email_otp_verify: 'Check Your Email | Comediq',
    email_auth: 'Sign In | Comediq',
    email_signup: 'Join Comediq',
    forgot_password: 'Reset Password | Comediq',
    reset_password: 'Set New Password | Comediq',
  }[step];
  return (
    <>
      <SEO title={seoTitle} description="Sign in or create a free Comediq account to save open mics, track your comedy journey, and connect with the NYC comedy community." url="https://comediq.com/auth" noindex={true} />
      <div className="cq-auth min-h-screen flex font-dmsans" style={{ background: AUTH_INK }}>
        <div className="relative hidden overflow-hidden lg:flex lg:w-[36%] xl:w-[34%] flex-col justify-between p-12 text-white">
          {/* The map of the mics, rather than the old looping video. The video
              file is kept in public/videos and simply no longer used. */}
          <img
            className="absolute inset-0 h-full w-full"
            style={{ objectFit: "cover", objectPosition: "center top" }}
            src="/brand/signin-map.jpg"
            alt=""
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, rgba(8,20,43,0.55), rgba(8,20,43,0.25) 40%, rgba(8,20,43,0.85))",
            }}
          />
          <div className="relative z-10 flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white">
              <img src={COMEDIQ_Q_LOGO} alt="" className="h-7 w-7 object-contain" />
            </span>
            <span className="text-[28px] text-white" style={AUTH_HEADING}>
              Comediq
            </span>
          </div>
          <div className="relative z-10" />
          <div className="relative z-10 grid grid-cols-2 gap-4 pt-4 border-t border-white/25">
            <div>
              <p className="text-[32px] text-white" style={AUTH_HEADING}>2,000+</p>
              <p className="text-sm text-white/80">comedians per week</p>
            </div>
            <div>
              <p className="text-[32px] text-white" style={AUTH_HEADING}>300+</p>
              <p className="text-sm text-white/80">active open mics tracked</p>
            </div>
          </div>
        </div>
        <div className="flex-1 flex min-h-screen flex-col items-center justify-center overflow-y-auto px-6 py-12">
          {/* The left panel is hidden below lg, so the phone gets the wordmark
              as a short header instead. */}
          <div className="lg:hidden mb-8 flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white">
              <img src={COMEDIQ_Q_LOGO} alt="" className="h-6 w-6 object-contain" />
            </span>
            <span className="text-[24px] text-white" style={AUTH_HEADING}>Comediq</span>
          </div>
          <div
            className={`${step === 'main' ? (shouldShowPlans ? 'w-full max-w-2xl' : 'w-full max-w-lg') : 'w-full max-w-sm'} [&_h1]:text-white [&_h2]:text-white [&_p]:text-white/70 [&_label]:text-white/80 [&_a]:text-[#8FC2F5]`}
          >
            {stepContent}
          </div>
        </div>
      </div>
    </>
  );
};

export default Auth;
