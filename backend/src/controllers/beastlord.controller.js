import House from '../models/House.js';
import Creature from '../models/Creature.js';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import mongoose from 'mongoose';
import { DEFAULT_CREATURES, FALLBACK_CREATURE } from '../config/beastlordConfig.js';

// Item Data Definition (Preserved)
const ITEMS = {
    // NORMAL ITEMS
    'Brown Berry': { cost: 200, stats: { spd: 5 }, desc: 'Small berry that slightly sharpens reflexes.' },
    'Crude Meat': { cost: 220, stats: { str: 10 }, desc: 'Tough, unseasoned meat for basic strength.' },
    'Crisp Leaf': { cost: 200, stats: { dex: 5 }, desc: 'Light leaves that improve hand-eye coordination.' },
    'Clear Water Fruit': { cost: 250, stats: { maxHp: 20, hp: 20 }, desc: 'Juicy fruit that refreshes vitality.' },
    'Soft Mushroom': { cost: 230, stats: { dur: 10 }, desc: 'A damp mushroom that strengthens bones.' },
    'Sunny Herb': { cost: 210, stats: { wis: 5 }, desc: 'A fragrant herb that clears the mind.' },
    'Tiny Nut': { cost: 200, stats: { str: 5 }, desc: 'Crunchy nut that provides minor strength.' },
    'Frost Berry': { cost: 220, stats: { int: 5 }, desc: 'Cold berry that slightly improves focus.' },
    'Spark Fruit': { cost: 240, stats: { spd: 5, dex: 5 }, desc: 'A small fruit that quickens reflexes.' },
    'Heartfruit': { cost: 250, stats: { maxHp: 50, hp: 50 }, desc: 'Fruit that strengthens the core of your vitality.' },

    // RARE ITEMS
    'Silver Berry': { cost: 400, stats: { dex: 10, spd: 5 }, desc: 'Rare berry for faster, lighter movements.' },
    "Hunter's Meat": { cost: 450, stats: { str: 25 }, desc: 'Satisfying meat for seasoned warriors.' },
    'Azure Leaf': { cost: 420, stats: { wis: 15 }, desc: 'Enhances perception and intuition.' },
    'Misty Potion': { cost: 480, stats: { maxHp: 50, hp: 50, maxSp: 20, sp: 20 }, desc: 'Restorative drink infused with light magic.' },
    'Golden Nut': { cost: 460, stats: { str: 10, dur: 10 }, desc: 'Shiny nut to boost strength and endurance.' },
    'Moonflower': { cost: 500, stats: { wis: 20 }, desc: 'Magical flower that sharpens wisdom.' },
    'Bright Root': { cost: 450, stats: { spd: 10, dex: 10 }, desc: 'Glowing root that improves agility.' },
    'Spirit Berry': { cost: 420, stats: { int: 15 }, desc: 'Berry that heightens magical focus.' },
    'Cloud Fruit': { cost: 470, stats: { maxSp: 50, sp: 50 }, desc: 'Fluffy fruit enhancing spiritual energy.' },
    'Swift Leaf': { cost: 440, stats: { spd: 15 }, desc: 'Rare leaf that makes you slightly faster.' },

    // EPIC ITEMS
    'Redfire Berry': { cost: 750, stats: { str: 20, spd: 10 }, desc: 'Ignites physical power with fiery energy.' },
    'Marine Meat': { cost: 800, stats: { dur: 40 }, desc: 'Rich meat enhancing endurance.' },
    'Starlight Leaf': { cost: 770, stats: { int: 20 }, desc: 'Sparkling leaves for mental focus.' },
    'Crimson Elixir': { cost: 850, stats: { maxSp: 100, sp: 100 }, desc: 'Potion radiating arcane strength.' },
    'Solar Berry': { cost: 780, stats: { str: 25, spd: 15 }, desc: 'Fruit imbued with sunlight power.' },
    'Ironwood Nut': { cost: 820, stats: { dur: 50 }, desc: 'Hard nut that toughens the body.' },
    'Mindflower': { cost: 860, stats: { int: 30, wis: 20 }, desc: 'Epic flower enhancing mind and wisdom.' },
    'Brainfruit': { cost: 880, stats: { iq: 50 }, desc: 'Fruit that expands your understanding and cognition.' },
    'Quickfire Leaf': { cost: 850, stats: { dex: 20, spd: 15 }, desc: 'Leaf that boosts reflexes and speed sharply.' },

    // LEGENDARY ITEMS
    'Eternal Berry': { cost: 1500, stats: { int: 50, wis: 25 }, desc: 'Fabled fruit sharpening mind and spirit.' },
    "Beastmaster's Meat": { cost: 1800, stats: { str: 100, dur: 50 }, desc: 'Meat enhancing supreme strength and resilience.' },
    'Celestial Leaf': { cost: 1700, stats: { int: 40, wis: 40 }, desc: 'Rare leaf elevating all mental faculties.' },
    'Starforged Berry': { cost: 2000, stats: { str: 50, spd: 25 }, desc: 'Berry of legend empowering body and speed.' },
    'Voidfruit': { cost: 2200, stats: { int: 50, wis: 50 }, desc: 'Mystical fruit of supreme knowledge.' },
    'Swiftstone': { cost: 2200, stats: { turnOrder: 50 }, desc: 'Magical stone that lets you act faster in battle.' },
};

