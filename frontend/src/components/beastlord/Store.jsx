import React, { useState } from 'react';
import client from '../../api/client';
import './Beastlord.css';

const CATEGORIES = ['All', 'Normal', 'Rare', 'Epic', 'Legendary'];

const ITEMS = [
    {
        category: 'Normal', color: 'gray', items: [
            { name: 'Brown Berry', stats: '+5 SPD', desc: 'Small berry that slightly sharpens reflexes.', cost: 200, rarity: 'normal' },
            { name: 'Crude Meat', stats: '+10 STR', desc: 'Tough, unseasoned meat for basic strength.', cost: 220, rarity: 'normal' },
            { name: 'Crisp Leaf', stats: '+5 DEX', desc: 'Light leaves that improve hand-eye coordination.', cost: 200, rarity: 'normal' },
            { name: 'Clear Water Fruit', stats: '+20 HP', desc: 'Juicy fruit that refreshes vitality.', cost: 250, rarity: 'normal' },
            { name: 'Soft Mushroom', stats: '+10 DUR', desc: 'A damp mushroom that strengthens bones.', cost: 230, rarity: 'normal' },
            { name: 'Sunny Herb', stats: '+5 WIS', desc: 'A fragrant herb that clears the mind.', cost: 210, rarity: 'normal' },
            { name: 'Tiny Nut', stats: '+5 STR', desc: 'Crunchy nut that provides minor strength.', cost: 200, rarity: 'normal' },
            { name: 'Frost Berry', stats: '+5 INT', desc: 'Cold berry that slightly improves focus.', cost: 220, rarity: 'normal' },
            { name: 'Spark Fruit', stats: '+5 SPD, +5 DEX', desc: 'A small fruit that quickens reflexes.', cost: 240, rarity: 'normal' },
            { name: 'Heartfruit', stats: '+50 Base HP', desc: 'Fruit that strengthens the core of your vitality.', cost: 250, rarity: 'normal' },
        ]
    },
    {
        category: 'Rare', color: 'blue', items: [
            { name: 'Silver Berry', stats: '+10 DEX, +5 SPD', desc: 'Rare berry for faster, lighter movements.', cost: 400, rarity: 'rare' },
            { name: "Hunter's Meat", stats: '+25 STR', desc: 'Satisfying meat for seasoned warriors.', cost: 450, rarity: 'rare' },
            { name: 'Azure Leaf', stats: '+15 WIS', desc: 'Enhances perception and intuition.', cost: 420, rarity: 'rare' },
            { name: 'Misty Potion', stats: '+50 HP, +20 SP', desc: 'Restorative drink infused with light magic.', cost: 480, rarity: 'rare' },
            { name: 'Golden Nut', stats: '+10 STR, +10 DUR', desc: 'Shiny nut to boost strength and endurance.', cost: 460, rarity: 'rare' },
            { name: 'Moonflower', stats: '+20 WIS', desc: 'Magical flower that sharpens wisdom.', cost: 500, rarity: 'rare' },
            { name: 'Bright Root', stats: '+10 SPD, +10 DEX', desc: 'Glowing root that improves agility.', cost: 450, rarity: 'rare' },
            { name: 'Spirit Berry', stats: '+15 INT', desc: 'Berry that heightens magical focus.', cost: 420, rarity: 'rare' },
            { name: 'Cloud Fruit', stats: '+50 Base SP', desc: 'Fluffy fruit enhancing spiritual energy.', cost: 470, rarity: 'rare' },
            { name: 'Swift Leaf', stats: '+15 SPD', desc: 'Rare leaf that makes you slightly faster.', cost: 440, rarity: 'rare' },
        ]
    },
    {
        category: 'Epic', color: 'purple', items: [
            { name: 'Redfire Berry', stats: '+20 STR, +10 SPD', desc: 'Ignites physical power with fiery energy.', cost: 750, rarity: 'epic' },
            { name: 'Marine Meat', stats: '+40 DUR', desc: 'Rich meat enhancing endurance.', cost: 800, rarity: 'epic' },
            { name: 'Starlight Leaf', stats: '+20 INT', desc: 'Sparkling leaves for mental focus.', cost: 770, rarity: 'epic' },
            { name: 'Crimson Elixir', stats: '+100 SP', desc: 'Potion radiating arcane strength.', cost: 850, rarity: 'epic' },
            { name: 'Solar Berry', stats: '+25 STR, +15 SPD', desc: 'Fruit imbued with sunlight power.', cost: 780, rarity: 'epic' },
            { name: 'Ironwood Nut', stats: '+50 DUR', desc: 'Hard nut that toughens the body.', cost: 820, rarity: 'epic' },
            { name: 'Mindflower', stats: '+30 INT, +20 WIS', desc: 'Epic flower enhancing mind and wisdom.', cost: 860, rarity: 'epic' },
            { name: 'Brainfruit', stats: '+50 Base IQ', desc: 'Fruit that expands your understanding and cognition.', cost: 880, rarity: 'epic' },
            { name: 'Quickfire Leaf', stats: '+20 DEX, +15 SPD', desc: 'Leaf that boosts reflexes and speed sharply.', cost: 850, rarity: 'epic' },
        ]
    },
    {
        category: 'Legendary', color: 'gold', items: [
            { name: 'Eternal Berry', stats: '+50 INT, +25 WIS', desc: 'Fabled fruit sharpening mind and spirit.', cost: 1500, rarity: 'legendary' },
            { name: "Beastmaster's Meat", stats: '+100 STR, +50 DUR', desc: 'Meat enhancing supreme strength and resilience.', cost: 1800, rarity: 'legendary' },
            { name: 'Celestial Leaf', stats: '+40 INT, +40 WIS', desc: 'Rare leaf elevating all mental faculties.', cost: 1700, rarity: 'legendary' },
            { name: 'Starforged Berry', stats: '+50 STR, +25 SPD', desc: 'Berry of legend empowering body and speed.', cost: 2000, rarity: 'legendary' },
            { name: 'Voidfruit', stats: '+50 INT, +50 WIS', desc: 'Mystical fruit of supreme knowledge.', cost: 2200, rarity: 'legendary' },
            { name: 'Swiftstone', stats: '+50 Base Turn Order', desc: 'Magical stone that lets you act faster in battle.', cost: 2200, rarity: 'legendary' },
        ]
    }
];

