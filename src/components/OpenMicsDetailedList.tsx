import { Calendar, Clock, Users, DollarSign, Star, MapPin, CircleUser, CircleAlert, CircleCheckBig } from "lucide-react";
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
            className={
              `flex w-full bg-white border rounded-xl shadow-sm p-4 gap-2 md:gap-6
              ${mic.lastVerified === 'Unverified'
                ? 'border-l-4 border-l-gray-400'
                : 'border-l-4 border-l-green-400'}`
            }
          >
            {/* Left: Name, Location, Date */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-md text-gray-900 w-auto inline-block">{mic.openMic}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                  ${mic.lastVerified === 'Unverified' ? 'border bg-gray-50 text-gray-700' : 'border border-green-200 bg-green-50 text-green-700'}`}>
                  <span className="flex items-center gap-1">
                    {mic.lastVerified === 'Unverified'
                      ? <span className="flex items-center gap-1"><CircleAlert className="w-3 h-3" /> Pending</span>
                      : <span className="flex items-center gap-1"><CircleCheckBig className="w-3 h-3" /> Confirmed</span>
                    }
                  </span>
                </span>
              </div>
              <div className="text-sm text-gray-500">
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3 flex-shrink-0" />{mic.venueName}, {mic.neighborhood}</span>
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3 flex-shrink-0"/>{mic.day != "Daily" ? "Weekly - " + mic.day : mic.day}</span>
              </div>
            </div>
            {/* Mid: Time, Cost, Audience Size, Stage Time, Rules */}
            <div className="flex-1 flex flex-col justify-around min-w-0">
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-700 max-w-lg">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-gray-400 flex-shrink-0" />{mic.startTime} - {mic.latestEndTime}</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-gray-400 flex-shrink-0" />{mic.stageTime}{!/min/i.test(mic.stageTime) && " min"} stage time</span>
                <span className="flex items-center gap-1"><DollarSign className="w-3 h-3 text-gray-400 flex-shrink-0" />{mic.cost}</span>
                <span className="flex items-center gap-1"><Users className="w-3 h-3 text-gray-400 flex-shrink-0" />~{mic.audienceSize || "?"}</span>
              </div>
              {mic.otherRules && (
                <div className="text-xs text-gray-500 mt-1">Rules: {mic.otherRules}</div>
              )}
            </div>
            {/* Right: Value, Ratings, Button */}
            <div className="w-60 flex flex-row justify-between items-around">
              {/* Group 1: Value + Community Score (left column) */}
              <div className="flex flex-col justify-around h-full">
                <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-semibold">
                  Value: {mic.valueScore || "?"}
                </span>
                <span className="flex items-center gap-1 text-xs text-gray-600">
                  <Star fill="#ffbe00" className="w-4 h-4 text-[#FFBE00]" />
                  {ratingCounts?.likes ?? 0} community
                </span>
              </div>
              {/* Group 2: Add to Calendar + User Score (right column) */}
              <div className="flex flex-col justify-around h-full items-end">
                <Button size="sm" className="bg-black text-white">Add to Calendar</Button>
                <span className="flex items-center gap-1 text-xs text-gray-600">
                  <CircleUser className="w-4 h-4 text-gray-400" />
                  {userRating ?? "not rated"}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}