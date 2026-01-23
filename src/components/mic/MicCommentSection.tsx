import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Send, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useMicComments, MicComment } from "@/hooks/useMicComments";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface MicCommentSectionProps {
  micUniqueIdentifier: string;
  isExpanded: boolean;
  onClose: () => void;
}

const MAX_COMMENT_LENGTH = 180;

export default function MicCommentSection({
  micUniqueIdentifier,
  isExpanded,
  onClose
}: MicCommentSectionProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [newComment, setNewComment] = useState("");
  
  const { 
    comments, 
    isLoading, 
    addComment, 
    deleteComment,
    isAddingComment,
    isDeletingComment 
  } = useMicComments(micUniqueIdentifier);

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to comment",
        variant: "default"
      });
      navigate("/auth");
      return;
    }

    if (!newComment.trim()) return;

    try {
      await addComment(newComment);
      setNewComment("");
      toast({
        title: "Comment posted!",
        description: "Your comment has been added"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to post comment",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      await deleteComment(commentId);
      toast({
        title: "Deleted",
        description: "Your comment has been removed"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete comment",
        variant: "destructive"
      });
    }
  };

  const charactersRemaining = MAX_COMMENT_LENGTH - newComment.length;
  const isOverLimit = charactersRemaining < 0;

  if (!isExpanded) return null;

  return (
    <div className="border-t border-gray-200 mt-3 pt-3 animate-in slide-in-from-top-2 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-sm text-gray-900">
          Comments {comments.length > 0 && `(${comments.length})`}
        </h4>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0">
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Comment Input */}
      <div className="mb-4">
        <div className="relative">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={user ? "Share your experience..." : "Sign in to comment..."}
            disabled={!user}
            className={cn(
              "min-h-[80px] text-sm resize-none pr-12",
              isOverLimit && "border-red-500 focus:ring-red-500"
            )}
            maxLength={MAX_COMMENT_LENGTH + 10} // Allow slight overflow for UX
          />
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!newComment.trim() || isOverLimit || isAddingComment || !user}
            className="absolute bottom-2 right-2 h-8 w-8 p-0 bg-gradient-to-r from-[#0E4898] to-[#5DC8E2]"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <div className={cn(
          "text-xs mt-1 text-right",
          isOverLimit ? "text-red-500" : "text-gray-400"
        )}>
          {charactersRemaining} characters remaining
        </div>
      </div>

      {/* Comments List */}
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {isLoading ? (
          <div className="text-center py-4 text-gray-500 text-sm">
            Loading comments...
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-4 text-gray-500 text-sm">
            No comments yet. Be the first to share!
          </div>
        ) : (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              isOwner={user?.id === comment.user_id}
              onDelete={() => handleDelete(comment.id)}
              isDeleting={isDeletingComment}
            />
          ))
        )}
      </div>
    </div>
  );
}

interface CommentItemProps {
  comment: MicComment;
  isOwner: boolean;
  onDelete: () => void;
  isDeleting: boolean;
}

function CommentItem({ comment, isOwner, onDelete, isDeleting }: CommentItemProps) {
  const timeAgo = formatDistanceToNow(new Date(comment.created_at), { addSuffix: true });

  return (
    <div className="flex gap-3 group">
      {/* Avatar placeholder */}
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0E4898] to-[#5DC8E2] flex items-center justify-center flex-shrink-0">
        <span className="text-white text-xs font-semibold">
          {(comment.username || "A").charAt(0).toUpperCase()}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm text-gray-900 truncate">
            {comment.username || "Anonymous"}
          </span>
          <span className="text-xs text-gray-400">{timeAgo}</span>
        </div>
        <p className="text-sm text-gray-700 mt-0.5 break-words">
          {comment.comment_text}
        </p>
      </div>

      {/* Delete button for owner */}
      {isOwner && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          disabled={isDeleting}
          className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 text-gray-400 hover:text-red-500"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      )}
    </div>
  );
}
