import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Star } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface ShowReviewFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    rating: number;
    review_text?: string;
    favorite_comedian?: string;
    attended_date: string;
  }) => void;
  isSubmitting: boolean;
  showTitle: string;
  showDate: string;
  initialData?: {
    rating: number;
    review_text?: string | null;
    favorite_comedian?: string | null;
    attended_date: string;
  };
  isEditing?: boolean;
}

export function ShowReviewForm({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  showTitle,
  showDate,
  initialData,
  isEditing = false,
}: ShowReviewFormProps) {
  const [rating, setRating] = useState(initialData?.rating || 0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [reviewText, setReviewText] = useState(initialData?.review_text || "");
  const [favoriteComedian, setFavoriteComedian] = useState(
    initialData?.favorite_comedian || ""
  );
  const [attendedDate, setAttendedDate] = useState(
    initialData?.attended_date || showDate
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;

    onSubmit({
      rating,
      review_text: reviewText.trim() || undefined,
      favorite_comedian: favoriteComedian.trim() || undefined,
      attended_date: attendedDate,
    });
  };

  const displayRating = hoveredRating || rating;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Review" : "Write a Review"}</DialogTitle>
          <DialogDescription>{showTitle}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Star Rating */}
          <div className="space-y-2">
            <Label>Rating *</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="p-1 transition-transform hover:scale-110"
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  onClick={() => setRating(star)}
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= displayRating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground"
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating === 0 && (
              <p className="text-sm text-muted-foreground">
                Click to rate this show
              </p>
            )}
          </div>

          {/* Review Text */}
          <div className="space-y-2">
            <Label htmlFor="review-text">Your Review (optional)</Label>
            <Textarea
              id="review-text"
              placeholder="What did you think of the show?"
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              rows={3}
            />
          </div>

          {/* Favorite Comedian */}
          <div className="space-y-2">
            <Label htmlFor="favorite-comedian">Favorite Comedian (optional)</Label>
            <Input
              id="favorite-comedian"
              placeholder="Who stood out?"
              value={favoriteComedian}
              onChange={(e) => setFavoriteComedian(e.target.value)}
            />
          </div>

          {/* Attended Date */}
          <div className="space-y-2">
            <Label htmlFor="attended-date">Date Attended *</Label>
            <Input
              id="attended-date"
              type="date"
              value={attendedDate}
              onChange={(e) => setAttendedDate(e.target.value)}
              required
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={rating === 0 || isSubmitting}
              className="flex-1"
            >
              {isSubmitting
                ? "Saving..."
                : isEditing
                ? "Update Review"
                : "Submit Review"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
