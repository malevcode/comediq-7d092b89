// Common NYC comedy venues for autocomplete suggestions
export const NYC_VENUES = [
  "Comedy Cellar",
  "Gotham Comedy Club",
  "Caroline's on Broadway",
  "Stand Up NY",
  "The Stand NYC",
  "New York Comedy Club",
  "Gramercy Theatre",
  "Upright Citizens Brigade",
  "People's Improv Theater",
  "Eastville Comedy Club",
  "Creek and the Cave",
  "QED: A Place to Show & Tell",
  "92NY",
  "Brooklyn Art Haus",
  "Union Hall",
  "Bell House",
  "Littlefield",
  "Baby's All Right",
  "Knitting Factory Brooklyn",
  "Rough Trade NYC",
  "Bowery Electric",
  "Pete's Candy Store",
  "Branded Saloon",
  "Gutter Bar",
  "Rucola",
  "Lips",
  "Kingsland",
  "Bar Matchless",
  "Bizarre Bar",
  "Tandem Bar",
] as const;

export function suggestVenues(query: string): string[] {
  if (!query.trim()) return NYC_VENUES.slice(0, 5) as unknown as string[];
  const q = query.toLowerCase();
  return (NYC_VENUES as unknown as string[]).filter((v) =>
    v.toLowerCase().includes(q)
  );
}
