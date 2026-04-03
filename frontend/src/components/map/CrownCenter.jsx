export default function CrownCenter({ cx, cy }) {
  return (
    <g className="crown-center">
      {/* Crown */}
      <g>
        <circle cx={cx} cy={cy} r="40" fill="rgba(255,215,0,0.15)" stroke="gold" strokeWidth="2" />
        <text 
          x={cx} y={cy + 12} 
          fontSize="45" 
          textAnchor="middle"
          style={{ cursor: 'default' }}
        >
          👑
        </text>
      </g>
    </g>
  );
}
