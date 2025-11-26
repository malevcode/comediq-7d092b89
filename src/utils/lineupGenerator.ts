import { fetchComediansByIds, ComedianProfile } from '@/api/profiles';

export interface LineupComedian {
  userId: string;
  stageName: string;
  headshot?: string;
  credit?: string;
  bio?: string;
  instagram?: string;
  youtube?: string;
  tiktok?: string;
  twitter?: string;
  website?: string;
  yearsPerforming?: number;
}

/**
 * Fetches comedian profiles formatted for lineup/flier generation
 * @param comedianIds Array of user IDs to fetch
 * @returns Array of comedian data ready for export
 */
export async function fetchLineupData(comedianIds: string[]): Promise<LineupComedian[]> {
  const profiles = await fetchComediansByIds(comedianIds);

  return profiles.map(profile => formatComedianForLineup(profile));
}

/**
 * Formats a comedian profile for lineup display
 */
export function formatComedianForLineup(profile: ComedianProfile): LineupComedian {
  const socialLinks = profile.social_links || [];
  
  const getSocialHandle = (platform: string) => {
    const link = socialLinks.find(l => l.platform === platform);
    return link?.handle;
  };

  return {
    userId: profile.user_id,
    stageName: profile.stage_name || profile.username || 'Comedian',
    headshot: profile.headshot_url,
    credit: profile.credit,
    bio: profile.bio,
    instagram: getSocialHandle('instagram'),
    youtube: getSocialHandle('youtube'),
    tiktok: getSocialHandle('tiktok'),
    twitter: getSocialHandle('twitter'),
    website: getSocialHandle('website'),
    yearsPerforming: profile.years_performing,
  };
}

/**
 * Generates a text representation of a lineup (for copying/sharing)
 */
export function generateLineupText(comedians: LineupComedian[]): string {
  return comedians.map((comedian, index) => {
    let text = `${index + 1}. ${comedian.stageName}`;
    if (comedian.credit) text += ` - ${comedian.credit}`;
    if (comedian.instagram) text += ` (@${comedian.instagram})`;
    return text;
  }).join('\n');
}

/**
 * Exports lineup data as JSON (for show management systems)
 */
export function exportLineupAsJSON(comedians: LineupComedian[]): string {
  return JSON.stringify(comedians, null, 2);
}
