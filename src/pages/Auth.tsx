import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetPassword, setResetPassword] = useState('');
  const [resetPasswordConfirm, setResetPasswordConfirm] = useState('');
  const [showResetPasswordField, setShowResetPasswordField] = useState(false);
  
  const { signUp, signIn, user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      navigate('/perform');
    }
  }, [user, navigate]);

  // Detect recovery token in URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('type') === 'recovery' && params.get('access_token')) {
      setShowResetPassword(true);
    } else {
      setShowResetPassword(false);
    }
  }, [location.search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Phone validation BEFORE signUp
    if (isSignUp && phone && phone.length !== 10) {
      toast({
        title: "Invalid phone number",
        description: "Phone number must be exactly 10 digits.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    try {
      const { error } = isSignUp 
        ? await signUp(email, password, username, phone)
        : await signIn(email, password);

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: isSignUp ? "Account created!" : "Welcome back!",
          description: isSignUp 
            ? "You can now start rating and saving your favorite open mics!" 
            : "You've been signed in successfully.",
        });
        if (!isSignUp) {
          navigate('/perform');
        } else {
          navigate('/auth');
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    }

    setLoading(false);
  };

  const handleSocialLogin = async (provider: 'google') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/perform`
        }
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign in with social provider.",
        variant: "destructive",
      });
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      toast({
        title: 'Email required',
        description: 'Please enter your email address.',
        variant: 'destructive',
      });
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/auth`,
    });
    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Reset link sent',
        description: 'Check your email for a password reset link.',
      });
      setShowForgotPassword(false);
      setResetEmail('');
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPassword || !resetPasswordConfirm) {
      toast({
        title: 'Missing fields',
        description: 'Please fill out both password fields.',
        variant: 'destructive',
      });
      return;
    }
    if (resetPassword !== resetPasswordConfirm) {
      toast({
        title: 'Passwords do not match',
        description: 'Please make sure both passwords match.',
        variant: 'destructive',
      });
      return;
    }
    // Use Supabase to update password
    const { error } = await supabase.auth.updateUser({ password: resetPassword });
    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Password updated!',
        description: 'You can now log in with your new password.',
      });
      setShowResetPassword(false);
      setResetPassword('');
      setResetPasswordConfirm('');
      navigate('/auth');
    }
  };

  if (showResetPassword) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Set New Password</CardTitle>
            <p className="text-center text-gray-600 text-sm">Enter your new password below.</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div>
                <Input
                  type={showResetPasswordField ? 'text' : 'password'}
                  placeholder="New Password"
                  value={resetPassword}
                  onChange={e => setResetPassword(e.target.value)}
                  minLength={6}
                  required
                />
              </div>
              <div>
                <Input
                  type={showResetPasswordField ? 'text' : 'password'}
                  placeholder="Confirm New Password"
                  value={resetPasswordConfirm}
                  onChange={e => setResetPasswordConfirm(e.target.value)}
                  minLength={6}
                  required
                />
              </div>
              <div className="flex items-center mb-2">
                <input
                  id="show-reset-password"
                  type="checkbox"
                  checked={showResetPasswordField}
                  onChange={() => setShowResetPasswordField(v => !v)}
                  className="mr-2"
                />
                <label htmlFor="show-reset-password" className="text-sm text-gray-700">Show Password</label>
              </div>
              <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600">
                Confirm
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            {showForgotPassword ? 'Reset Password' : isSignUp ? 'Join Comediq' : 'Welcome Back'}
          </CardTitle>
          <p className="text-center text-gray-600 text-sm">
            {showForgotPassword
              ? 'Enter your email to receive a password reset link.'
              : isSignUp
                ? 'Create your account to start tracking your favorite open mics'
                : 'Sign in to access your saved mics and ratings'
            }
          </p>
        </CardHeader>
        <CardContent>
          {showForgotPassword ? (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <Input
                type="email"
                placeholder="Email"
                value={resetEmail}
                onChange={e => setResetEmail(e.target.value)}
                required
              />
              <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600">
                Send Reset Link
              </Button>
              <div className="mt-2 text-center">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(false)}
                  className="text-orange-600 hover:text-orange-700 text-sm"
                >
                  Back to Sign In
                </button>
              </div>
            </form>
          ) : (
            <>
              {/* Social Login Buttons */}
              <div className="space-y-3 mb-6">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => handleSocialLogin('google')}
                >
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </Button>
              </div>
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">Or continue with email</span>
                </div>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                {isSignUp && (
                  <div>
                    <Input
                      type="text"
                      placeholder="Username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                    <Input
                      className="mt-2"
                      type="text"
                      placeholder="Phone Number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      maxLength={10}
                    />
                  </div>
                )}
                <div>
                  <Input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-orange-500 hover:bg-orange-600"
                  disabled={loading}
                >
                  {loading ? 'Loading...' : (isSignUp ? 'Create Account' : 'Sign In')}
                </Button>
              </form>
              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-orange-600 hover:text-orange-700 text-sm"
                >
                  {isSignUp 
                    ? 'Already have an account? Sign In' 
                    : "Don't have an account? Sign Up"
                  }
                </button>
              </div>
              <div className="mt-2 text-center">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-orange-600 hover:text-orange-700 text-sm"
                >
                  Forgot Password?
                </button>
              </div>
              {isSignUp && (
                <p className="text-xs text-gray-500 mt-4 text-center">
                  By creating an account, you can save your favorite open mics and rate them to help other comedians.
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
