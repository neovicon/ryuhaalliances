export default function HouseNode({ house, x, y, isFocused, onClick }) {
  // Use a ref-based approach or inline style to ensure transform-origin is correct
  const nodeStyle = {
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
    transformOrigin: 'center',
    transform: isFocused ? 'scale(1.2)' : 'none'
  };

  return (
    <g 
      className={`house-node ${isFocused ? 'focused' : ''}`} 
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      style={nodeStyle}
    >
      {/* Interaction Area (Invisible but larger) */}
      <circle cx={x} cy={y} r="30" fill="transparent" />

      {/* Glow Effect */}
      {isFocused && (
        <circle 
          cx={x} cy={y} r="25" 
          fill="none" 
          stroke={house.color} 
          strokeWidth="2" 
          strokeDasharray="4 4"
          className="node-glow"
        >
          <animateTransform 
            attributeName="transform" 
            type="rotate" 
            from={`0 ${x} ${y}`} 
            to={`360 ${x} ${y}`} 
            dur="10s" 
            repeatCount="indefinite" 
          />
        </circle>
      )}

      {/* Main Circle - Clip Path for Image */}
      <defs>
        <clipPath id={`clip-${house.id}`}>
          <circle cx={x} cy={y} r="18" />
        </clipPath>
      </defs>

      <circle 
        cx={x} cy={y} r="20" 
        fill={house.color} 
        stroke="white" 
        strokeWidth="2" 
        filter="url(#glow)"
      />

      {/* House Logo */}
      <image 
        href={house.logo}
        x={x - 18}
        y={y - 18}
        width="36"
        height="36"
        clipPath={`url(#clip-${house.id})`}
        preserveAspectRatio="xMidYMid slice"
        style={{ pointerEvents: 'none' }}
      />
      
      {/* Label */}
      <text 
        x={x} y={y + 40} 
        fill="white" 
        textAnchor="middle" 
        fontSize="12" 
        fontWeight="bold"
        className="hdr"
        style={{ pointerEvents: 'none', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}
      >
        {house.name}
      </text>
    </g>
  );
}
