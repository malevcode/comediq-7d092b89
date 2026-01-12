import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Star, Plus, Film, Calendar, MessageSquare } from "lucide-react";

// Example data for comedy specials - in production this would come from the database
const comedySpecials = [
  {
    id: 1,
    title: "Rothaniel",
    comedian: "Jerrod Carmichael",
    year: 2022,
    poster: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop",
    rating: 5,
    review: "Raw, honest, and groundbreaking. Changed how I think about comedy specials.",
    watchedDate: "2024-12-15",
    platform: "HBO"
  },
  {
    id: 2,
    title: "Baby Cobra",
    comedian: "Ali Wong",
    year: 2016,
    poster: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&h=400&fit=crop",
    rating: 4,
    review: "Hilarious and unapologetic. Ali Wong at her finest.",
    watchedDate: "2024-11-20",
    platform: "Netflix"
  },
  {
    id: 3,
    title: "Nanette",
    comedian: "Hannah Gadsby",
    year: 2018,
    poster: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&h=400&fit=crop",
    rating: 5,
    review: "More than a comedy special - it's a powerful statement on art and trauma.",
    watchedDate: "2024-10-05",
    platform: "Netflix"
  }
];

function renderStars(rating: number) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-4 h-4 ${
            star <= rating 
              ? "fill-yellow-400 text-yellow-400" 
              : "text-gray-300"
          }`}
        />
      ))}
    </div>
  );
}

export default function MyReviews() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">My Reviews</h2>
          <p className="text-sm text-muted-foreground">
            Track comedy specials you've watched
          </p>
        </div>
        <Button size="sm" className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-1" />
          Add Special
        </Button>
      </div>

      {/* Specials List */}
      {comedySpecials.length > 0 ? (
        <div className="space-y-4">
          {comedySpecials.map((special) => (
            <Card key={special.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex gap-4">
                  {/* Poster */}
                  <div className="w-16 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
                    <img 
                      src={special.poster} 
                      alt={special.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-foreground">{special.title}</h3>
                        <p className="text-sm text-muted-foreground">{special.comedian} • {special.year}</p>
                      </div>
                      {renderStars(special.rating)}
                    </div>
                    
                    {special.review && (
                      <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                        {special.review}
                      </p>
                    )}
                    
                    <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Film className="w-3 h-3" />
                        {special.platform}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(special.watchedDate).toLocaleDateString()}
                      </span>
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
            Start tracking comedy specials you've watched!
          </p>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Special
          </Button>
        </div>
      )}
    </div>
  );
}