export default function Store({ isLord, onPurchase, houseFunds, targetHouseName }) {
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState('All');
    const [search, setSearch] = useState('');

    const handlePurchase = async (item) => {
        if (!isLord) return;
        if (confirm(`Purchase ${item.name} for ${item.cost} CP?`)) {
            setLoading(true);
            try {
                const res = await client.post('/beastlord/purchase',
                    { itemName: item.name, targetHouseName }
                );
                onPurchase(res.data);
            } catch (err) {

                alert(err.response?.data?.error || 'Purchase failed');
            } finally {
                setLoading(false);
            }
        }
    };

    const allItems = ITEMS.flatMap(cat => cat.items);
    const filteredItems = allItems.filter(item => {
        const matchesCategory = filter === 'All' || item.rarity.toLowerCase() === filter.toLowerCase();
        const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
            item.desc.toLowerCase().includes(search.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    return (
        <div className="store-container bl-card">
            <div className="store-header">
                <h2 className="section-title">Items</h2>
                <div className="search-box">
                    <input
                        type="text"
                        placeholder="Search items..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="store-filters">
                {CATEGORIES.map(cat => (
                    <button
                        key={cat}
                        className={`filter-btn ${filter === cat ? 'active' : ''}`}
                        onClick={() => setFilter(cat)}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            <div className="items-grid">
                {filteredItems.map(item => (
                    <div key={item.name} className={`item-card rarity-${item.rarity}`}>
                        <div className="item-header">
                            <span className="item-name">{item.name}</span>
                            <span className="rarity-tag">{item.rarity}</span>
                        </div>
                        <div className="item-stats">{item.stats}</div>
                        <p className="item-desc">{item.desc}</p>

                        <div className="purchase-footer">
                            <span className="item-cost">{item.cost} CP</span>
                            <button
                                disabled={loading || houseFunds < item.cost || !isLord}
                                onClick={() => handlePurchase(item)}
                                className="buy-btn"
                            >
                                {isLord ? 'Buy' : 'Locked'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

