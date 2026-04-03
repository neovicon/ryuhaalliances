import { housesData } from '../../data/housesData';
import HouseNode from './HouseNode';
import CrownCenter from './CrownCenter';
import TerritoryGrid from './TerritoryGrid';

export default function OctagonMap({ tiles, zoomLevel, onHouseClick, onTileClick, selectedHouse, user }) {
  // Center of the 600x600 coordinate system
  const cx = 300;
  const cy = 300;
  const radius = 210;

  // Calculate octagon points
  const points = [];
  for (let i = 0; i < 8; i++) {
    const angle = (i * 45 - 22.5) * (Math.PI / 180);
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);
    points.push(`${x},${y}`);
  }
  const pointsStr = points.join(' ');

  // Calculate focus transform
  let transform = 'none';
  if (selectedHouse) {
    const idx = housesData.findIndex(h => h.id === selectedHouse.id);
    const angle = (idx * 45 - 22.5) * (Math.PI / 180);
    const hx = cx + radius * Math.cos(angle);
    const hy = cy + radius * Math.sin(angle);
    // Move map so house is centered
    const tx = cx - hx;
    const ty = cy - hy;
    transform = `translate(${tx * 0.5}, ${ty * 0.5})`; // Partial shift for better context
  }

  return (
    <svg 
      viewBox="0 0 600 600" 
      className="octagon-map"
      style={{ 
        width: '100%', 
        height: 'auto', 
        display: 'block', 
        transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        transform
      }}
    >
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* Background Octagon */}
      <polygon 
        points={pointsStr} 
        fill="rgba(10, 10, 15, 0.9)" 
        stroke="rgba(255, 255, 255, 0.2)" 
        strokeWidth="2"
      />

      {/* Territory Grid */}
      <TerritoryGrid 
        tiles={tiles} 
        cx={cx} 
        cy={cy} 
        onTileClick={onTileClick}
        user={user}
      />

      {/* House Nodes at corners */}
      {housesData.map((house, i) => {
        const angle = (i * 45 - 22.5) * (Math.PI / 180);
        const x = cx + radius * Math.cos(angle);
        const y = cy + radius * Math.sin(angle);
        return (
          <HouseNode 
            key={house.id}
            house={house}
            x={x}
            y={y}
            isFocused={selectedHouse?.id === house.id}
            onClick={() => onHouseClick(house)}
          />
        );
      })}

      {/* Crown Center */}
      <CrownCenter cx={cx} cy={cy} />
    </svg>
  );
}
