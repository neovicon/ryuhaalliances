import { housesData } from '../../data/housesData';

export default function TerritoryGrid({ tiles, cx, cy, onTileClick, user }) {
  // Grid parameters for full coverage
  const rows = 12;
  const cols = 12;
  const tileSize = 32;
  const spacing = 34;

  // Function to check if a point is inside the octagon
  const isInsideOctagon = (x, y) => {
    const radius = 215; // slightly larger than map radius
    // More accurate octagon check: regular octagon is intersection of 2 squares
    const r = radius;
    const absX = Math.abs(x - cx);
    const absY = Math.abs(y - cy);
    
    // Square check
    if (absX > r || absY > r) return false;
    // Diagonal check (rotated square)
    if (absX + absY > r * 1.414) return false;
    
    return true;
  };

  // Generate grid positions
  const grid = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const tx = cx + (c - cols/2 + 0.5) * spacing;
      const ty = cy + (r - rows/2 + 0.5) * spacing;
      
      if (isInsideOctagon(tx, ty)) {
        // Find existing tile data for this coordinate
        const tileId = r * cols + c;
        const tileData = tiles.find(t => t.tileId === tileId) || { tileId, x: c, y: r };
        grid.push({ ...tileData, tx, ty });
      }
    }
  }

  return (
    <g className="territory-grid">
      {grid.map((tile) => {
        const ownerHouse = housesData.find(h => h.id === tile.ownerHouseId);
        const tileColor = ownerHouse ? ownerHouse.color : 'rgba(255,255,255,0.05)';

        // Calculate octagon points for the tile
        const tRadius = tileSize * 0.5;
        const tPoints = [];
        for (let j = 0; j < 8; j++) {
          const angle = (j * 45 + 22.5) * (Math.PI / 180);
          const px = tRadius * Math.cos(angle);
          const py = tRadius * Math.sin(angle);
          tPoints.push(`${px},${py}`);
        }
        const tPointsStr = tPoints.join(' ');

        return (
          <g 
            key={tile.tileId} 
            transform={`translate(${tile.tx},${tile.ty})`}
            onClick={(e) => {
              e.stopPropagation();
              if (onTileClick) onTileClick(tile);
            }}
            style={{ cursor: 'pointer' }}
            className="rhombus-tile"
          >
            <polygon 
              points={tPointsStr}
              fill={tileColor}
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="0.5"
              style={{ transition: 'all 0.3s ease' }}
            />

            {/* Knights visibility logic */}
            {(user?.role === 'admin' || (ownerHouse && user?.house === ownerHouse.name)) && tile.knights?.length > 0 && (
              <g className="tile-knights">
                {tile.knights.slice(0, 3).map((knight, kIdx) => {
                  const kRadius = 5;
                  const kOffset = (kIdx - (Math.min(tile.knights.length, 3) - 1) / 2) * 12;
                  return (
                    <g key={knight._id || kIdx} transform={`translate(${kOffset}, 0)`}>
                      {knight.photoUrl ? (
                        <defs>
                          <clipPath id={`clip-${tile.tileId}-${kIdx}`}>
                            <circle cx="0" cy="0" r={kRadius} />
                          </clipPath>
                        </defs>
                      ) : null}
                      <circle 
                        cx="0" cy="0" r={kRadius} 
                        fill="rgba(20, 20, 22, 0.9)" 
                        stroke={ownerHouse?.color || 'white'} 
                        strokeWidth="1" 
                      />
                      {knight.photoUrl ? (
                        <image 
                          xlinkHref={knight.photoUrl} 
                          x={-kRadius} y={-kRadius} 
                          width={kRadius * 2} height={kRadius * 2} 
                          clipPath={`url(#clip-${tile.tileId}-${kIdx})`}
                          preserveAspectRatio="xMidYMid slice"
                        />
                      ) : (
                        <text 
                          fontSize="4" 
                          fill="white" 
                          textAnchor="middle" 
                          dy="1.5"
                          style={{ pointerEvents: 'none', fontWeight: 'bold' }}
                        >
                          {knight.displayName?.charAt(0) || knight.username?.charAt(0) || '?'}
                        </text>
                      )}
                    </g>
                  );
                })}
              </g>
            )}
          </g>
        );
      })}
    </g>
  );
}
