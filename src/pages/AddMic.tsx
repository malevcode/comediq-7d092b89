import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/PageHeader';
import SEO from '@/components/SEO';
import { EditableMicCard } from '@/components/EditableMicCard';
import { useAddMic } from '@/hooks/useAddMic';

/**
 * Create a listing, open mic. Same card, same questions and same save as the +
 * on the Perform tab, so the two can never drift apart.
 */
export default function AddMic() {
  const navigate = useNavigate();
  const { addMic, isSubmitting } = useAddMic();

  return (
    <div className="min-h-screen">
      <SEO
        title="Add an Open Mic to Comediq | Comediq"
        description="Submit a comedy open mic to Comediq. Add the venue, start time, cost and sign-up rules so other comedians can find the room."
      />
      <PageHeader title="Add a Mic" subtitle="Everything you enter goes live right away" />
      <main className="mx-auto max-w-3xl px-4 pt-28 pb-16">
        <h1 className="sr-only">Add a comedy open mic</h1>
        <Button
          variant="ghost"
          size="sm"
          className="mb-3 -ml-2 text-[#07111f]/70 dark:text-white/70"
          onClick={() => navigate('/open-mics')}
        >
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to mics
        </Button>
        <p className="mb-3 text-sm text-[#07111f]/70 dark:text-white/70">
          Everything you enter goes live right away. Please double-check the details.
        </p>

        <EditableMicCard
          isSubmitting={isSubmitting}
          onCancel={() => navigate('/open-mics')}
          onSave={async (data) => {
            const added = await addMic(data);
            if (added) navigate('/open-mics', { state: { tab: 'new' } });
          }}
        />
      </main>
    </div>
  );
}
