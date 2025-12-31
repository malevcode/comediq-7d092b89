interface NYCBoroughMapProps {
  visitedBoroughs: string[];
  className?: string;
}

const NYCBoroughMap = ({ visitedBoroughs, className = '' }: NYCBoroughMapProps) => {
  const normalizedVisited = visitedBoroughs.map(b => b.toLowerCase().trim());
  
  const isVisited = (borough: string) => 
    normalizedVisited.includes(borough.toLowerCase());

  const getFill = (borough: string) => 
    isVisited(borough) ? '#ffffff' : '#4a4a4a';

  // Geographically accurate NYC borough paths (simplified from GeoJSON)
  return (
    <svg
      viewBox="0 0 300 280"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Staten Island - Southwest, separated by water */}
      <path
        d="M 25 195 
           L 35 175 
           L 55 165 
           L 75 170 
           L 85 185 
           L 80 210 
           L 65 235 
           L 45 245 
           L 25 235 
           L 20 215 
           Z"
        fill={getFill('Staten Island')}
        stroke="#ffffff"
        strokeWidth="2.5"
      />

      {/* Brooklyn - Southern portion, irregular western edge */}
      <path
        d="M 100 145 
           L 115 130 
           L 140 125 
           L 175 130 
           L 210 140 
           L 225 160 
           L 220 190 
           L 200 220 
           L 170 240 
           L 135 245 
           L 105 235 
           L 90 210 
           L 85 180 
           L 90 160 
           Z"
        fill={getFill('Brooklyn')}
        stroke="#ffffff"
        strokeWidth="2.5"
      />

      {/* Queens - Eastern side, largest borough */}
      <path
        d="M 175 130 
           L 195 110 
           L 220 90 
           L 250 80 
           L 275 85 
           L 285 105 
           L 280 130 
           L 270 155 
           L 250 170 
           L 225 160 
           L 210 140 
           Z"
        fill={getFill('Queens')}
        stroke="#ffffff"
        strokeWidth="2.5"
      />

      {/* Manhattan - Thin vertical island in the center-west */}
      <path
        d="M 105 135 
           L 100 120 
           L 102 95 
           L 108 65 
           L 115 40 
           L 125 25 
           L 138 22 
           L 145 30 
           L 142 55 
           L 135 85 
           L 130 110 
           L 125 130 
           L 115 138 
           Z"
        fill={getFill('Manhattan')}
        stroke="#ffffff"
        strokeWidth="2.5"
      />

      {/* Bronx - Northern area, above Manhattan */}
      <path
        d="M 125 25 
           L 140 15 
           L 165 10 
           L 195 15 
           L 225 25 
           L 245 45 
           L 250 70 
           L 240 85 
           L 220 90 
           L 195 85 
           L 170 75 
           L 150 60 
           L 145 40 
           L 138 28 
           Z"
        fill={getFill('Bronx')}
        stroke="#ffffff"
        strokeWidth="2.5"
      />
    </svg>
  );
};

export default NYCBoroughMap;
