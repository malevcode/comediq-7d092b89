import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, DollarSign, Calendar } from "lucide-react";

interface OpenMicRow {
  unique_identifier: string;
  open_mic: string;
  day: string;
  start_time: string;
  venue_name: string;
  borough: string;
  neighborhood: string;
  cost: string;
  stage_time: string;
  active: boolean;
  status: string;
}

const OpenMicsOG = () => {
  const { data: mics, isLoading, error } = useQuery({
    queryKey: ["openMicsOG"],
    queryFn: async (): Promise<OpenMicRow[]> => {
      const { data, error } = await supabase
        .from("open_mics_historical")
        .select("unique_identifier, open_mic, day, start_time, venue_name, borough, neighborhood, cost, stage_time, active, status")
        .eq("active", true)
        .neq("status", "pending")
        .order("day");
      
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const dayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  
  const sortedMics = mics?.sort((a, b) => {
    const dayA = dayOrder.indexOf(a.day);
    const dayB = dayOrder.indexOf(b.day);
    if (dayA !== dayB) return dayA - dayB;
    return (a.start_time || "").localeCompare(b.start_time || "");
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      <PageHeader title="Open Mics (Classic)" subtitle="Simple list view" />
      
      <main className="pt-24 pb-8 px-4 max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">NYC Open Mics</h1>
          <p className="text-gray-600">
            {isLoading ? "Loading..." : `${mics?.length || 0} active mics`}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700">Error loading mics: {error.message}</p>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {sortedMics?.map((mic) => (
              <Card 
                key={mic.unique_identifier} 
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => window.location.href = `/mic/${mic.unique_identifier}`}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-900 text-lg">
                      {mic.open_mic || mic.venue_name}
                    </h3>
                    <Badge 
                      variant={mic.status === 'verified' ? 'default' : 'secondary'}
                      className={mic.status === 'verified' ? 'bg-green-500' : 'bg-amber-500'}
                    >
                      {mic.status === 'verified' ? 'Verified' : 'Trial'}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Calendar size={14} />
                      <span>{mic.day}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock size={14} />
                      <span>{mic.start_time || "TBA"}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin size={14} />
                      <span>{mic.neighborhood || mic.borough}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign size={14} />
                      <span>{mic.cost || "Free"}</span>
                    </div>
                  </div>
                  
                  {mic.venue_name && mic.venue_name !== mic.open_mic && (
                    <p className="text-xs text-gray-500 mt-2">@ {mic.venue_name}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default OpenMicsOG;
