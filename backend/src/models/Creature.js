import mongoose from 'mongoose';

const creatureSchema = new mongoose.Schema({
    house: { type: String, required: true, unique: true, index: true },
    name: { type: String, default: 'Unnamed Creature' },
    description: { type: String, default: '' },
    str: { type: Number, default: 10 },
    dex: { type: Number, default: 10 },
    spd: { type: Number, default: 10 },
    dur: { type: Number, default: 10 },
    int: { type: Number, default: 10 },
    wis: { type: Number, default: 10 },

    // New Base Parameters for custom balancing
    baseHp: { type: Number, default: 500 },
    baseMp: { type: Number, default: 300 },
    baseSp: { type: Number, default: 300 },
    baseIq: { type: Number, default: 50 },
    baseTurnOrder: { type: Number, default: -50 },

    hp: { type: Number, default: 500 },
    maxHp: { type: Number, default: 500 },
    mp: { type: Number, default: 300 },
    maxMp: { type: Number, default: 300 },
    sp: { type: Number, default: 300 },
    maxSp: { type: Number, default: 300 },
    critChance: { type: Number, default: 5 }, // DEX/2 where DEX=10
    evasionChance: { type: Number, default: 1 }, // SPD/10 where SPD=10
    atkSpdMult: { type: Number, default: 1.05 }, // 1 + DEX/200 where DEX=10
    dmgReduction: { type: Number, default: 0.909 }, // 100 / (100 + DUR) where DUR=10
    iq: { type: Number, default: 60 }, // Computed from WIS + baseIq
    turnOrder: { type: Number, default: -40 }, // SPD + baseTurnOrder
    hpRegen: { type: Number, default: 0 },
    mpRegen: { type: Number, default: 0 },
    spRegen: { type: Number, default: 0 },
    hitAccuracy: { type: Number, default: 0 },
    tenacity: { type: Number, default: 0 },
    statusResistance: { type: Number, default: 0 },
    decisionMakingAccuracy: { type: Number, default: 0 },
    behavior: { type: String, default: 'Instinctual - Random, Reactive' },
    skills: [{
        name: String,
        desc: String,
        cost: Number,
        costType: { type: String, enum: ['MP', 'SP', 'NONE'], default: 'NONE' },
        damage: Number,
        cooldown: String,
        isUltimate: { type: Boolean, default: false },
        image: { type: String, default: '' }
    }],
    inventory: [{ type: String }],
}, { timestamps: true });

export default mongoose.model('Creature', creatureSchema);
