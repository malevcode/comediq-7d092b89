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

  return (
    <svg
      viewBox="0 0 200 180"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Staten Island - Southwest, separate */}
      <path
        d="M 15 140 
           Q 10 130 20 120 
           Q 30 115 40 120 
           Q 50 130 45 145 
           Q 35 155 25 150 
           Q 15 148 15 140 Z"
        fill={getFill('Staten Island')}
        stroke="#ffffff"
        strokeWidth="2"
      />

      {/* Brooklyn - Southern mass */}
      <path
        d="M 70 105 
           Q 60 100 65 85 
           Q 75 75 90 80 
           L 130 85 
           Q 145 90 150 105 
           Q 148 125 135 140 
           Q 115 155 90 150 
           Q 70 145 65 130 
           Q 62 115 70 105 Z"
        fill={getFill('Brooklyn')}
        stroke="#ffffff"
        strokeWidth="2"
      />

      {/* Queens - Eastern area */}
      <path
        d="M 130 85 
           Q 145 75 160 65 
           Q 175 55 185 60 
           Q 195 70 190 85 
           Q 185 100 175 110 
           Q 160 120 150 105 
           Q 145 90 130 85 Z"
        fill={getFill('Queens')}
        stroke="#ffffff"
        strokeWidth="2"
      />

      {/* Manhattan - Thin vertical island */}
      <path
        d="M 75 85 
           Q 70 80 72 70 
           L 78 40 
           Q 80 25 85 20 
           Q 92 18 95 25 
           L 90 70 
           Q 88 82 82 85 
           Q 78 87 75 85 Z"
        fill={getFill('Manhattan')}
        stroke="#ffffff"
        strokeWidth="2"
      />

      {/* Bronx - Northern area */}
      <path
        d="M 85 20 
           Q 95 10 110 8 
           Q 130 10 145 20 
           Q 158 32 155 50 
           Q 150 65 135 70 
           Q 115 72 100 65 
           Q 90 55 88 40 
           Q 86 28 85 20 Z"
        fill={getFill('Bronx')}
        stroke="#ffffff"
        strokeWidth="2"
      />
    </svg>
  );
};

export default NYCBoroughMap;