const BASE_HP = 500;
const BASE_MP = 300;
const BASE_SP = 300;

const recalculateStats = (creature) => {
    creature.hp = Math.round(BASE_HP * (1 + (creature.dur || 0) / 50));
    creature.mp = Math.round(BASE_MP * (1 + (creature.int || 0) / 50));
    creature.sp = Math.round(BASE_SP * (1 + (creature.dex || 0) / 50));

    creature.maxHp = creature.hp;
    creature.maxMp = creature.mp;
    creature.maxSp = creature.sp;

    // Derived Stats
    const baseIQ = 50;
    const battleIQ = baseIQ * (1 + (creature.wis || 0) / 100);
    creature.iq = Math.round(battleIQ);

    creature.spRegen = parseFloat(((creature.maxSp * 0.007) + (creature.dex || 0)).toFixed(2));
    creature.hitAccuracy = parseFloat((35 + (creature.dex || 0) * 0.3 + (creature.int || 0) * 0.2 + battleIQ * 0.15).toFixed(2));
    creature.tenacity = parseFloat(((creature.wis || 0) * 0.25 + battleIQ * 0.15 + (creature.dur || 0) * 0.1).toFixed(2));
    creature.statusResistance = parseFloat(((creature.dur || 0) * 0.2 + (creature.wis || 0) * 0.3).toFixed(2));
    creature.decisionMakingAccuracy = parseFloat((35 + battleIQ * 0.25).toFixed(2));

    // Behavior
    if (battleIQ <= 80) creature.behavior = "Instinctual - Random, Reactive";
    else if (battleIQ <= 150) creature.behavior = "Trained - Basic Logic, Poor Timing";
    else if (battleIQ <= 250) creature.behavior = "Tactical - Proper Rotations, Mistake still occur";
    else if (battleIQ <= 350) creature.behavior = "Elite - Predictive Play, Cooldown Discipline";
    else if (battleIQ <= 450) creature.behavior = "Genius - Multi-turn planning, Target Mastery";
    else if (battleIQ <= 550) creature.behavior = "Mythic Mind - Near-Perfect Execution";
    else creature.behavior = "Transcendent - Feels unfair but still beatable";

    creature.evasionChance = (creature.spd || 0) / 10;
    creature.critChance = (creature.dex || 0) / 2;
    creature.atkSpdMult = parseFloat((1 + (creature.dex || 0) / 200).toFixed(3));
    creature.dmgReduction = parseFloat((100 / (100 + (creature.dur || 0))).toFixed(3));
    creature.turnOrder = (creature.spd || 0) - 50;

    return creature;
};


