import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { mapSupabaseRow } from "@/hooks/useOpenMics";
import type { MicRequestFormData } from "@/components/host/AddMicRequestForm";
import type { OpenMic } from "@/types/openMic";

/**
 * The one way to add a mic. Used by the + on the Perform tab and by the Create
 * a listing page, so both ask the same questions and save the same way.
 * Returns the added mic, or null if it failed (the toast already says why).
 */
export function useAddMic() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addMic = async (formData: MicRequestFormData): Promise<OpenMic | null> => {
    setIsSubmitting(true);
    try {
      // add_open_mic is a SECURITY DEFINER function so anyone, signed in or not,
      // can add a mic. It sets status, creator and submission date server-side.
      const { data: newRow, error: histError } = await (supabase as any).rpc("add_open_mic", {
        p: {
          open_mic: formData.open_mic,
          venue_name: formData.venue_name,
          borough: formData.borough,
          neighborhood: formData.neighborhood,
          location: formData.location,
          day: formData.day,
          start_time: formData.start_time,
          latest_end_time: formData.latest_end_time,
          stage_time: formData.stage_time,
          cost: formData.cost,
          venue_type: formData.venue_type,
          sign_up_instructions: formData.sign_up_instructions,
          hosts_organizers: formData.hosts_organizers,
          changes_updates: formData.changes_updates,
          city: formData.city,
          frequency: formData.frequency,
          signup_method: formData.signup_method,
          signup_url: formData.signup_url,
          frequency_custom_text: formData.frequency_custom_text,
        },
      });

      if (histError || !newRow) {
        console.error("Insert error:", histError);
        toast({
          title: "Error",
          description: histError?.message || "Failed to add mic. Please try again.",
          variant: "destructive",
        });
        return null;
      }

      // Show it right away: drop it into every cached mic list.
      const addedMic = mapSupabaseRow(newRow);
      queryClient.setQueriesData<OpenMic[]>({ queryKey: ["openMics"] }, (old) =>
        old ? [...old.filter((m) => m.id !== addedMic.id), addedMic] : [addedMic],
      );

      // Audit trail. Best effort: the mic is already live.
      await supabase.from("open_mics_requests").insert([
        {
          show_title: formData.open_mic,
          open_mic: formData.open_mic,
          venue_name: formData.venue_name,
          borough: formData.borough || null,
          neighborhood: formData.neighborhood || null,
          location: formData.location || null,
          date: formData.day,
          time: formData.start_time,
          latest_end_time: formData.latest_end_time || null,
          stage_time: formData.stage_time || null,
          cost: formData.cost || null,
          venue_type: formData.venue_type || null,
          sign_up_instructions: formData.sign_up_instructions || null,
          hosts_organizers: formData.hosts_organizers || null,
          changes_updates: formData.changes_updates || null,
          other_rules: null,
          city: formData.city || "New York",
          user_id: user?.id || null,
          frequency: formData.frequency || "weekly",
          signup_method: formData.signup_method || "in_person",
          signup_url: formData.signup_url || null,
          frequency_custom_text: formData.frequency_custom_text || null,
          reviewed: true,
          status: "approved",
        },
      ]);

      toast({
        title: "Mic added! 🎤",
        description: "It's now live on the site. Thanks for contributing!",
      });
      return addedMic;
    } catch (e) {
      console.error("Unexpected error:", e);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { addMic, isSubmitting };
}
