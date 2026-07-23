import { useState } from 'react';
import { Pencil, LogIn, Plus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import HostMicEditForm from '@/components/host/HostMicEditForm';

interface EditMicButtonProps {
  micUniqueIdentifier: string;
  micName: string;
}

/**
 * Open edit button shown on every mic listing (inside the additional
 * details dropdown). Anyone with an account can fix a listing's facts —
 * changes publish instantly, and old values are recorded to
 * mic_edit_history so they can be restored later.
 */
export default function EditMicButton({ micUniqueIdentifier, micName }: EditMicButtonProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleClick = () => {
    if (!user) {
      toast({ title: 'Sign in required', description: 'Please sign in to edit this mic.' });
      navigate('/auth');
      return;
    }
    setOpen(true);
  };

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        className="w-full flex items-center justify-center gap-2 border-blue-300 text-blue-700 bg-white hover:text-blue hover:bg-gray-200"
        onClick={handleClick}
      >
        {user ? <Pencil className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
        Edit Mic Details
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="w-4 h-4" />
              Edit {micName}
            </DialogTitle>
            <DialogDescription>
              Spot something out of date? Fix it below — changes publish instantly.
            </DialogDescription>
          </DialogHeader>
          <HostMicEditForm
            micUniqueIdentifier={micUniqueIdentifier}
            onClose={() => setOpen(false)}
          />
          <div className="pt-2 border-t text-xs text-muted-foreground flex items-center gap-1">
            <Plus className="w-3 h-3" />
            <span>
              Hosting a mic that isn't listed?{' '}
              <Link
                to="/open-mics?addMic=true"
                className="text-primary hover:underline"
                onClick={() => setOpen(false)}
              >
                Add it to Comediq
              </Link>
            </span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
