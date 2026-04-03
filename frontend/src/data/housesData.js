export const housesData = [
  {
    id: 1,
    name: 'Pendragon',
    slug: 'pendragon',
    color: '#b10f2e', // Crimson Red
    logo: '/assets/pendragon.jpeg',
    shortSummary: 'The Noble House of Pendragon, legendary for their strength and leadership. They represent the heart of the alliance.',
    membersCount: 154,
    guardians: ['Vigilant Shield', 'Flame Warden'],
    beasts: ['Crimson Dragon', 'Sun Hawk'],
    knights: ['Sir Alaric', 'Lady Elara'],
    flags: ['Standard of the Rising Sun', 'The Bloody Banner']
  },
  {
    id: 2,
    name: 'Phantomhive',
    slug: 'phantomhive',
    color: '#1e40af', // Royal Blue
    logo: '/assets/phantomhive.jpeg',
    shortSummary: 'The Mysterious House of Phantomhive, known for their strategic mastery and shadows.',
    membersCount: 132,
    guardians: ['Deep Oracle', 'Tide Breaker'],
    beasts: ['Leviathan', 'Storm Petrel'],
    knights: ['Sir Cedric', 'Lady Marina'],
    flags: ['The Endless Blue', 'Anchor of Hope']
  },
  {
    id: 3,
    name: 'Tempest',
    slug: 'tempest',
    color: '#059669', // Emerald Green
    logo: '/assets/tempest.jpeg',
    shortSummary: 'The Swift House of Tempest, masters of storm and growth.',
    membersCount: 145,
    guardians: ['Grove Elder', 'Root Guard'],
    beasts: ['Earth Shaker', 'Forest Spirit'],
    knights: ['Sir Silas', 'Lady Fern'],
    flags: ['The Green Mantle', 'Vine and Thorn']
  },
  {
    id: 4,
    name: 'Zoldyck',
    slug: 'zoldyck',
    color: '#6d28d9', // Royal Purple
    logo: '/assets/zoldyck.jpeg',
    shortSummary: 'The Elite House of Zoldyck, precise and deadly in their execution.',
    membersCount: 118,
    guardians: ['Light Bringer', 'Sun Guard'],
    beasts: ['Phoenix', 'Golden Lion'],
    knights: ['Sir Helios', 'Lady Aurora'],
    flags: ['The Radiant Sun', 'Golden Fleece']
  },
  {
    id: 5,
    name: 'Fritz',
    slug: 'fritz',
    color: '#d97706', // Golden Yellow
    logo: '/assets/fritz.jpeg',
    shortSummary: 'The Resilient House of Fritz, standing firm against any opposition.',
    membersCount: 98,
    guardians: ['Void Walker', 'Rift Mage'],
    beasts: ['Shadow Stalker', 'Night Owl'],
    knights: ['Sir Kael', 'Lady Nyx'],
    flags: ['The Purple Veil', 'Starry Reach']
  },
  {
    id: 6,
    name: 'Elric',
    slug: 'elric',
    color: '#0891b2', // Cyan
    logo: '/assets/elric.jpeg',
    shortSummary: 'The Alchemical House of Elric, seeking knowledge and innovation.',
    membersCount: 110,
    guardians: ['Sky Sentry', 'Cloud Weaver'],
    beasts: ['Griffon', 'Wind Runner'],
    knights: ['Sir Zephyr', 'Lady Skye'],
    flags: ['The Azure Wing', 'Sky Reach']
  },
  {
    id: 7,
    name: 'Hellsing',
    slug: 'hellsing',
    color: '#4b5563', // Steel Gray / Midnight
    logo: '/assets/hellsing.jpeg',
    shortSummary: 'The Guardian House of Hellsing, the ultimate shield of the realm.',
    membersCount: 125,
    guardians: ['Forge Master', 'Spark Guard'],
    beasts: ['Fire Fox', 'Magma Worm'],
    knights: ['Sir Ignis', 'Lady Ember'],
    flags: ['The Burning Torch', 'Iron and Spark']
  },
  {
    id: 8,
    name: 'Von Einzbern',
    slug: 'von-einzbern',
    color: '#92400e', // Amber / Rust
    logo: '/assets/von_einzbern.jpeg',
    shortSummary: 'The Ancient House of Von Einzbern, keepers of tradition and power.',
    membersCount: 160,
    guardians: ['Iron Wall', 'Night Watch'],
    beasts: ['Dire Wolf', 'Obsididog'],
    knights: ['Sir Thorne', 'Lady Raven'],
    flags: ['The Black Shield', 'Unbroken Spirit']
  }
];

export const getHouseById = (id) => housesData.find(h => h.id === Number(id));
