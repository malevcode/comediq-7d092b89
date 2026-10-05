import type { GrowthOpportunity } from "@/api/growthOpportunities";

export const featuredBookingOpportunity: GrowthOpportunity = {
  id: "comediq-ny-comedy-competition-2026",
  type: "barking",
  title: "Comediq NY Comedy Festival Competition",
  description:
    "Selected comics will compete for the chance to perform on NY Comedy Festival, with 5 runner up prizes getting spots on Comediq affiliated shows throughout NYC.",
  venue_name: "Brooklyn Art Haus",
  borough: "Brooklyn",
  date: null,
  time: null,
  compensation: null,
  contact_info: "$15 submission fee • 3 person bringer • No drink minimum • Applications close September 9th, 2026",
  external_url: "https://nycomedyfestival.com",
  external_label: "Submit Your Tape",
  image_url: null,
  is_featured: true,
  is_active: true,
  status: "approved",
  submitted_by: null,
  contact_id: null,
  created_at: "2026-08-03T00:00:00.000Z",
  updated_at: "2026-08-03T00:00:00.000Z",
};

export const featuredGrowthOpportunities = [
  featuredBookingOpportunity,
];
