
export type MicStatus = 'trial' | 'verified' | 'pending';
export type MicFrequency = 'weekly' | 'one_off' | 'bi_weekly' | '1st_of_month' | '2nd_of_month' | '3rd_of_month' | '4th_of_month' | 'last_of_month' | 'custom';
export type SignupMethod = 'in_person' | 'online' | 'comediq_slots' | 'other';

export const FREQUENCY_LABELS: Record<MicFrequency, string> = {
  weekly: 'Weekly',
  one_off: 'One-Off',
  bi_weekly: 'Bi-Weekly',
  '1st_of_month': '1st of Month',
  '2nd_of_month': '2nd of Month',
  '3rd_of_month': '3rd of Month',
  '4th_of_month': '4th of Month',
  last_of_month: 'Last of Month',
  custom: 'Custom',
};

export const SIGNUP_METHOD_LABELS: Record<SignupMethod, string> = {
  in_person: 'In-Person',
  online: 'Online',
  comediq_slots: 'Comediq Slots!',
  other: 'Other',
};

export interface OpenMic {
  id: string;
  openMic: string;
  day: string;
  startTime: string;
  latestEndTime: string;
  venueName: string;
  borough: string;
  neighborhood: string;
  location: string;
  venueType: string;
  cost: string;
  stageTime: string;
  signUpInstructions: string;
  hosts: string;
  instagramHandle: string;
  lastVerified: string;
  uniqueIdentifier: string;
  city: string;
  signupEnabled: boolean;
  otherRules: string;
  coverImageUrl?: string;
  status: MicStatus;
  frequency: MicFrequency;
  verificationCount: number;
  submissionDate?: string;
  legacyTag?: string;
  creatorId?: string;
  signupMethod?: SignupMethod;
  signupUrl?: string;
  frequencyCustomText?: string;
}
