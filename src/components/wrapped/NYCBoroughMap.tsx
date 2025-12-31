interface NYCBoroughMapProps {
  visitedBoroughs: string[];
  className?: string;
}

const NYCBoroughMap = ({ visitedBoroughs, className = '' }: NYCBoroughMapProps) => {
  const normalizedVisited = visitedBoroughs.map(b => b.toLowerCase());
  
  const getColor = (borough: string) => {
    return normalizedVisited.includes(borough.toLowerCase()) ? '#ffffff' : '#4a4a4a';
  };

  return (
    <svg 
      viewBox="0 0 400 450" 
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Staten Island - Southwest, separate from others */}
      <path
        d="M45 340 L75 325 L95 335 L105 360 L100 390 L85 410 L55 415 L35 395 L30 365 Z"
        fill={getColor('Staten Island')}
        stroke="#6b6b6b"
        strokeWidth="2"
      />
      
      {/* Brooklyn - South, large irregular shape */}
      <path
        d="M140 280 L175 265 L210 270 L250 285 L280 310 L290 350 L275 390 L240 410 L190 415 L150 395 L130 355 L125 315 Z"
        fill={getColor('Brooklyn')}
        stroke="#6b6b6b"
        strokeWidth="2"
      />
      
      {/* Queens - East, largest borough */}
      <path
        d="M220 140 L280 130 L340 145 L375 175 L385 220 L380 270 L355 310 L310 330 L265 320 L235 290 L220 250 L210 200 L215 160 Z"
        fill={getColor('Queens')}
        stroke="#6b6b6b"
        strokeWidth="2"
      />
      
      {/* Manhattan - Center, narrow elongated island */}
      <path
        d="M170 120 L185 110 L200 115 L210 140 L215 180 L212 220 L205 260 L195 285 L180 295 L165 285 L158 250 L155 200 L160 150 Z"
        fill={getColor('Manhattan')}
        stroke="#6b6b6b"
        strokeWidth="2"
      />
      
      {/* Bronx - North, connected to Manhattan */}
      <path
        d="M175 40 L220 30 L270 40 L310 65 L330 100 L325 140 L295 160 L255 165 L220 155 L195 130 L175 100 L168 70 Z"
        fill={getColor('Bronx')}
        stroke="#6b6b6b"
        strokeWidth="2"
      />
    </svg>
  );
};

export default NYCBoroughMap;
