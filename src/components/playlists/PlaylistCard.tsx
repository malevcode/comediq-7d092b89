import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MicPlaylist, useMicPlaylists } from "@/hooks/useMicPlaylists";
import { formatDistanceToNow } from "date-fns";
import { Mic, Lock, Globe, MoreVertical, Pencil, Trash2, ChevronRight } from "lucide-react";
import { toast } from "sonner";

interface PlaylistCardProps {
  playlist: MicPlaylist;
  onOpen: (playlist: MicPlaylist) => void;
  onEdit?: (playlist: MicPlaylist) => void;
}

export function PlaylistCard({ playlist, onOpen, onEdit }: PlaylistCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { deletePlaylist } = useMicPlaylists();

  const handleDelete = async () => {
    try {
      await deletePlaylist(playlist.id);
      toast.success("Playlist deleted");
      setShowDeleteDialog(false);
    } catch (error) {
      console.error("Failed to delete playlist:", error);
      toast.error("Failed to delete playlist");
    }
  };

  const timeAgo = formatDistanceToNow(new Date(playlist.updated_at), { addSuffix: true });

  return (
    <>
      <Card 
        className="group cursor-pointer hover:shadow-md transition-all duration-200 border-border/50"
        onClick={() => onOpen(playlist)}
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base truncate group-hover:text-primary transition-colors">
                {playlist.name}
              </h3>
              {playlist.description && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {playlist.description}
                </p>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit?.(playlist); }}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-destructive"
                  onClick={(e) => { e.stopPropagation(); setShowDeleteDialog(true); }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="flex items-center gap-1">
                <Mic className="h-3 w-3" />
                {playlist.item_count || 0} mics
              </Badge>
              {playlist.is_public ? (
                <Globe className="h-3.5 w-3.5 text-muted-foreground" aria-label="Public" />
              ) : (
                <Lock className="h-3.5 w-3.5 text-muted-foreground" aria-label="Private" />
              )}
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Updated {timeAgo}
          </p>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{playlist.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this playlist and remove all mics from it. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
