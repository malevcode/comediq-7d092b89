import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { CreatePostingForm } from '@/components/jobboard/CreatePostingForm';
import { useCreatePosting, useAddRole } from '@/hooks/useJobBoard';
import PageHeader from '@/components/PageHeader';
import SEO from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import type { CreatePostingData, CreateRoleData } from '@/types/jobBoard';

const CreatePosting = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const createPosting = useCreatePosting();
  const addRole = useAddRole();

  const handleSubmit = async (posting: CreatePostingData, roles: CreateRoleData[]) => {
    if (!user) {
      navigate('/auth');
      return;
    }

    try {
      const newPosting = await createPosting.mutateAsync(posting);

      // Add all roles to the posting
      await Promise.all(
        roles.map((role) =>
          addRole.mutateAsync({
            ...role,
            posting_id: newPosting.id,
          })
        )
      );

      navigate('/job-board');
    } catch (error) {
      console.error('Failed to create posting:', error);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-transparent pb-20">
        <PageHeader title="Create Posting" subtitle="Post a comedy opportunity" />
        <div className="page-content-offset px-4 max-w-2xl mx-auto text-center">
          <p className="text-muted-foreground mb-4">You need to be logged in to create a posting.</p>
          <Button onClick={() => navigate('/auth')}>Sign In</Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO
        title="Create Gig Posting - Find Gigs"
        description="Post a comedy show opportunity. Find performers, crew, and talent for your show."
      />
      <div className="min-h-screen bg-transparent pb-20">
        <PageHeader title="Create Posting" subtitle="Post a comedy opportunity" />

        <div className="page-content-offset px-4 max-w-4xl mx-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/job-board')}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Find Gigs
          </Button>

          <CreatePostingForm
            onSubmit={handleSubmit}
            onCancel={() => navigate('/job-board')}
            isSubmitting={createPosting.isPending || addRole.isPending}
          />
        </div>
      </div>
    </>
  );
};

export default CreatePosting;
