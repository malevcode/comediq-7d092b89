import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/PageHeader';
import SEO from '@/components/SEO';
import { EditableShowCard, type ShowCardData } from '@/components/EditableShowCard';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { submitShowListing } from '@/api/audienceShows';
import { prepareImage } from '@/utils/prepareImage';

/** The database is missing the columns from 20261021120000_show_listing_fields.sql. */
const isMissingColumnError = (message: string) =>
  /laughpass|confirm_active|last_confirmed_active|schema cache|column .* does not exist/i.test(message);

/**
 * Create a listing, show. Same kind of condensed card as the add-a-mic form.
 * Shows are reviewed before they appear on the Laugh tab.
 */
export default function AddShow() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const returnPath = new URLSearchParams(location.search).get('from') === 'shows' ? '/shows' : '/laugh';

  const handleSave = async (data: ShowCardData) => {
    if (!user) {
      navigate(`/auth?redirect=${encodeURIComponent(`${location.pathname}${location.search}`)}`);
      return;
    }

    setSubmitting(true);
    try {
      // The picture goes in the user's own folder of the public headshots bucket,
      // the one place every signed-in user is already allowed to upload.
      let imageUrl: string | null = null;
      if (data.imageFile) {
        const { blob, ext, type } = await prepareImage(data.imageFile);
        const path = `${user.id}/show-${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('headshots')
          .upload(path, blob, { contentType: type, cacheControl: '3600' });
        if (uploadError) throw new Error(`Image upload failed: ${uploadError.message}`);
        imageUrl = supabase.storage.from('headshots').getPublicUrl(path).data.publicUrl;
      }

      const { imageFile: _imageFile, ...fields } = data;
      await submitShowListing(user.id, { ...fields, image_url: imageUrl });

      toast({
        title: 'Show submitted!',
        description:
          data.repeat === 'none'
            ? 'It will appear on the Laugh tab once it has been reviewed.'
            : 'Your upcoming dates will appear on the Laugh tab once they have been reviewed.',
      });
      navigate(returnPath);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Show submit error:', message, error);
      toast({
        title: isMissingColumnError(message) ? 'Show listings are being set up' : 'Could not submit the show',
        description: isMissingColumnError(message)
          ? 'Comediq needs one quick database update before shows can be submitted. Please try again soon.'
          : message,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent pb-2 pt-20">
      <SEO
        title="Submit a Comedy Show to Comediq | Comediq"
        description="List your stand-up comedy show on Comediq. Add the venue, date, ticket link and a picture so audiences can find it."
      />
      <PageHeader title="Submit a Show" subtitle="Add your comedy show to our listings" />

      <div className="mx-auto mt-10 max-w-3xl px-4 pb-10">
        <h1 className="sr-only">Submit a comedy show</h1>
        <Button variant="ghost" onClick={() => navigate(returnPath)} className="mb-2">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {returnPath === '/shows' ? 'Back to Scheduler' : 'Back to Shows'}
        </Button>
        <p className="mb-3 text-sm text-[#07111f]/70 dark:text-white/70">
          Your show is reviewed before it appears on the Laugh tab.
        </p>

        <EditableShowCard isSubmitting={submitting} onCancel={() => navigate(returnPath)} onSave={handleSave} />
      </div>
    </div>
  );
}
