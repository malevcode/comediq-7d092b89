import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Mic2 } from "lucide-react";

// Custom hook to fetch user profile from Supabase
function useUserProfile(userId) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single()
      .then(({ data, error }) => {
        setProfile(data || null);
        setLoading(false);
      });
  }, [userId]);

  return { profile, loading };
}

/**
 * Reusable Header component that displays user information with avatar and welcome message
 * 
 * @example
 * // Basic usage (shows email and level)
 * <Header className="mb-8" />
 * 
 * // Hide email, show only level
 * <Header showEmail={false} showLevel={true} />
 * 
 * // Hide level, show only email
 * <Header showEmail={true} showLevel={false} />
 * 
 * // Hide both email and level
 * <Header showEmail={false} showLevel={false} />
 */
interface HeaderProps {
  className?: string;
  showEmail?: boolean;
  showLevel?: boolean;
}

export default function Header({ className = "", showEmail = true, showLevel = true }: HeaderProps) {
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile(user?.id);

  // Fallbacks
  const displayName = profile?.username || user?.email?.split("@")[0] || "Comedian";
  const avatarUrl = profile?.avatar_url || "/lovable-uploads/fc65b384-6c71-4c5e-9c70-52716864f5ad.png";
  const level = profile?.level || "Rising Star";

  return (
    <div className={`bg-white/80 backdrop-blur rounded-xl p-6 shadow-sm ${className}`}>
      <div className="flex items-center gap-4">
        <div className="relative">
          <Avatar className="h-16 w-16 ring-4 ring-orange-200 ring-offset-2">
            <AvatarImage src={avatarUrl} alt={displayName} />
            <AvatarFallback className="bg-gradient-to-r from-orange-400 to-amber-400 text-white text-lg">
              {displayName.slice(0,2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full flex items-center justify-center">
            <Mic2 className="h-3 w-3 text-white" />
          </div>
        </div>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
            Welcome back, {displayName}! 
         </h1>
          {showEmail && showLevel && (
            <p className="text-gray-600 text-lg">
              {user?.email} • <span className="text-orange-600 font-medium">{level}</span>
            </p>
          )}
          {showEmail && !showLevel && (
            <p className="text-gray-600 text-lg">{user?.email}</p>
          )}
          {!showEmail && showLevel && (
            <p className="text-gray-600 text-lg">
              <span className="text-orange-600 font-medium">{level}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
