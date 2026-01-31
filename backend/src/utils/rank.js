// Rank system based on points
// Only 4 ranks: Novice, Regular, Elite, Supreme Elite
export const RANK_THRESHOLDS = {
  'Novice': 0,
  'Regular': 50,
  'Elite': 250,
  'Supreme Elite': 1000,
  'Mythical': 2500,
};

// Calculate rank based on points
export function calculateRank(points) {
  const ranks = Object.keys(RANK_THRESHOLDS).reverse();
  for (const rank of ranks) {
    if (points >= RANK_THRESHOLDS[rank]) {
      return rank;
    }
  }
  return 'Novice';
}

// Get rank image path (frontend will handle the actual image display)
export function getRankImagePath(rank) {
  // Rank images are stored in frontend/assets/ as .jpeg files
  const rankName = (rank || 'Novice').toLowerCase().replace(/\s+/g, '_');
  const ext = rankName === 'mythical' ? 'jpg' : 'jpeg';
  return `/assets/${rankName}.${ext}`;
}

export const RANKS = Object.keys(RANK_THRESHOLDS);

