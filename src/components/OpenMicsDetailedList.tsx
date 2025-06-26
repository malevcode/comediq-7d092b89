import { Calendar, Clock, Users, DollarSign, Star, MapPin, CircleUser } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OpenMic } from "@/types/openMic";
import { useMicRatings } from "@/hooks/useMicRatings";
import { useState } from "react";

export default function OpenMicsDetailedList({
  mics,
}: {
  mics: OpenMic[];
}) {
  const [viewMode, setViewMode] = useState<'list' | 'detailed_list' | 'map'>('list');

  return (
    <div className="flex flex-col gap-3">
      {mics.map((mic) => {
        const { userRating, ratingCounts } = useMicRatings(mic.uniqueIdentifier);
        return (
          <div
            key={mic.uniqueIdentifier}
            className="flex flex-col md:flex-row items-start md:items-center bg-white border rounded-xl shadow-sm p-4 gap-2 md:gap-6"
          >
            {/* Left: Name, Location, Date */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-lg text-gray-900">{mic.openMic}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold
                  ${mic.lastVerified === 'Confirmed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {mic.lastVerified}
                </span>
              </div>
              <div className="text-sm text-gray-600">
                <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{mic.venueName}, {mic.neighborhood}</span>
                <span className="flex items-center gap-1"><Calendar className="w-4 h-4"/>{mic.day != "Daily" ? "Weekly - " + mic.day : mic.day}</span>
              </div>
            {/* Mid: Sub Info */}
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-700">
                <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{mic.startTime} - {mic.latestEndTime}</span>
                <span className="flex items-center gap-1"><DollarSign className="w-4 h-4" />{mic.cost}</span>
                <span className="flex items-center gap-1"><Users className="w-4 h-4" />~{mic.audienceSize || "?"}</span>
                <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{mic.stageTime} stage time</span>
              </div>
            </div>
              {mic.otherRules && (
                <div className="text-xs text-gray-500 mt-1">Rules: {mic.otherRules}</div>
              )}
            </div>
            {/* Right: Value, Ratings, Button */}
            <div className="flex flex-col items-end gap-2 min-w-[140px]">
              <div className="flex items-center gap-2">
                <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-semibold">
                  Value: {mic.valueScore || "?"}
                </span>
                <Button size="sm" className="bg-black text-white">Add to Calendar</Button>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <span className="flex items-center gap-1"><Star fill="#ffbe00" className="w-4 h-4 text-[#FFBE00]" />{ratingCounts?.likes ?? 0} community</span>
                <span className="flex items-center gap-1"><CircleUser className="w-4 h-4 text-gray-400" />{userRating ?? "not rated"}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}