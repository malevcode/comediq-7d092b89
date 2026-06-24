import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Sparkles } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import SEO from '@/components/SEO';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const BOOK_ME_MIC_TITLE = '6/28 Comediq Book Me Mic at High Line Comedy Club';
const BOOK_ME_MIC_PATH = '/book-me-mic';

interface BookMeMicSignupInsert {
  user_id: string;
  name: string;
  instagram_handle: string;
  phone_number: string;
}

type BookMeMicSignupClient = {
  from: (table: 'book_me_mic_signups') => {
    insert: (payload: BookMeMicSignupInsert) => Promise<{ error: { message?: string } | null }>;
  };
};

export default function BookMeMicSignup() {
  const { user, loading, subscriptionPlan } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [instagramHandle, setInstagramHandle] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const isSubscriber = !!user && subscriptionPlan !== 'free';
  const authNextParam = encodeURIComponent(BOOK_ME_MIC_PATH);
  const upgradePath = `/auth?next=${authNextParam}&plans=true`;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user || !isSubscriber) return;

    setIsSubmitting(true);
    const { error } = await (supabase as unknown as BookMeMicSignupClient)
      .from('book_me_mic_signups')
      .insert({
        user_id: user.id,
        name: name.trim(),
        instagram_handle: instagramHandle.trim(),
        phone_number: phoneNumber.trim(),
      });
    setIsSubmitting(false);

    if (error) {
      toast({
        title: 'Signup failed',
        description: error.message || 'Please try again.',
        variant: 'destructive',
      });
      return;
    }

    setSubmitted(true);
    toast({ title: 'Signup submitted', description: 'You are on the Book Me Mic list.' });
  };

  return (
    <>
      <SEO
        title="Book Me Mic Signup | Comediq"
        description="Subscriber signup for the Comediq Book Me Mic at High Line Comedy Club."
        url="https://comediq.us/book-me-mic"
        noindex={true}
      />
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-orange-50">
        <PageHeader title="Book Me Mic" subtitle="Subscriber signup" />

        <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-4 py-28">
          <Link
            to="/"
            className="mb-4 inline-flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>

          <Card className="w-full overflow-hidden border border-yellow-300/60 border-l-4 border-l-yellow-500 bg-gradient-to-br from-yellow-50 via-amber-50 to-white shadow-sm">
            <CardHeader>
              <div className="mb-2 inline-flex w-fit items-center gap-1 rounded-full border border-yellow-500/60 bg-yellow-100/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-yellow-800">
                <Sparkles className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                Full Pass Signup
              </div>
              <CardTitle className="text-2xl leading-tight">{BOOK_ME_MIC_TITLE}</CardTitle>
              <CardDescription>
                Three comics from every mic will be chosen to do the 8 pm show after.
              </CardDescription>
            </CardHeader>

            <CardContent>
              {loading ? (
                <p className="text-sm text-muted-foreground">Checking your subscription...</p>
              ) : submitted ? (
                <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-green-800">
                  <div className="flex items-center gap-2 font-semibold">
                    <CheckCircle className="h-4 w-4" />
                    Signup submitted
                  </div>
                  <p className="mt-1 text-sm">Thanks. We received your Book Me Mic signup.</p>
                </div>
              ) : !user ? (
                <div className="space-y-4 rounded-xl border border-yellow-200 bg-white/70 p-4">
                  <p className="text-sm font-medium text-gray-900">
                    You need to sign in to sign up.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Sign in to your Comediq account to continue with the Book Me Mic signup.
                  </p>
                  <Button asChild className="bg-[#1a5fb4] hover:bg-[#1550a0]">
                    <Link to={upgradePath}>
                      Sign in
                    </Link>
                  </Button>
                </div>
              ) : !isSubscriber ? (
                <div className="space-y-4 rounded-xl border border-yellow-200 bg-white/70 p-4">
                  <p className="text-sm font-medium text-gray-900">
                    You need to upgrade to the Full Pass to sign up.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Full Pass subscribers get access to Comediq subscriber mics and Book Me Mic opportunities.
                  </p>
                  <Button asChild className="bg-[#1a5fb4] hover:bg-[#1550a0]">
                    <Link to={upgradePath}>
                      {user ? 'Upgrade to Full Pass' : 'Sign in'}
                    </Link>
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="book-me-name">Name</Label>
                    <Input
                      id="book-me-name"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      maxLength={120}
                      placeholder="your name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="book-me-instagram">Instagram Handle</Label>
                    <Input
                      id="book-me-instagram"
                      value={instagramHandle}
                      onChange={(event) => setInstagramHandle(event.target.value)}
                      maxLength={80}
                      placeholder="@handle"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="book-me-phone">Phone Number</Label>
                    <Input
                      id="book-me-phone"
                      type="tel"
                      value={phoneNumber}
                      onChange={(event) => setPhoneNumber(event.target.value)}
                      maxLength={40}
                      placeholder="your phone number"
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-[#1a5fb4] hover:bg-[#1550a0]"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Signup'}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </>
  );
}
