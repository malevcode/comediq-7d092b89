import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Mic2 } from "lucide-react";

// Custom hook to fetch user profile from Supabase
function useUserProfile(userId) {
  const { data: profile, isLoading } = useQuery({
    queryKey: ["userProfile", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("username, headshot_url")
        .eq("user_id", userId)
        .maybeSingle();
      return (data as { username?: string; headshot_url?: string } | null) ?? null;
    },
    enabled: !!userId,
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
  return { profile, loading: isLoading };
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
  const avatarUrl = profile?.headshot_url || "/lovable-uploads/fc65b384-6c71-4c5e-9c70-52716864f5ad.png";
  const level = "Rising Star";

  return (
    <div className={`bg-white/80 backdrop-blur rounded-xl p-6 shadow-sm ${className}`}>
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#1a5fb4]">
            Welcome back, {displayName}!
          </h1>
          {showEmail && showLevel && (
            <p className="text-gray-600 text-lg">
              {user?.email} • <span className="text-[#1a5fb4] font-medium">{level}</span>
            </p>
          )}
          {showEmail && !showLevel && (
            <p className="text-gray-600 text-lg">{user?.email}</p>
          )}
          {!showEmail && showLevel && (
            <p className="text-gray-600 text-lg">
              <span className="text-[#1a5fb4] font-medium">{level}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
