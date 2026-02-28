import House from '../models/House.js';
import Creature from '../models/Creature.js';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import Item from '../models/Item.js';
import mongoose from 'mongoose';
import { DEFAULT_CREATURES, FALLBACK_CREATURE } from '../config/beastlordConfig.js';

// Initial Seed Data (Used only if DB is empty)
const INITIAL_ITEMS = {
    // NORMAL ITEMS
    'Brown Berry': { cost: 200, statsText: '+5 SPD', rarity: 'Normal', stats: { spd: 5 }, desc: 'Small berry that slightly sharpens reflexes.' },
    'Crude Meat': { cost: 220, statsText: '+10 STR', rarity: 'Normal', stats: { str: 10 }, desc: 'Tough, unseasoned meat for basic strength.' },
    'Crisp Leaf': { cost: 200, statsText: '+5 DEX', rarity: 'Normal', stats: { dex: 5 }, desc: 'Light leaves that improve hand-eye coordination.' },
    'Clear Water Fruit': { cost: 250, statsText: '+20 HP', rarity: 'Normal', stats: { maxHp: 20, hp: 20 }, desc: 'Juicy fruit that refreshes vitality.' },
    'Soft Mushroom': { cost: 230, statsText: '+10 DUR', rarity: 'Normal', stats: { dur: 10 }, desc: 'A damp mushroom that strengthens bones.' },
    'Sunny Herb': { cost: 210, statsText: '+5 WIS', rarity: 'Normal', stats: { wis: 5 }, desc: 'A fragrant herb that clears the mind.' },
    'Tiny Nut': { cost: 200, statsText: '+5 STR', rarity: 'Normal', stats: { str: 5 }, desc: 'Crunchy nut that provides minor strength.' },
    'Frost Berry': { cost: 220, statsText: '+5 INT', rarity: 'Normal', stats: { int: 5 }, desc: 'Cold berry that slightly improves focus.' },
    'Spark Fruit': { cost: 240, statsText: '+5 SPD, +5 DEX', rarity: 'Normal', stats: { spd: 5, dex: 5 }, desc: 'A small fruit that quickens reflexes.' },
    'Heartfruit': { cost: 250, statsText: '+50 Base HP', rarity: 'Normal', stats: { maxHp: 50, hp: 50 }, desc: 'Fruit that strengthens the core of your vitality.' },

    // RARE ITEMS
    'Silver Berry': { cost: 400, statsText: '+10 DEX, +5 SPD', rarity: 'Rare', stats: { dex: 10, spd: 5 }, desc: 'Rare berry for faster, lighter movements.' },
    "Hunter's Meat": { cost: 450, statsText: '+25 STR', rarity: 'Rare', stats: { str: 25 }, desc: 'Satisfying meat for seasoned warriors.' },
    'Azure Leaf': { cost: 420, statsText: '+15 WIS', rarity: 'Rare', stats: { wis: 15 }, desc: 'Enhances perception and intuition.' },
    'Misty Potion': { cost: 480, statsText: '+50 HP, +20 SP', rarity: 'Rare', stats: { maxHp: 50, hp: 50, maxSp: 20, sp: 20 }, desc: 'Restorative drink infused with light magic.' },
    'Golden Nut': { cost: 460, statsText: '+10 STR, +10 DUR', rarity: 'Rare', stats: { str: 10, dur: 10 }, desc: 'Shiny nut to boost strength and endurance.' },
    'Moonflower': { cost: 500, statsText: '+20 WIS', rarity: 'Rare', stats: { wis: 20 }, desc: 'Magical flower that sharpens wisdom.' },
    'Bright Root': { cost: 450, statsText: '+10 SPD, +10 DEX', rarity: 'Rare', stats: { spd: 10, dex: 10 }, desc: 'Glowing root that improves agility.' },
    'Spirit Berry': { cost: 420, statsText: '+15 INT', rarity: 'Rare', stats: { int: 15 }, desc: 'Berry that heightens magical focus.' },
    'Cloud Fruit': { cost: 470, statsText: '+50 Base SP', rarity: 'Rare', stats: { maxSp: 50, sp: 50 }, desc: 'Fluffy fruit enhancing spiritual energy.' },
    'Swift Leaf': { cost: 440, statsText: '+15 SPD', rarity: 'Rare', stats: { spd: 15 }, desc: 'Rare leaf that makes you slightly faster.' },

    // EPIC ITEMS
    'Redfire Berry': { cost: 750, statsText: '+20 STR, +10 SPD', rarity: 'Epic', stats: { str: 20, spd: 10 }, desc: 'Ignites physical power with fiery energy.' },
    'Marine Meat': { cost: 800, statsText: '+40 DUR', rarity: 'Epic', stats: { dur: 40 }, desc: 'Rich meat enhancing endurance.' },
    'Starlight Leaf': { cost: 770, statsText: '+20 INT', rarity: 'Epic', stats: { int: 20 }, desc: 'Sparkling leaves for mental focus.' },
    'Crimson Elixir': { cost: 850, statsText: '+100 SP', rarity: 'Epic', stats: { maxSp: 100, sp: 100 }, desc: 'Potion radiating arcane strength.' },
    'Solar Berry': { cost: 780, statsText: '+25 STR, +15 SPD', rarity: 'Epic', stats: { str: 25, spd: 15 }, desc: 'Fruit imbued with sunlight power.' },
    'Ironwood Nut': { cost: 820, statsText: '+50 DUR', rarity: 'Epic', stats: { dur: 50 }, desc: 'Hard nut that toughens the body.' },
    'Mindflower': { cost: 860, statsText: '+30 INT, +20 WIS', rarity: 'Epic', stats: { int: 30, wis: 20 }, desc: 'Epic flower enhancing mind and wisdom.' },
    'Brainfruit': { cost: 880, statsText: '+50 Base IQ', rarity: 'Epic', stats: { iq: 50 }, desc: 'Fruit that expands your understanding and cognition.' },
    'Quickfire Leaf': { cost: 850, statsText: '+20 DEX, +15 SPD', rarity: 'Epic', stats: { dex: 20, spd: 15 }, desc: 'Leaf that boosts reflexes and speed sharply.' },

    // LEGENDARY ITEMS
    'Eternal Berry': { cost: 1500, statsText: '+50 INT, +25 WIS', rarity: 'Legendary', stats: { int: 50, wis: 25 }, desc: 'Fabled fruit sharpening mind and spirit.' },
    "Beastmaster's Meat": { cost: 1800, statsText: '+100 STR, +50 DUR', rarity: 'Legendary', stats: { str: 100, dur: 50 }, desc: 'Meat enhancing supreme strength and resilience.' },
    'Celestial Leaf': { cost: 1700, statsText: '+40 INT, +40 WIS', rarity: 'Legendary', stats: { int: 40, wis: 40 }, desc: 'Rare leaf elevating all mental faculties.' },
    'Starforged Berry': { cost: 2000, statsText: '+50 STR, +25 SPD', rarity: 'Legendary', stats: { str: 50, spd: 25 }, desc: 'Berry of legend empowering body and speed.' },
    'Voidfruit': { cost: 2200, statsText: '+50 INT, +50 WIS', rarity: 'Legendary', stats: { int: 50, wis: 50 }, desc: 'Mystical fruit of supreme knowledge.' },
    'Swiftstone': { cost: 2200, statsText: '+50 Base Turn Order', rarity: 'Legendary', stats: { turnOrder: 50 }, desc: 'Magical stone that lets you act faster in battle.' },
};

