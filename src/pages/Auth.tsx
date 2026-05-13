import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import SEO from '@/components/SEO';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Eye, EyeOff, Mic, ArrowLeft } from 'lucide-react';

const BRAND_BLUE = '#1a5fb4';
// Public client ID (not a secret — override with VITE_GOOGLE_CLIENT_ID env var if needed)
const GOOGLE_CLIENT_ID =
  (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined) ||
  '428222257092-9fu57bee9jmd3galvs2n007f4lgv8b1m.apps.googleusercontent.com';

// ─── Icons ────────────────────────────────────────────────────────────────────

const GoogleIcon = () => (
  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const AppleIcon = () => (
  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
  </svg>
);

// ─── Types ────────────────────────────────────────────────────────────────────

type AuthStep =
  | 'main'           // Google + Apple + phone number entry
  | 'phone_verify'   // 6-digit SMS OTP
  | 'email_auth'     // email + password sign in
  | 'email_signup'   // create account with email
  | 'forgot_password'
  | 'reset_password';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

function toE164(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  return digits.startsWith('1') ? `+${digits}` : `+1${digits}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

const Auth = () => {
  const [step, setStep] = useState<AuthStep>('main');
  const [phoneDisplay, setPhoneDisplay] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [resetConfirm, setResetConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const googleContainerRef = useRef<HTMLDivElement>(null);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([null, null, null, null, null, null]);

  const navigate = useNavigate();
  const location = useLocation();
  const { signUp, signIn, user } = useAuth();
  const { toast } = useToast();

  // ── Init GIS renderButton ─────────────────────────────────────────────────
  // Note: nonce is intentionally omitted. GIS's renderButton popup flow does not
  // embed a nonce in the returned id_token, so passing one to signInWithIdToken
  // causes a Supabase mismatch error. Security is maintained via HTTPS +
  // Google-signed JWT (aud claim) verification by Supabase.

  useEffect(() => {
    const initGIS = () => {
      const google = (window as any).google;
      if (!google?.accounts?.id || !googleContainerRef.current) return false;

      google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async ({ credential }: { credential: string }) => {
          const { error } = await supabase.auth.signInWithIdToken({
            provider: 'google',
            token: credential,
          });
          if (error) toast({ title: 'Google sign-in failed', description: error.message, variant: 'destructive' });
          // navigation handled by user state useEffect below
        },
      });
      google.accounts.id.renderButton(googleContainerRef.current, {
        type: 'standard', theme: 'outline', size: 'large',
      });
      return true;
    };

    if (!initGIS()) {
      const interval = setInterval(() => { if (initGIS()) clearInterval(interval); }, 200);
      return () => clearInterval(interval);
    }
  }, []);

  // ── Redirect if already authed ────────────────────────────────────────────

  useEffect(() => {
    if (user && step !== 'reset_password') navigate('/perform');
  }, [user, navigate, step]);

  // ── Detect password-reset link ────────────────────────────────────────────

  useEffect(() => {
    const params = new URLSearchParams(location.hash.substring(1));
    if (params.get('type') === 'recovery') setStep('reset_password');
  }, [location.hash]);

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

  // ── Auto-submit when all OTP digits filled ────────────────────────────────

  useEffect(() => {
    if (step === 'phone_verify' && otpDigits.every(d => d !== '')) {
      handleVerifyOtp(otpDigits.join(''));
    }
  }, [otpDigits, step]);

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleGoogleSignIn = () => {
    const btn = googleContainerRef.current?.querySelector('div[role=button]') as HTMLElement | null;
    if (btn) {
      btn.click();
    } else {
      toast({ title: 'Google not ready', description: 'Please wait a moment and try again.', variant: 'destructive' });
    }
  };

  const handleAppleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: { redirectTo: `${window.location.origin}/perform` },
    });
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const digits = phoneDisplay.replace(/\D/g, '');
    if (digits.length !== 10) {
      toast({ title: 'Invalid number', description: 'Enter a 10-digit US phone number.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ phone: toE164(digits) });
    setLoading(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setOtpDigits(['', '', '', '', '', '']);
      setStep('phone_verify');
      setResendCooldown(30);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    }
  };

  const handleVerifyOtp = async (code?: string) => {
    const token = code ?? otpDigits.join('');
    if (token.length !== 6) return;
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      phone: toE164(phoneDisplay.replace(/\D/g, '')),
      token,
      type: 'sms',
    });
    setLoading(false);
    if (error) {
      toast({ title: 'Incorrect code', description: 'Check the code and try again.', variant: 'destructive' });
      setOtpDigits(['', '', '', '', '', '']);
      setTimeout(() => otpRefs.current[0]?.focus(), 50);
    } else {
      navigate('/perform');
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) return;
    const { error } = await supabase.auth.signInWithOtp({
      phone: toE164(phoneDisplay.replace(/\D/g, '')),
    });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Code resent' });
      setResendCooldown(30);
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
      toast({ title: 'Error', description: (error as any)?.message || 'Sign in failed.', variant: 'destructive' });
    } else {
      navigate('/perform');
    }
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signUp(email, password, '', '');
    setLoading(false);
    if (error) {
      toast({ title: 'Error', description: (error as any)?.message || 'Sign up failed.', variant: 'destructive' });
    } else {
      toast({ title: 'Account created!', description: 'Check your email to confirm your address.' });
      setStep('email_auth');
    }
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

  // ─── Layout helpers ────────────────────────────────────────────────────────

  const OAuthButtons = () => (
    <div className="space-y-3">
      {/* GIS renders its button here — positioned off-screen so it has real dimensions */}
      <div
        ref={googleContainerRef}
        aria-hidden="true"
        style={{ position: 'fixed', top: '-9999px', left: '-9999px', width: '240px', height: '44px', overflow: 'hidden', opacity: 0, pointerEvents: 'none' }}
      />
      <button
        type="button"
        onClick={handleGoogleSignIn}
        className="w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl border border-gray-200 bg-white text-gray-800 text-sm font-medium hover:bg-gray-50 transition-colors"
      >
        <GoogleIcon />
        Continue with Google
      </button>
      <button
        type="button"
        onClick={handleAppleSignIn}
        className="w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl bg-black text-white text-sm font-medium hover:bg-gray-900 transition-colors"
      >
        <AppleIcon />
        Continue with Apple
      </button>
    </div>
  );

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

  // ─── Step renderers ────────────────────────────────────────────────────────

  const renderMain = () => (
    <>
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Sign in to Comediq</h1>
      <p className="text-sm text-gray-500 mb-7">Free forever. Jump right in.</p>

      <OAuthButtons />

      <Divider label="or use your phone" />

      <form onSubmit={handleSendCode} className="space-y-3">
        <div className="flex rounded-xl border border-gray-200 overflow-hidden focus-within:ring-2 focus-within:ring-[#1a5fb4] focus-within:border-[#1a5fb4]">
          <span className="flex items-center pl-3.5 pr-2 text-sm text-gray-500 select-none bg-white">+1</span>
          <input
            type="tel"
            inputMode="numeric"
            placeholder="(212) 555-1234"
            value={phoneDisplay}
            onChange={e => setPhoneDisplay(formatPhone(e.target.value))}
            className="flex-1 py-3 pr-3 text-sm bg-white outline-none placeholder-gray-400"
            required
            autoComplete="tel-national"
          />
        </div>
        <button
          type="submit"
          disabled={loading || phoneDisplay.replace(/\D/g, '').length !== 10}
          className="w-full py-3 rounded-xl text-white text-sm font-medium transition-colors disabled:opacity-50"
          style={{ background: BRAND_BLUE }}
        >
          {loading ? 'Sending…' : 'Send code'}
        </button>
      </form>

      <Divider />

      <button
        type="button"
        onClick={() => setStep('email_auth')}
        className="w-full text-center text-sm text-gray-500 hover:text-gray-700 py-1"
      >
        Sign in with email →
      </button>
    </>
  );

  const renderPhoneVerify = () => (
    <>
      <button
        type="button"
        onClick={() => setStep('main')}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back
      </button>

      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Check your phone</h1>
      <p className="text-sm text-gray-500 mb-8">
        We sent a 6-digit code to <span className="font-medium text-gray-700">{phoneDisplay}</span>
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
          disabled={resendCooldown > 0}
          className="font-medium hover:underline disabled:opacity-40"
          style={{ color: BRAND_BLUE }}
        >
          {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
        </button>
      </p>
    </>
  );

  const renderEmailAuth = () => (
    <>
      <button
        type="button"
        onClick={() => setStep('main')}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6"
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

      <p className="mt-6 text-center text-sm text-gray-500">
        No account?{' '}
        <button type="button" onClick={() => setStep('email_signup')} className="font-medium underline underline-offset-2" style={{ color: BRAND_BLUE }}>Create one</button>
      </p>
    </>
  );

  const renderEmailSignup = () => (
    <>
      <button type="button" onClick={() => setStep('email_auth')} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="w-3.5 h-3.5" /> Back
      </button>
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Create your account</h1>
      <p className="text-sm text-gray-500 mb-7">Free forever. Start saving your mics.</p>
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
        By signing up you agree to our <a href="/privacy-policy" className="underline hover:text-gray-600">Privacy Policy</a>.
      </p>
    </>
  );

  const renderForgotPassword = () => (
    <>
      <button type="button" onClick={() => setStep('email_auth')} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6">
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
    phone_verify: renderPhoneVerify,
    email_auth: renderEmailAuth,
    email_signup: renderEmailSignup,
    forgot_password: renderForgotPassword,
    reset_password: renderResetPassword,
  }[step]();

  const seoTitle = {
    main: 'Sign In | Comediq',
    phone_verify: 'Verify Phone | Comediq',
    email_auth: 'Sign In | Comediq',
    email_signup: 'Join Comediq',
    forgot_password: 'Reset Password | Comediq',
    reset_password: 'Set New Password | Comediq',
  }[step];

  return (
    <>
      <SEO title={seoTitle} description="Sign in or create a free Comediq account to save open mics, track your comedy journey, and connect with the NYC comedy community." url="https://comediq.us/auth" noindex={true} />
      <div className="min-h-screen flex">
        <div className="hidden lg:flex lg:w-[45%] flex-col justify-between p-12 text-white" style={{ background: `linear-gradient(160deg, #0d3d7a 0%, ${BRAND_BLUE} 60%, #2a7ad4 100%)` }}>
          <div className="flex items-center gap-3">
            <span className="font-semibold text-lg tracking-tight">Comediq</span>
          </div>
          <div>
            <blockquote className="text-2xl font-medium leading-snug mb-6 text-white/90">
              "The best tool for tracking NYC open mics. I use it every week before I hit the road."
            </blockquote>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">J</div>
              <div>
                <p className="font-medium text-sm">Jamie Chen</p>
                <p className="text-white/60 text-xs">Stand-up comedian, NYC</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/20">
            <div><p className="text-2xl font-bold">1,250+</p><p className="text-white/60 text-sm">comedians per week</p></div>
            <div><p className="text-2xl font-bold">500+</p><p className="text-white/60 text-sm">open mics tracked</p></div>
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-white">
          <div className="lg:hidden mb-8 flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: BRAND_BLUE }}>
              <Mic className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-semibold text-lg">Comediq</span>
          </div>
          <div className="w-full max-w-sm">{stepContent}</div>
        </div>
      </div>
    </>
  );
};

export default Auth;
