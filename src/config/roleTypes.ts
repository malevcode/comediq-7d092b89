export const PERFORMER_ROLES = [
  { value: 'open_mic', label: 'Open Mic Spot' },
  { value: 'showcase', label: 'Showcase Spot (5-10 min)' },
  { value: 'feature', label: 'Feature (15-20 min)' },
  { value: 'headliner', label: 'Headliner (30-45 min)' },
  { value: 'host', label: 'Host/MC' },
  { value: 'closer', label: 'Closer' },
  { value: 'opener', label: 'Opener' },
] as const;

export const CREW_ROLES = [
  { value: 'doorman', label: 'Door Person' },
  { value: 'ticket_sales', label: 'Ticket Sales' },
  { value: 'videographer', label: 'Videographer' },
  { value: 'photographer', label: 'Photographer' },
  { value: 'barker', label: 'Barker/Street Team' },
  { value: 'barker_2', label: 'Barker #2' },
  { value: 'barker_3', label: 'Barker #3' },
  { value: 'sound', label: 'Sound Tech' },
  { value: 'lighting', label: 'Lighting Tech' },
  { value: 'producer_assistant', label: 'Producer Assistant' },
  { value: 'stage_manager', label: 'Stage Manager' },
  { value: 'security', label: 'Security' },
  { value: 'server', label: 'Server/Waiter' },
  { value: 'runner', label: 'Runner' },
  { value: 'custom', label: 'Other (Custom)' },
] as const;

export const SHOW_TYPES = [
  { value: 'open_mic', label: 'Open Mic' },
  { value: 'showcase', label: 'Showcase' },
  { value: 'headliner', label: 'Headliner Show' },
  { value: 'variety', label: 'Variety Show' },
  { value: 'corporate', label: 'Corporate Event' },
  { value: 'competition', label: 'Competition' },
  { value: 'other', label: 'Other' },
] as const;

export const EXPERIENCE_LEVELS = [
  { value: 'beginner', label: 'Beginner (0-1 years)' },
  { value: 'intermediate', label: 'Intermediate (1-3 years)' },
  { value: 'experienced', label: 'Experienced (3-5 years)' },
  { value: 'pro', label: 'Professional (5+ years)' },
] as const;

export const COMPENSATION_TYPES = [
  { value: 'paid', label: 'Paid' },
  { value: 'unpaid', label: 'Unpaid/Exposure' },
  { value: 'door_split', label: 'Door Split' },
  { value: 'bringer', label: 'Bringer Show' },
  { value: 'stage_time', label: 'Stage Time Only' },
  { value: 'tip_jar', label: 'Tips/Pass the Bucket' },
  { value: 'negotiable', label: 'Negotiable' },
] as const;