const BASE_HP = 500;
const BASE_MP = 300;
const BASE_SP = 300;

const recalculateStats = (creature) => {
    // Use stored base values or defaults
    const bHp = creature.baseHp || 500;
    const bMp = creature.baseMp || 300;
    const bSp = creature.baseSp || 300;
    const bIq = creature.baseIq || 50;
    const bTo = creature.baseTurnOrder || -50;

    creature.hp = Math.round(bHp * (1 + (creature.dur || 0) / 50));
    creature.mp = Math.round(bMp * (1 + (creature.int || 0) / 50));
    creature.sp = Math.round(bSp * (1 + (creature.dex || 0) / 50));

    creature.maxHp = creature.hp;
    creature.maxMp = creature.mp;
    creature.maxSp = creature.sp;

    // Derived Stats
    const battleIQ = bIq * (1 + (creature.wis || 0) / 100);
    creature.iq = Math.round(battleIQ);

    creature.spRegen = parseFloat(((creature.sp * 0.007) + (creature.dex || 0)).toFixed(2));
    creature.hpRegen = parseFloat(((creature.hp * 0.005) + (creature.dur || 0) * 0.8).toFixed(2));
    creature.mpRegen = parseFloat(((creature.mp * 0.006) + (creature.wis || 0) * 0.6).toFixed(2));

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
    creature.turnOrder = (creature.spd || 0) + bTo;

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
            // Only sync if name/description are genuinely missing — preserve any admin-set values
            const needsSync = !creature.name ||
                creature.name === 'Unnamed Creature' ||
                !creature.description;

            if (needsSync) {
                if (!creature.name || creature.name === 'Unnamed Creature') {
                    creature.name = defaults.name;
                }
                if (!creature.description) {
                    creature.description = defaults.description;
                }

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

export const getItems = async (req, res) => {
    try {
        let items = await Item.find().sort({ cost: 1 });

        // Seed if empty
        if (items.length === 0) {
            const seedData = Object.entries(INITIAL_ITEMS).map(([name, data]) => ({
                name,
                ...data
            }));
            items = await Item.insertMany(seedData);
        }

        res.json({ items });
    } catch (error) {
        console.error('getItems error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

export const manageItem = async (req, res) => {
    try {
        const { id, name, cost, rarity, desc, stats, statsText } = req.body;
        const user = await User.findById(req.user.id);

        if (user.role !== 'admin') {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        let item;
        if (id) {
            item = await Item.findByIdAndUpdate(id, { name, cost, rarity, desc, stats, statsText }, { new: true });
        } else {
            item = new Item({ name, cost, rarity, desc, stats, statsText });
            await item.save();
        }

        res.json({ message: 'Item saved successfully', item });
    } catch (error) {
        console.error('manageItem error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

export const deleteItem = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (user.role !== 'admin') {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        await Item.findByIdAndDelete(req.params.id);
        res.json({ message: 'Item deleted successfully' });
    } catch (error) {
        console.error('deleteItem error:', error);
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
        const allowedStats = ['str', 'dex', 'spd', 'dur', 'int', 'wis', 'baseHp', 'baseMp', 'baseSp', 'baseIq', 'baseTurnOrder'];
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

export const updateCreatureSkills = async (req, res) => {
    try {
        const { targetHouseName, skills } = req.body;
        const user = await User.findById(req.user.id);

        if (user.role !== 'admin') {
            return res.status(403).json({ error: 'Unauthorized: Only admins can modify skills directly' });
        }

        const creature = await Creature.findOne({ house: targetHouseName });
        if (!creature) return res.status(404).json({ error: 'Creature not found' });

        // Validate and update skills
        creature.skills = skills.map(s => ({
            name: s.name,
            desc: s.desc,
            cost: parseInt(s.cost) || 0,
            costType: s.costType || 'NONE',
            damage: parseInt(s.damage) || 0,
            cooldown: s.cooldown || '0',
            isUltimate: !!s.isUltimate,
            image: s.image || ''
        }));

        await creature.save();

        res.json({ message: 'Skills updated successfully', creature });
    } catch (error) {
        console.error('updateCreatureSkills error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

export const updateHouseFunds = async (req, res) => {
    try {
        const { targetHouseName, funds } = req.body;
        const user = await User.findById(req.user.id);

        if (user.role !== 'admin') {
            return res.status(403).json({ error: 'Unauthorized: Only admins can adjust house funds directly' });
        }

        const house = await House.findOne({ name: targetHouseName });
        if (!house) return res.status(404).json({ error: 'House not found' });

        const oldFunds = house.funds;
        house.funds = parseInt(funds);

        if (isNaN(house.funds)) {
            return res.status(400).json({ error: 'Invalid funds amount' });
        }

        await house.save();

        // Log Transaction
        await Transaction.create({
            house: house.name,
            user: user._id,
            type: 'ADJUSTMENT',
            amount: house.funds - oldFunds,
            description: `Manual fund adjustment by Admin from ${oldFunds} CP to ${house.funds} CP`
        });

        res.json({ message: 'House funds updated successfully', funds: house.funds });
    } catch (error) {
        console.error('updateHouseFunds error:', error);
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
        const itemData = await Item.findOne({ name: itemName }).session(session);

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

        const itemData = await Item.findOne({ name: transaction.item }).session(session);
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

export const updateCreatureIdentity = async (req, res) => {
    try {
        const { targetHouseName, name, description } = req.body;
        const user = await User.findById(req.user.id);

        if (user.role !== 'admin') {
            return res.status(403).json({ error: 'Unauthorized: Only admins can update beast identity' });
        }

        if (!name || !name.trim()) {
            return res.status(400).json({ error: 'Beast name cannot be empty' });
        }

        const creature = await Creature.findOne({ house: targetHouseName });
        if (!creature) return res.status(404).json({ error: 'Creature not found' });

        creature.name = name.trim();
        if (description !== undefined) {
            creature.description = description.trim();
        }

        await creature.save();

        res.json({ message: 'Beast identity updated successfully', creature });
    } catch (error) {
        console.error('updateCreatureIdentity error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};


