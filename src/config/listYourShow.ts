// Numbers shown on /list-your-show. Edit here and the page updates.
export const LIST_YOUR_SHOW_STATS = [
  { value: "2,000+", label: "weekly visitors on Comediq.com" },
  { value: "400+", label: "NYC open mics and shows tracked" },
  { value: "$0", label: "to list through 2026. Keep 100% of your ticket sales on your platform." },
] as const;

// Hostnames we accept, matched against the pasted link (subdomains like www. are fine).
export const ACCEPTED_HOSTS = ["eventbrite.com", "posh.vip", "lu.ma", "luma.com", "partiful.com"] as const;

export const isAcceptedLink = (raw: string): boolean => {
  try {
    const u = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    return ACCEPTED_HOSTS.some((h) => u.hostname === h || u.hostname.endsWith(`.${h}`));
  } catch {
    return false;
  }
};
