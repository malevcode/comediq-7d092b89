import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import SEO from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Eye, EyeOff, Mic } from 'lucide-react';

// Google Client ID — set VITE_GOOGLE_CLIENT_ID in your .env / Lovable build secrets
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

const BRAND_BLUE = '#1a5fb4';

const GoogleIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const AppleIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
  </svg>
);

type AuthView = 'sign_in' | 'sign_up' | 'forgot_password' | 'reset_password';

const Auth = () => {
  const [view, setView] = useState<AuthView>('sign_in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [resetPasswordConfirm, setResetPasswordConfirm] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const gisLoaded = useRef(false);

  const location = useLocation();
  const navigate = useNavigate();
  const { signUp, signIn, user } = useAuth();
  const { toast } = useToast();

  // Load Google Identity Services script
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || gisLoaded.current) return;
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = () => { gisLoaded.current = true; };
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (user && view !== 'reset_password') {
      navigate('/perform');
    }
  }, [user, navigate, view]);

  useEffect(() => {
    const hash = location.hash.substring(1);
    const params = new URLSearchParams(hash);
    if (params.get('type') === 'recovery') {
      setView('reset_password');
    }
  }, [location.hash]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setView('reset_password');
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (view === 'sign_up' && phone && phone.length !== 10) {
      toast({ title: "Invalid phone number", description: "Phone number must be exactly 10 digits.", variant: "destructive" });
      setLoading(false);
      return;
    }

    try {
      const { error } = view === 'sign_up'
        ? await signUp(email, password, username, phone)
        : await signIn(email, password);

      if (error) {
        toast({ title: "Error", description: (error as any)?.message || "An error occurred", variant: "destructive" });
      } else {
        toast({
          title: view === 'sign_up' ? "Account created!" : "Welcome back!",
          description: view === 'sign_up'
            ? "You can now start saving your favorite open mics."
            : "You've been signed in successfully.",
        });
        if (view === 'sign_in') navigate('/perform');
        else setView('sign_in');
      }
    } catch {
      toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive" });
    }

    setLoading(false);
  };

  // Google sign-in via GIS — shows "comediq.us" on consent screen, not supabase.co
  const handleGoogleSignIn = () => {
    const google = (window as any).google;
    if (!google?.accounts?.id || !GOOGLE_CLIENT_ID) {
      // Fallback to redirect flow if GIS not loaded or client ID missing
      supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/perform` },
      });
      return;
    }
    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      ux_mode: 'popup',
      callback: async ({ credential }: { credential: string }) => {
        const { error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: credential,
        });
        if (error) {
          toast({ title: 'Error', description: error.message, variant: 'destructive' });
        } else {
          navigate('/perform');
        }
      },
    });
    google.accounts.id.prompt((notification: any) => {
      // One Tap was suppressed (e.g. user dismissed) — show button popup instead
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        google.accounts.id.prompt();
      }
    });
  };

  const handleAppleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: { redirectTo: `${window.location.origin}/perform` },
      });
      if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } catch {
      toast({ title: 'Error', description: 'Failed to sign in with Apple.', variant: 'destructive' });
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      toast({ title: 'Email required', description: 'Please enter your email address.', variant: 'destructive' });
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/auth`,
    });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Reset link sent', description: 'Check your email for a password reset link.' });
      setView('sign_in');
      setResetEmail('');
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPassword || !resetPasswordConfirm) {
      toast({ title: 'Missing fields', description: 'Please fill out both password fields.', variant: 'destructive' });
      return;
    }
    if (resetPassword !== resetPasswordConfirm) {
      toast({ title: 'Passwords do not match', description: 'Please make sure both passwords match.', variant: 'destructive' });
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: resetPassword });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Password updated!', description: 'You can now sign in with your new password.' });
      setView('sign_in');
      setResetPassword('');
      setResetPasswordConfirm('');
    }
  };

  const formTitle = {
    sign_in: 'Sign in to Comediq',
    sign_up: 'Create your account',
    forgot_password: 'Reset your password',
    reset_password: 'Set a new password',
  }[view];

  const seoTitle = {
    sign_in: 'Sign In | Comediq',
    sign_up: 'Join Comediq — NYC Comedy Open Mics',
    forgot_password: 'Reset Password | Comediq',
    reset_password: 'Set New Password | Comediq',
  }[view];

  return (
    <>
      <SEO
        title={seoTitle}
        description="Sign in or create a free Comediq account to save open mics, track your comedy journey, and connect with the NYC comedy community."
        url="https://comediq.us/auth"
        noindex={true}
      />

      <div className="min-h-screen flex">
        {/* Left brand panel — hidden on mobile */}
        <div
          className="hidden lg:flex lg:w-[45%] flex-col justify-between p-12 text-white"
          style={{ background: `linear-gradient(160deg, #0d3d7a 0%, ${BRAND_BLUE} 60%, #2a7ad4 100%)` }}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <Mic className="w-4 h-4 text-white" />
            </div>
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
            <div>
              <p className="text-2xl font-bold">1,250+</p>
              <p className="text-white/60 text-sm">comedians per week</p>
            </div>
            <div>
              <p className="text-2xl font-bold">500+</p>
              <p className="text-white/60 text-sm">open mics tracked</p>
            </div>
          </div>
        </div>

        {/* Right form panel */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-white">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: BRAND_BLUE }}>
              <Mic className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-semibold text-lg">Comediq</span>
          </div>

          <div className="w-full max-w-sm">
            <h1 className="text-2xl font-semibold text-gray-900 mb-1">{formTitle}</h1>
            <p className="text-sm text-gray-500 mb-8">
              {view === 'sign_in' && "Welcome back. Enter your credentials to continue."}
              {view === 'sign_up' && "Free forever. Start saving your favorite open mics."}
              {view === 'forgot_password' && "Enter your email and we'll send you a reset link."}
              {view === 'reset_password' && "Choose a new password for your account."}
            </p>

            {/* Reset password form */}
            {view === 'reset_password' && (
              <form onSubmit={handlePasswordReset} className="space-y-4">
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="New password"
                    value={resetPassword}
                    onChange={e => setResetPassword(e.target.value)}
                    minLength={6}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPassword(v => !v)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Confirm new password"
                  value={resetPasswordConfirm}
                  onChange={e => setResetPasswordConfirm(e.target.value)}
                  minLength={6}
                  required
                />
                <Button
                  type="submit"
                  className="w-full text-white font-medium"
                  style={{ background: BRAND_BLUE }}
                >
                  Update password
                </Button>
              </form>
            )}

            {/* Forgot password form */}
            {view === 'forgot_password' && (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <Input
                  type="email"
                  placeholder="Email address"
                  value={resetEmail}
                  onChange={e => setResetEmail(e.target.value)}
                  required
                />
                <Button
                  type="submit"
                  className="w-full text-white font-medium"
                  style={{ background: BRAND_BLUE }}
                >
                  Send reset link
                </Button>
                <button
                  type="button"
                  onClick={() => setView('sign_in')}
                  className="w-full text-center text-sm text-gray-500 hover:text-gray-700"
                >
                  Back to sign in
                </button>
              </form>
            )}

            {/* Main sign in / sign up form */}
            {(view === 'sign_in' || view === 'sign_up') && (
              <>
                {/* OAuth buttons */}
                <div className="space-y-3 mb-6">
                  <button
                    type="button"
                    onClick={handleAppleSignIn}
                    className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-md border border-gray-200 bg-black text-white text-sm font-medium hover:bg-gray-900 transition-colors"
                  >
                    <AppleIcon />
                    Continue with Apple
                  </button>
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-md border border-gray-200 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
                  >
                    <GoogleIcon />
                    Continue with Google
                  </button>
                </div>

                <div className="relative mb-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-white px-3 text-xs text-gray-400 uppercase tracking-wide">or</span>
                  </div>
                </div>

                <form onSubmit={handleEmailAuth} className="space-y-3">
                  <Input
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />

                  {view === 'sign_up' && (
                    <>
                      <Input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                      />
                      <Input
                        type="tel"
                        placeholder="Phone number (optional)"
                        value={phone}
                        onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                        maxLength={10}
                      />
                    </>
                  )}

                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      onClick={() => setShowPassword(v => !v)}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {view === 'sign_in' && (
                    <div className="text-right">
                      <button
                        type="button"
                        onClick={() => setView('forgot_password')}
                        className="text-xs text-gray-500 hover:text-gray-700"
                      >
                        Forgot password?
                      </button>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full text-white font-medium mt-1"
                    style={{ background: BRAND_BLUE }}
                    disabled={loading}
                  >
                    {loading ? 'Please wait...' : view === 'sign_up' ? 'Create account' : 'Sign in'}
                  </Button>
                </form>

                <p className="mt-6 text-center text-sm text-gray-500">
                  {view === 'sign_in' ? "Don't have an account? " : "Already have an account? "}
                  <button
                    type="button"
                    onClick={() => setView(view === 'sign_in' ? 'sign_up' : 'sign_in')}
                    className="font-medium underline underline-offset-2"
                    style={{ color: BRAND_BLUE }}
                  >
                    {view === 'sign_in' ? 'Sign up' : 'Sign in'}
                  </button>
                </p>

                {view === 'sign_up' && (
                  <p className="mt-4 text-xs text-gray-400 text-center leading-relaxed">
                    By creating an account you agree to our{' '}
                    <a href="/privacy-policy" className="underline hover:text-gray-600">Privacy Policy</a>.
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Auth;