export const getHouseDetails = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        let house = await House.findOne({ name: user.house });
        const targetHouseName = req.query.house || user.house;
        house = await House.findOne({ name: targetHouseName });
        if (!house) return res.status(404).json({ error: 'House not found' });

        let creature = await Creature.findOne({ house: targetHouseName });
        // Case-insensitive lookup for defaults
        const houseKey = Object.keys(DEFAULT_CREATURES).find(k => k.toLowerCase() === targetHouseName.toLowerCase()) || targetHouseName;
        const defaults = DEFAULT_CREATURES[houseKey] || FALLBACK_CREATURE;

        if (!creature) {
            creature = new Creature({ house: targetHouseName, ...defaults });
        } else {
            // Force sync if name is "Unnamed Creature" or if it doesn't match the config name for this house
            // This ensures existing creatures with generic names get updated to their real species.
            const needsSync = !creature.name ||
                creature.name === 'Unnamed Creature' ||
                (defaults.name !== 'Unnamed Creature' && creature.name !== defaults.name) ||
                !creature.description;

            if (needsSync) {
                creature.name = defaults.name;
                creature.description = defaults.description;

                // Only sync skills if none exist or if we want to ensure basic skills are present
                if (creature.skills.length === 0 && defaults.skills) {
                    creature.skills = defaults.skills;
                }

                // Sync core stats only if they are at uninitialized base values
                if (creature.str === 10 && creature.dur === 10) {
                    creature.str = defaults.str;
                    creature.dur = defaults.dur;
                    creature.spd = defaults.spd;
                    creature.int = defaults.int;
                    creature.dex = defaults.dex;
                    creature.wis = defaults.wis;
                }
            }
        }


        // Always recalculate stats on view to ensure formulas are applied
        recalculateStats(creature);
        if (creature.isModified()) {
            await creature.save();
        }

        const transactions = await Transaction.find({ house: targetHouseName }).sort({ createdAt: -1 }).limit(20);

        const configuredHouseNames = Object.keys(DEFAULT_CREATURES);
        const allHouses = await House.find({ name: { $in: configuredHouseNames } }, 'name');

        res.json({
            house: {
                name: house.name,
                funds: house.funds,
            },
            creature,
            transactions,
            allHouses,
            isLord: user.memberStatus === 'Lord of the House' && user.house === targetHouseName,
            isAdmin: user.role === 'admin'
        });


    } catch (error) {
        console.error('getHouseDetails error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

export const updateCreatureStats = async (req, res) => {
    try {
        const { targetHouseName, stats } = req.body;
        const user = await User.findById(req.user.id);

        if (user.role !== 'admin' && user.memberStatus !== 'Lord of the House') {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const creature = await Creature.findOne({ house: targetHouseName });
        if (!creature) return res.status(404).json({ error: 'Creature not found' });

        // Update core stats
        const allowedStats = ['str', 'dex', 'spd', 'dur', 'int', 'wis'];
        for (const stat of allowedStats) {
            if (stats[stat] !== undefined) {
                creature[stat] = parseInt(stats[stat]);
            }
        }

        recalculateStats(creature);
        await creature.save();

        res.json({ message: 'Stats updated successfully', creature });
    } catch (error) {
        console.error('updateCreatureStats error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

export const donate = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { amount, sourceUserId, targetHouseName } = req.body;
        const cpAmount = parseInt(amount);

        if (isNaN(cpAmount) || cpAmount <= 0) {
            throw new Error('Invalid donation amount');
        }

        const requester = await User.findById(req.user.id).session(session);
        if (!requester) throw new Error('Requester not found');

        // Permissions Check
        const isAdmin = requester.role === 'admin';
        const isLord = requester.memberStatus === 'Lord of the House';
        const isDonatingSelf = !sourceUserId || sourceUserId === requester._id.toString();

        if (!isAdmin && !isLord && !isDonatingSelf) {
            throw new Error('You can only donate your own points. Only House Lords or Admins can transfer points from others.');
        }

        const sourceUser = await User.findById(sourceUserId || requester._id).session(session);
        if (!sourceUser) throw new Error('Source member not found');

        if (!isAdmin && !isDonatingSelf && sourceUser.house !== requester.house) {
            throw new Error('House Lords can only use members of their own house');
        }

        if (sourceUser.points < cpAmount) {
            throw new Error(`Member ${sourceUser.username} has insufficient funds (${sourceUser.points} CP)`);
        }

        // Determine Target House
        const finalTargetHouseName = ((isAdmin || isDonatingSelf) && targetHouseName) ? targetHouseName : requester.house;
        const house = await House.findOne({ name: finalTargetHouseName }).session(session);
        if (!house) throw new Error('Target house not found');

        // Execution
        sourceUser.points -= cpAmount;
        await sourceUser.save({ session });

        house.funds = (house.funds || 0) + cpAmount;
        await house.save({ session });

        // Log Transaction
        await Transaction.create([{
            house: house.name,
            user: requester._id, // Log who performed the action
            type: 'DONATION',
            amount: cpAmount,
            description: `Transferred ${cpAmount} CP from ${sourceUser.username} to ${house.name} Funds`
        }], { session });

        await session.commitTransaction();
        res.json({
            message: 'Donation successful',
            newFunds: house.funds,
            sourceUserPoints: sourceUser.points,
            sourceUserId: sourceUser._id
        });
    } catch (error) {
        await session.abortTransaction();
        res.status(400).json({ error: error.message });
    } finally {
        session.endSession();
    }
};

export const purchaseItem = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { itemName } = req.body;
        const itemData = ITEMS[itemName];

        if (!itemData) throw new Error('Invalid item');

        const user = await User.findById(req.user.id).session(session);
        if (!user) throw new Error('User not found');

        if (user.memberStatus !== 'Lord of the House' && user.role !== 'admin') {
            throw new Error('Only House Lords or Admins can purchase items');
        }

        const targetHouseName = (user.role === 'admin' && req.body.targetHouseName) ? req.body.targetHouseName : user.house;
        const house = await House.findOne({ name: targetHouseName }).session(session);
        if (!house) throw new Error('House not found');

        if (house.funds < itemData.cost) {
            throw new Error('Insufficient House Funds');
        }

        let creature = await Creature.findOne({ house: targetHouseName }).session(session);
        if (!creature) {
            const defaults = DEFAULT_CREATURES[targetHouseName] || FALLBACK_CREATURE;
            creature = new Creature({ house: targetHouseName, ...defaults });
        }


        // Deduct Funds
        house.funds -= itemData.cost;
        await house.save({ session });

        // Apply Stats
        if (itemData.stats) {
            for (const [stat, value] of Object.entries(itemData.stats)) {
                if (creature[stat] !== undefined) {
                    creature[stat] += value;
                }
            }
        }

        // Recalculate derived stats
        recalculateStats(creature);


        creature.inventory.push(itemName);
        await creature.save({ session });


        // Log Transaction
        await Transaction.create([{
            house: house.name,
            user: user._id,
            type: 'PURCHASE',
            amount: itemData.cost,
            item: itemName,
            description: `Purchased ${itemName}`
        }], { session });

        await session.commitTransaction();
        res.json({ message: 'Purchase successful', newFunds: house.funds, creature });
    } catch (error) {
        await session.abortTransaction();
        res.status(400).json({ error: error.message });
    } finally {
        session.endSession();
    }
};

export const undoPurchase = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { transactionId } = req.params;
        const user = await User.findById(req.user.id).session(session);

        if (!user || user.role !== 'admin') {
            throw new Error('Only admins can undo purchases');
        }

        const transaction = await Transaction.findById(transactionId).session(session);
        if (!transaction || transaction.type !== 'PURCHASE') {
            throw new Error('Valid purchase transaction not found');
        }

        const house = await House.findOne({ name: transaction.house }).session(session);
        if (!house) throw new Error('House not found');

        const creature = await Creature.findOne({ house: transaction.house }).session(session);
        if (!creature) throw new Error('Creature not found');

        const itemData = ITEMS[transaction.item];
        if (!itemData) throw new Error('Item data not found');

        // Refund House Funds
        house.funds += transaction.amount;
        await house.save({ session });

        // Revert Stats
        if (itemData.stats) {
            for (const [stat, value] of Object.entries(itemData.stats)) {
                if (creature[stat] !== undefined) {
                    creature[stat] -= value;
                }
            }
        }

        // Recalculate derived stats
        recalculateStats(creature);

        // Remove item from inventory (just one instance)
        const itemIdx = creature.inventory.indexOf(transaction.item);
        if (itemIdx > -1) {
            creature.inventory.splice(itemIdx, 1);
        }

        await creature.save({ session });

        // Delete the transaction
        await Transaction.findByIdAndDelete(transactionId).session(session);

        await session.commitTransaction();
        res.json({ message: 'Purchase undone successfully', newFunds: house.funds, creature });
    } catch (error) {
        await session.abortTransaction();
        res.status(400).json({ error: error.message });
    } finally {
        session.endSession();
    }
};

