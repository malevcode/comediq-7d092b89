export interface Neighborhood {
  name: string;
  borough: string;
}

/**
 * Canonical list of NYC neighborhoods used for SEO landing pages
 * and internal linking. Expand as new mic data arrives.
 */
export const NYC_NEIGHBORHOODS: Neighborhood[] = [
  // Manhattan
  { name: 'East Village', borough: 'Manhattan' },
  { name: 'West Village', borough: 'Manhattan' },
  { name: 'Greenwich Village', borough: 'Manhattan' },
  { name: 'Lower East Side', borough: 'Manhattan' },
  { name: 'Upper West Side', borough: 'Manhattan' },
  { name: 'Upper East Side', borough: 'Manhattan' },
  { name: 'Midtown', borough: 'Manhattan' },
  { name: 'Hell\'s Kitchen', borough: 'Manhattan' },
  { name: 'Chelsea', borough: 'Manhattan' },
  { name: 'SoHo', borough: 'Manhattan' },
  { name: 'Tribeca', borough: 'Manhattan' },
  { name: 'Harlem', borough: 'Manhattan' },
  { name: 'East Harlem', borough: 'Manhattan' },
  { name: 'Washington Heights', borough: 'Manhattan' },
  { name: 'Inwood', borough: 'Manhattan' },
  { name: 'Murray Hill', borough: 'Manhattan' },
  { name: 'Gramercy', borough: 'Manhattan' },
  { name: 'Nolita', borough: 'Manhattan' },
  { name: 'Chinatown', borough: 'Manhattan' },
  { name: 'Financial District', borough: 'Manhattan' },
  { name: 'Flatiron', borough: 'Manhattan' },
  { name: 'Kips Bay', borough: 'Manhattan' },
  { name: 'Morningside Heights', borough: 'Manhattan' },

  // Brooklyn
  { name: 'Williamsburg', borough: 'Brooklyn' },
  { name: 'Bushwick', borough: 'Brooklyn' },
  { name: 'Park Slope', borough: 'Brooklyn' },
  { name: 'Greenpoint', borough: 'Brooklyn' },
  { name: 'Bed-Stuy', borough: 'Brooklyn' },
  { name: 'Crown Heights', borough: 'Brooklyn' },
  { name: 'Prospect Heights', borough: 'Brooklyn' },
  { name: 'DUMBO', borough: 'Brooklyn' },
  { name: 'Brooklyn Heights', borough: 'Brooklyn' },
  { name: 'Cobble Hill', borough: 'Brooklyn' },
  { name: 'Carroll Gardens', borough: 'Brooklyn' },
  { name: 'Boerum Hill', borough: 'Brooklyn' },
  { name: 'Fort Greene', borough: 'Brooklyn' },
  { name: 'Clinton Hill', borough: 'Brooklyn' },
  { name: 'Flatbush', borough: 'Brooklyn' },
  { name: 'Bay Ridge', borough: 'Brooklyn' },
  { name: 'Sunset Park', borough: 'Brooklyn' },
  { name: 'Red Hook', borough: 'Brooklyn' },
  { name: 'Gowanus', borough: 'Brooklyn' },
  { name: 'East New York', borough: 'Brooklyn' },
  { name: 'Ditmas Park', borough: 'Brooklyn' },

  // Queens
  { name: 'Astoria', borough: 'Queens' },
  { name: 'Long Island City', borough: 'Queens' },
  { name: 'Jackson Heights', borough: 'Queens' },
  { name: 'Flushing', borough: 'Queens' },
  { name: 'Sunnyside', borough: 'Queens' },
  { name: 'Woodside', borough: 'Queens' },
  { name: 'Forest Hills', borough: 'Queens' },
  { name: 'Ridgewood', borough: 'Queens' },
  { name: 'Jamaica', borough: 'Queens' },
  { name: 'Bayside', borough: 'Queens' },

  // Bronx
  { name: 'South Bronx', borough: 'Bronx' },
  { name: 'Fordham', borough: 'Bronx' },
  { name: 'Riverdale', borough: 'Bronx' },
  { name: 'Mott Haven', borough: 'Bronx' },
  { name: 'Pelham Bay', borough: 'Bronx' },
  { name: 'Kingsbridge', borough: 'Bronx' },

  // Staten Island
  { name: 'St. George', borough: 'Staten Island' },
  { name: 'Tottenville', borough: 'Staten Island' },
  { name: 'New Dorp', borough: 'Staten Island' },
];
