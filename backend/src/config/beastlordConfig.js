export const DEFAULT_CREATURES = {
    'Dragneel': {
        name: 'Icarus, "Sun Stalker"',
        description: 'A divine holy angel from the gates of heaven, born from the light itself that possesses wings and scale armors made of gold that never varnishes. From the east where it rises with the sun, in the highest point of the tallest mountain — the angel’s eyes opens. Humming a tune that matches the core of the sun — It uses a bow with an arrow lighting from its hum, heating up the arrow from its bow.',
        str: 250, dur: 300, spd: 150, int: 100, dex: 100, wis: 100,
        skills: [
            { name: 'Inferno Breath', desc: 'Shoots and breathes fire through his mouth, burning and damaging enemies to ashes.', cost: 23, costType: 'MP', damage: 183, cooldown: 'NONE' },
            { name: 'Lava Slash', desc: 'Our creature slashes with his Lava-scaled claws, enemies would be dealing with deep cuts or even death, in some cases, burns.', cost: 153, costType: 'SP', damage: 875, cooldown: '1 ROUND' },
            { name: 'Magma Burst', desc: 'Fires big chunks of molten rocks, shooting enemies effortlessly in a straight line.', cost: 202, costType: 'MP', damage: 733, cooldown: '2 ROUNDS' },
            { name: 'Magma Swipe', desc: 'Magmascorpius swings his large tail, sometimes trapping enemies under and suffocate them while they burn into ashes.', cost: 788, costType: 'SP', damage: 2100, cooldown: '3 ROUNDS' },
            { name: 'Scorched Earth', desc: "Taking all the heat out from the Earth's crust that creates continuous whirlwinds of flames that traps enemies.", cost: 871, costType: 'MP', damage: 1833, cooldown: '1 TIME USE ONLY', isUltimate: true }
        ]
    },
    'Tempest': {
        name: 'Catton Ying',
        description: 'An ancient cat–demon entity and the twin of Catton Yang. Created to uphold balance between worlds, it embodies kindness and freedom while maintaining a cold, disciplined presence.',
        str: 180, dur: 220, spd: 280, int: 150, dex: 200, wis: 180,
        skills: [
            { name: 'Flowing Aura', desc: 'Releases a blue aura that disrupts enemy rhythm and weakens their spirit.', cost: 50, costType: 'MP', damage: 150, cooldown: '1 ROUND' },
            { name: 'Twin Demon Strike', desc: 'Uses its twin demon tails to strike with supernatural speed and force.', cost: 120, costType: 'SP', damage: 600, cooldown: '1 ROUND' },
            { name: 'Primordial Balance', desc: 'A cold, disciplined strike that ignores a portion of enemy defense.', cost: 200, costType: 'SP', damage: 850, cooldown: '2 ROUNDS' },
            { name: 'Spectral Surge', desc: 'Unleashes the full power of the primordial era in a massive wave of energy.', cost: 500, costType: 'MP', damage: 1800, cooldown: '3 ROUNDS', isUltimate: true }
        ]
    },
    'Pendragon': {
        name: 'Aetheria Vir Nyx',
        description: 'A draconic sovereign forged from void essence and primordial flame, with scaled limbs, razor-edged wings, and horns that channel cosmic energy. She commands both physical might of ancient dragons and arcane power of the void, fighting with tactical precision—though unexpected battlefield shifts or multi-target chaos can still lead to rare miscalculations.',
        str: 220, dur: 180, spd: 320, int: 200, dex: 250, wis: 150,
        skills: [
            { name: 'Abyssal Pulse', desc: 'The core crystal hums with the frequency of a dying star, releasing crushing power.', cost: 80, costType: 'MP', damage: 300, cooldown: '1 ROUND' },
            { name: 'Obsidian Slice', desc: 'Slashes with sleek, obsidian-scaled wings with lethal precision.', cost: 150, costType: 'SP', damage: 750, cooldown: '1 ROUND' },
            { name: 'Reality Domination', desc: 'Bonds the fabric of reality to suppress enemy movements.', cost: 250, costType: 'MP', damage: 500, cooldown: '3 ROUNDS' },
            { name: 'Void Eruption', desc: 'Unleashes the absolute vacuum of the abyss upon the battlefield.', cost: 600, costType: 'MP', damage: 2500, cooldown: '3 ROUNDS', isUltimate: true }
        ]
    },
    'Fritz': {
        name: 'Lucina Carneliel Valencius',
        description: 'An Astral Seraphim who weakens enemies with precise strikes and annihilates them with cosmic magic.',
        str: 150, dur: 200, spd: 200, int: 350, dex: 180, wis: 250,
        skills: [
            { name: 'Celestial Sting', desc: 'A precise strike that weakens the target\'s physical defenses.', cost: 40, costType: 'SP', damage: 200, cooldown: 'NONE' },
            { name: 'Starfall', desc: 'Summons astral energy to rain down upon enemies.', cost: 180, costType: 'MP', damage: 800, cooldown: '1 ROUND' },
            { name: 'Cosmic Singularity', desc: 'Creates a point of infinite density that draws in and crushes foes.', cost: 400, costType: 'MP', damage: 1500, cooldown: '2 ROUNDS' },
            { name: 'Seraphim Ascension', desc: 'Enters a state of divine power, unleashing a final cosmic judgment.', cost: 800, costType: 'MP', damage: 3500, cooldown: '1 TIME USE ONLY', isUltimate: true }
        ]
    },
    'Zoldyck': {
        name: 'Vyperta Serpent',
        description: 'A silver assassin serpent born in silence. Vyperta hunts with patience and flawless precision, striking vital points without error.',
        str: 200, dur: 150, spd: 350, int: 150, dex: 300, wis: 180,
        skills: [
            { name: 'Silent Fang', desc: 'Strikes a vital point with terrifying speed and precision.', cost: 60, costType: 'SP', damage: 450, cooldown: 'NONE' },
            { name: 'Paralyzing Gaze', desc: 'A cold, judgmental look that freezes the enemy in place.', cost: 100, costType: 'MP', damage: 100, cooldown: '2 ROUNDS' },
            { name: 'Silver Coil', desc: 'Constricts the enemy with silver-scaled strength.', cost: 200, costType: 'SP', damage: 900, cooldown: '1 ROUND' },
            { name: 'Executioner\'s Verdict', desc: 'A final, flawless strike that decides the fate of the outsider.', cost: 500, costType: 'SP', damage: 2200, cooldown: '3 ROUNDS', isUltimate: true }
        ]
    },
    'Elric': {
        name: 'Kraeknor',
        description: 'A colossal sea-demon beast of legend, Kraeknor is both guardian and destroyer with scales that shimmer like dark, living water.',
        str: 350, dur: 350, spd: 100, int: 250, dex: 120, wis: 200,
        skills: [
            { name: 'Electrified Tentacle', desc: 'Strikes with massive tentacles charged with abyssal electricity.', cost: 90, costType: 'SP', damage: 500, cooldown: 'NONE' },
            { name: 'Tidal Crush', desc: 'Commands the weight of the deep ocean to crush opponents.', cost: 220, costType: 'MP', damage: 1100, cooldown: '1 ROUND' },
            { name: 'Abyssal Shield', desc: 'Hardens its water-like scales to negate incoming damage.', cost: 150, costType: 'MP', damage: 0, cooldown: '2 ROUNDS' },
            { name: 'Cataclysmic Maelstrom', desc: 'Churns the surrounding seas into a devastating whirlpool of power.', cost: 700, costType: 'MP', damage: 3000, cooldown: '3 ROUNDS', isUltimate: true }
        ]
    },
    'Phantomhive': {
        name: 'Shadowstorm',
        description: 'A colossal, dragon-like raven and Beast Guardian of the House of Phantomhive. A master of thunder and lightning magic.',
        str: 240, dur: 200, spd: 380, int: 220, dex: 220, wis: 180,
        skills: [
            { name: 'Static Shriek', desc: 'A piercing cry that releases bolts of lightning.', cost: 70, costType: 'MP', damage: 350, cooldown: 'NONE' },
            { name: 'Thunder Slash', desc: 'Slices through the air like a living bolt of thunder.', cost: 160, costType: 'SP', damage: 850, cooldown: '1 ROUND' },
            { name: 'Aerial Supercell', desc: 'Creates a massive storm around itself, striking all nearby enemies.', cost: 350, costType: 'MP', damage: 1400, cooldown: '2 ROUNDS' },
            { name: 'Tempest Wrath', desc: 'Unleashes the full fury of a mythical storm in a single devastating strike.', cost: 750, costType: 'MP', damage: 3200, cooldown: '1 TIME USE ONLY', isUltimate: true }
        ]
    },
    'Hellsing': {
        name: 'Nagini',
        description: 'A giant, ancient serpent, approximately 20 to 50 feet long. Its most lethal characteristic is its gaze.',
        str: 260, dur: 240, spd: 220, int: 200, dex: 250, wis: 220,
        skills: [
            { name: 'Venomous Strike', desc: 'Strikes with lethal fangs dripping with ancient venom.', cost: 50, costType: 'SP', damage: 400, cooldown: 'NONE' },
            { name: 'Petrifying Gaze', desc: 'Indirect eye contact that slows and weakens the enemy.', cost: 120, costType: 'MP', damage: 200, cooldown: '2 ROUNDS' },
            { name: 'Emerald Constriction', desc: 'Uses its massive length to crush the life out of prey.', cost: 250, costType: 'SP', damage: 1000, cooldown: '1 ROUND' },
            { name: 'Instant Death Gaze', desc: 'A direct look that spells absolute doom for any mortal.', cost: 900, costType: 'MP', damage: 5000, cooldown: '1 TIME USE ONLY', isUltimate: true }
        ]
    },
    'Von Einzbern': {
        name: 'Drakaroth',
        description: 'Drakaroth is an Undead Frozen Skeleton Dragon, an ancient wyrm reborn through the will of Morgylia Noctfrost. His massive skeletal frame is fused with eternal ice, blue-white frost burning within hollow ribs and eye sockets like a cold star. Silent and vigilant, he does not roar without purpose; his presence alone freezes the air and bends lesser creatures to submission. Bound by blood-oath to the House of von EINZBERN, Drakaroth exists as both guardian and executioner, an immortal sentinel whose frostfire marks the beginning of divine judgment.',
        str: 180, dur: 200, spd: 220, int: 380, dex: 240, wis: 300,
        skills: [
            { name: 'Alchemical Burst', desc: 'Fires a concentrated blast of alchemical energy at the target.', cost: 60, costType: 'MP', damage: 450, cooldown: 'NONE' },
            { name: 'Grail\'s Protection', desc: 'Summons a barrier of holy energy to mitigate damage.', cost: 120, costType: 'MP', damage: 0, cooldown: '2 ROUNDS' },
            { name: 'Spatial Warp', desc: 'Warps the space around enemies to cause internal damage.', cost: 250, costType: 'MP', damage: 1200, cooldown: '1 ROUND' },
            { name: 'Heaven\'s Feel', desc: 'Unleashes the absolute magic of the Einzbern family.', cost: 850, costType: 'MP', damage: 4000, cooldown: '1 TIME USE ONLY', isUltimate: true }
        ]
    }
};

export const FALLBACK_CREATURE = {
    name: 'Mystical Guardian',
    description: 'A powerful beast bound to the House.',
    maxHp: 1000, hp: 1000,
    maxMp: 500, mp: 500,
    maxSp: 500, sp: 500,
    critChance: 5,
    evasionChance: 5,
    atkSpdMult: 1,
    dmgReduction: 0,
    turnOrder: 10,
    iq: 10,
    str: 50, dur: 50, spd: 50, int: 50, dex: 50, wis: 50,
    skills: []
};
