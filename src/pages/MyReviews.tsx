import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Star, Film, Calendar, User, Trash2 } from "lucide-react";
import { useUserReviews, useDeleteReview } from "@/hooks/useShowReviews";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

function renderStars(rating: number) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-4 h-4 ${
            star <= rating 
              ? "fill-yellow-400 text-yellow-400" 
              : "text-muted-foreground"
          }`}
        />
      ))}
    </div>
  );
}

export default function MyReviews() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: reviews, isLoading } = useUserReviews();
  const deleteReview = useDeleteReview();

  if (!user) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
          <Film className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">Sign In to Track Reviews</h3>
        <p className="text-muted-foreground mb-4">
          Keep track of shows you've attended!
        </p>
        <Button onClick={() => navigate('/auth')}>
          Sign In
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">My Reviews</h2>
          <p className="text-sm text-muted-foreground">Track shows you've attended</p>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <Skeleton className="w-16 h-24 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-foreground">My Reviews</h2>
        <p className="text-sm text-muted-foreground">
          Track shows you've attended
        </p>
      </div>

      {/* Reviews List */}
      {reviews && reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex gap-4">
                  {/* Show Image */}
                  <div className="w-16 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
                    {review.show?.image_url ? (
                      <img 
                        src={review.show.image_url} 
                        alt={review.show.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Film className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  
                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-foreground line-clamp-1">
                          {review.show?.title || 'Unknown Show'}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {review.show?.venue_name}
                        </p>
                      </div>
                      {renderStars(review.rating)}
                    </div>
                    
                    {review.review_text && (
                      <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                        {review.review_text}
                      </p>
                    )}
                    
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(review.attended_date).toLocaleDateString()}
                        </span>
                        {review.favorite_comedian && (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {review.favorite_comedian}
                          </span>
                        )}
                      </div>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Trash2 className="w-4 h-4 text-muted-foreground" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Review?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete your review for "{review.show?.title}".
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteReview.mutate(review.id)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <Film className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">No Reviews Yet</h3>
          <p className="text-muted-foreground mb-4">
            Attend a show and write a review to track your experiences!
          </p>
          <Button onClick={() => navigate('/laugh?tab=find-shows')}>
            Find Shows
          </Button>
        </div>
      )}
    </div>
  );
}
