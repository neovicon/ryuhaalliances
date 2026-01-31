// Rank system - matches backend rank thresholds
// Only 4 ranks: Novice, Regular, Elite, Supreme Elite
export const RANKS = [
  'Novice',
  'Regular',
  'Elite',
  'Supreme Elite',
  'Mythical',
];

// Calculate rank based on points (matches backend)
export function calculateRank(points) {
  if (points >= 2500) return 'Mythical';
  if (points >= 1000) return 'Supreme Elite';
  if (points >= 250) return 'Elite';
  if (points >= 50) return 'Regular';
  return 'Novice';
}

// Rank image component helper - returns image src
// Images are stored in /assets/ as .jpeg files
export function getRankImageSrc(rank) {
  if (!rank) return '/assets/novice.jpeg';

  // Convert rank name to match file names (lowercase, spaces to underscores)
  const rankName = rank.toLowerCase().replace(/\s+/g, '_');
  const ext = rankName === 'mythical' ? 'jpg' : 'jpeg';
  return `/assets/${rankName}.${ext}`;
}

