import React, { useEffect, useState, useCallback } from 'react';
import client from '../api/client';
import CreatureStats from '../components/beastlord/CreatureStats';
import Store from '../components/beastlord/Store';
import { getErrorMessage } from '../utils/error';
import '../components/beastlord/Beastlord.css';

export default function Beastlord() {
    const [tab, setTab] = useState('stats');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedHouse, setSelectedHouse] = useState('');

    // Donation States
    const [donation, setDonation] = useState('');
    const [editFunds, setEditFunds] = useState('');
    const [sourceUser, setSourceUser] = useState('');
    const [targetHouseTransfer, setTargetHouseTransfer] = useState(''); // For admin donation
    const [members, setMembers] = useState([]);

    // Item Management States
    const [items, setItems] = useState([]);
    const [newItem, setNewItem] = useState({ name: '', cost: 0, rarity: 'Normal', desc: '', statsText: '', stats: {} });

    const fetchItems = async () => {
        try {
            const res = await client.get('/beastlord/items');
            setItems(res.data.items || []);
        } catch (error) {
            console.error('Error fetching items:', error);
        }
    };

    const fetchData = useCallback(async (houseName = '') => {
        setLoading(true);
        try {
            const url = houseName ? `/beastlord?house=${houseName}` : '/beastlord';
            const res = await client.get(url);
            setData(res.data);
            if (!houseName) setSelectedHouse(res.data.house.name);

            // Fetch members of the house for donation select
            // Note: Donation selection might still be for the USER'S house if they aren't admin
            const membersHouse = houseName || res.data.house.name;
            const membersRes = await client.get(`/users/by-house/${membersHouse}`);
            setMembers(membersRes.data.users || []);

            if (res.data.isAdmin) {
                fetchItems();
            }

        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleHouseChange = (e) => {
        const newHouse = e.target.value;
        setSelectedHouse(newHouse);
        fetchData(newHouse);
    };

    const handleDonation = async (e) => {
        e.preventDefault();
        if (!donation || !sourceUser) return;
        try {
            await client.post('/beastlord/donate', {
                amount: donation,
                sourceUserId: sourceUser,
                targetHouseName: targetHouseTransfer || data.house.name
            });
            alert('Transfer successful!');
            setDonation('');
            fetchData(selectedHouse);
        } catch (err) {
            alert(getErrorMessage(err, 'Transfer failed'));
        }
    };

    const handleUndo = async (transactionId) => {
        if (!confirm('Are you sure you want to undo this purchase?')) return;
        try {
            await client.post(`/beastlord/undo-purchase/${transactionId}`);
            alert('Purchase undone!');
            fetchData(selectedHouse);
        } catch (err) {
            alert(getErrorMessage(err, 'Undo failed'));
        }
    };

    const handlePurchaseSuccess = (newData) => {
        fetchData(selectedHouse); // Just refresh everything to be safe
        alert('Purchase successful!');
    };

    const sanctuaryRef = React.useRef(null);
    const [editStats, setEditStats] = useState({ str: 0, dex: 0, spd: 0, dur: 0, int: 0, wis: 0, baseHp: 500, baseMp: 300, baseSp: 300, baseIq: 50, baseTurnOrder: -50 });
    const [editSkills, setEditSkills] = useState([]);

    useEffect(() => {
        if (data?.creature) {
            setEditStats({
                str: data.creature.str,
                dex: data.creature.dex,
                spd: data.creature.spd,
                dur: data.creature.dur,
                int: data.creature.int,
                wis: data.creature.wis,
                baseHp: data.creature.baseHp || 500,
                baseMp: data.creature.baseMp || 300,
                baseSp: data.creature.baseSp || 300,
                baseIq: data.creature.baseIq || 50,
                baseTurnOrder: data.creature.baseTurnOrder || -50,
            });
            setEditSkills(data.creature.skills || []);
            setEditFunds(data.house.funds);
        }
    }, [data]);

    const handleStatUpdate = async (e) => {
        e.preventDefault();
        try {
            await client.post('/beastlord/update-stats', {
                targetHouseName: selectedHouse,
                stats: editStats
            });
            alert('Attributes updated!');
            fetchData(selectedHouse);
        } catch (err) {
<<<<<<< HEAD
            alert(err.response?.data?.error || 'Update failed');
=======
            alert(getErrorMessage(err, 'Update failed'));
>>>>>>> 82ef53dfdbe59300618071b01792a3debded4356
        }
    };

    const handleSkillUpdate = async (e) => {
        e.preventDefault();
        try {
            await client.post('/beastlord/update-skills', {
                targetHouseName: selectedHouse,
                skills: editSkills
            });
            alert('Skills updated successfully!');
            fetchData(selectedHouse);
        } catch (error) {
            console.error('Error updating skills:', error);
            alert(getErrorMessage(error, 'Failed to update skills'));
        }
    };

    const handleItemManage = async (e) => {
        e.preventDefault();
        try {
            // Simple parsing for stats object from statsText
            // Expecting format: "+10 STR, +5 SPD"
            const stats = {};
            const parts = newItem.statsText.split(',').map(p => p.trim());
            parts.forEach(p => {
                const match = p.match(/([+-]?\d+)\s+(\w+)/);
                if (match) {
                    const val = parseInt(match[1]);
                    const key = match[2].toLowerCase();
                    // Map common aliases
                    const keyMap = { hp: 'maxHp', mp: 'maxMp', sp: 'maxSp', to: 'turnOrder' };
                    stats[keyMap[key] || key] = val;
                }
            });

            await client.post('/beastlord/items', { ...newItem, stats });
            alert('Item saved successfully!');
            setNewItem({ name: '', cost: 0, rarity: 'Normal', desc: '', statsText: '', stats: {} });
            fetchItems();
        } catch (err) {
            alert(getErrorMessage(err, 'Item save failed'));
        }
    };

    const handleItemDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this item?')) return;
        try {
            await client.delete(`/beastlord/items/${id}`);
            alert('Item deleted!');
            fetchItems();
        } catch (err) {
            alert(getErrorMessage(err, 'Delete failed'));
        }
    };

    const handleImageUpload = async (idx, file) => {
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            // 1. Upload the file
            const uploadRes = await client.post('/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            const { key } = uploadRes.data;

            // 2. Get the public URL via the image controller
            const imageRes = await client.get(`/image/${key}`);
            const { url } = imageRes.data;

            handleSingleSkillChange(idx, 'image', url);
        } catch (error) {
            console.error('Error uploading image:', error);
            alert(getErrorMessage(error, 'Failed to upload image. Please try again.'));
        }
    };

    const handleSingleSkillChange = (idx, field, value) => {
        const newSkills = [...editSkills];
        newSkills[idx] = { ...newSkills[idx], [field]: value };
        setEditSkills(newSkills);
    };

    const addSkill = () => {
        setEditSkills([...editSkills, { name: 'New Skill', desc: '', cost: 0, costType: 'NONE', damage: 0, cooldown: '0', isUltimate: false, image: '' }]);
    };

    const removeSkill = (idx) => {
        const newSkills = editSkills.filter((_, i) => i !== idx);
        setEditSkills(newSkills);
    };

    const handleFundsUpdate = async (e) => {
        e.preventDefault();
        try {
            await client.post('/beastlord/update-funds', {
                targetHouseName: selectedHouse,
                funds: editFunds
            });
            alert('House funds updated!');
            fetchData(selectedHouse);
        } catch (err) {
<<<<<<< HEAD
            alert(err.response?.data?.error || 'Update failed');
=======
            alert(getErrorMessage(err, 'Update failed'));
>>>>>>> 82ef53dfdbe59300618071b01792a3debded4356
        }
    };

    const scrollToSanctuary = () => {
        sanctuaryRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const toBoldSerif = (text) => {
        if (!text) return '';
        return text.split('').map(char => {
            const code = char.charCodeAt(0);
            if (code >= 65 && code <= 90) { // A-Z
                return String.fromCodePoint(0x1D400 + (code - 65));
            } else if (code >= 97 && code <= 122) { // a-z
                return String.fromCodePoint(0x1D41A + (code - 97));
            }
            // Exclude digits to match user's example
            return char;
        }).join('');
    };

    const [showPromptModal, setShowPromptModal] = useState(false);
    const [generatedPrompt, setGeneratedPrompt] = useState('');

    const generateBeastPrompt = () => {
        if (!data?.creature) return;
        const c = data.creature;

        let p = `${toBoldSerif('NAME')}: ${toBoldSerif(c.name.toUpperCase())}\n\n`;
        p += `${toBoldSerif('DESCRIPTION')}\n${c.description || "A mystical creature of great potential."}\n\n`;

        p += `${toBoldSerif('SKILLS')}\n\n`;

        const normalSkills = c.skills.filter(s => !s.isUltimate);
        normalSkills.forEach(s => {
            p += `${toBoldSerif(s.name.toUpperCase())} (${s.costType === 'SP' ? 'Physical Attack' : s.costType === 'MP' ? 'Magical Attack' : 'Special Attack'})\n`;
            p += `${s.desc}\n`;
            if (s.cost > 0) p += `${toBoldSerif(s.costType === 'SP' ? 'Stamina Cost' : 'Mana Cost')}: ${s.cost} ${s.costType}\n`;
            p += `${toBoldSerif(s.costType === 'SP' ? 'Physical Damage' : 'Magic Damage')}: ${s.damage}\n`;
            const cdText = s.cooldown && s.cooldown.toLowerCase() !== 'none' ? s.cooldown : 'None';
            p += `${toBoldSerif('Cooldown')}: ${toBoldSerif(cdText.charAt(0))}${cdText.slice(1)}\n\n\n`;
        });

        const ultimateSkills = c.skills.filter(s => s.isUltimate);
        if (ultimateSkills.length > 0) {
            p += `${toBoldSerif('ULTIMATE SKILL')}\n\n`;
            ultimateSkills.forEach(s => {
                p += `${toBoldSerif(s.name.toUpperCase())} (Ultimate – ${s.costType === 'SP' ? 'Physical' : 'Magical'})\n`;
                p += `${s.desc}\n`;
                if (s.cost > 0) p += `${toBoldSerif(s.costType === 'SP' ? 'Stamina Cost' : 'Mana Cost')}: ${s.cost} ${s.costType}\n`;
                p += `${toBoldSerif(s.costType === 'SP' ? 'Physical Damage' : 'Magic Damage')}: ${s.damage}\n`;
                p += `${toBoldSerif('Cooldown')}: ${toBoldSerif(s.cooldown || '1 Time use per Battle')}\n\n\n`;
            });
        }

        p += `${toBoldSerif('STATUS')}:\n\n`;
        p += `${toBoldSerif('Max HP')}: ${c.hp}\n`;
        p += `${toBoldSerif('Max MP')}: ${c.mp}\n`;
        p += `${toBoldSerif('Max SP')}: ${c.sp}\n`;
        p += `${toBoldSerif('Critical')}: ${c.critChance}%\n`;
        p += `${toBoldSerif('Evasion')}: ${c.evasionChance}%\n`;
        p += `${toBoldSerif('Attack Speed')}: ${c.atkSpdMult}x\n`;
        p += `${toBoldSerif('Physical/Magic Damage Reduction')}: ${Math.round((1 - c.dmgReduction) * 100)}%\n`;
        p += `${toBoldSerif('Turn Order')}: ${c.turnOrder}\n`;
        p += `${toBoldSerif('Base HP')}: ${c.baseHp || 500}\n`;
        p += `${toBoldSerif('Base MP')}: ${c.baseMp || 300}\n`;
        p += `${toBoldSerif('Base SP')}: ${c.baseSp || 300}\n`;
        p += `${toBoldSerif('HP Regen Per Turn')}: ${c.hpRegen || 0} HP\n`;
        p += `${toBoldSerif('MP Regen Per Turn')}: ${c.mpRegen || 0} MP\n`;
        p += `${toBoldSerif('SP Regen Per Turn')}: ${c.spRegen || 0} SP\n`;
        p += `${toBoldSerif('Hit Accuracy')}: ${c.hitAccuracy || 0}%\n`;
        p += `${toBoldSerif('Tenacity')}: ${c.tenacity || 0}%\n`;
        p += `${toBoldSerif('Status Resistance')}: ${c.statusResistance || 0}%\n`;
        p += `${toBoldSerif('Base IQ')}: ${c.baseIq || 50}\n`;
        p += `${toBoldSerif('Battle IQ')}: ${c.iq}\n`;
        p += `${toBoldSerif('Decision Making Accuracy')}: ${c.decisionMakingAccuracy || 0}%\n`;
        p += `${toBoldSerif('Behavior')}: ${c.behavior}\n\n`;

        const stats = [
            { k: 'STR', v: c.str },
            { k: 'DUR', v: c.dur },
            { k: 'SPD', v: c.spd },
            { k: 'INT', v: c.int },
            { k: 'DEX', v: c.dex },
            { k: 'WIS', v: c.wis }
        ];

        stats.forEach(s => {
            p += `${toBoldSerif(s.k)} - ${s.v}\n`;
        });

        setGeneratedPrompt(p);
        setShowPromptModal(true);
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(generatedPrompt);
        alert('Prompt copied to clipboard!');
    };

    if (loading && !data) return <div className="p-8 text-center text-white">Initializing Sanctuary Interface...</div>;
    if (!data) return <div className="p-8 text-center text-red-500">Access Denied or System Offline.</div>;


    return (
        <div className="beastlord-page">
            <section className="beastlord-hero">
                <div className="hero-content">
                    <h2>Beastlord</h2>
                    <button className="enter-btn" onClick={scrollToSanctuary}>Enter Sanctuary</button>
                </div>
            </section>

            <div ref={sanctuaryRef} style={{ paddingTop: '2rem' }}>
                <header className="beastlord-header">
                    <h1>Sanctuary</h1>

                    <div className="header-controls">
                        <div className="house-selector-group">
                            <label>Viewing House</label>
                            <select className="house-select" value={selectedHouse} onChange={handleHouseChange}>
                                {data.allHouses?.map(h => (
                                    <option key={h.name} value={h.name}>{h.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="house-funds-display">
                            <span style={{ color: 'var(--text-dim)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>House Funds</span>
                            <span style={{ color: 'var(--gold)', fontWeight: '800', fontSize: '1.2rem' }}>{data.house.funds} CP</span>
                        </div>

                        <div className="tabs">
                            <button
                                className={`tab-btn ${tab === 'stats' ? 'active' : ''}`}
                                onClick={() => setTab('stats')}
                            >
                                Profile
                            </button>
                            {data.isAdmin && (
                                <button
                                    className="tab-btn"
                                    onClick={generateBeastPrompt}
                                    style={{ border: '1px solid var(--primary)', color: 'var(--primary)' }}
                                >
                                    Generate Prompt
                                </button>
                            )}
                            <button
                                className={`tab-btn ${tab === 'store' ? 'active' : ''}`}
                                onClick={() => setTab('store')}
                            >
                                Items
                            </button>
                            {(data.isLord || data.isAdmin) && (
                                <button
                                    className={`tab-btn ${tab === 'admin' ? 'active' : ''}`}
                                    onClick={() => setTab('admin')}
                                >
                                    Management
                                </button>
                            )}
                        </div>
                    </div>
                </header>


                <main className="beastlord-main">
                    {tab === 'stats' && (
                        <div>
                            <CreatureStats creature={data.creature} houseName={data.house.name} />
                        </div>
                    )}

                    {tab === 'store' && (
                        <div>
                            <Store
                                isLord={(data.isLord || data.isAdmin)}
                                houseFunds={data.house.funds}
                                targetHouseName={selectedHouse}
                                onPurchase={handlePurchaseSuccess}
                            />
                        </div>
                    )}


                    {tab === 'admin' && (
                        <div className="admin-panel">
                            <div className="management-grid">
                                {(data.isAdmin || data.isLord) && (
                                    <section className="stat-editor-section bl-card">
                                        <h3 className="section-title">Attribute Modulation</h3>
                                        <form onSubmit={handleStatUpdate} className="donate-form">
                                            <div className="admin-grid-two">
                                                {['str', 'dex', 'spd', 'dur', 'int', 'wis'].map(stat => (
                                                    <div key={stat} className="input-group">
                                                        <label>{stat.toUpperCase()}</label>
                                                        <input
                                                            type="number"
                                                            className="house-select"
                                                            value={editStats[stat]}
                                                            onChange={e => setEditStats({ ...editStats, [stat]: e.target.value })}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                            <button type="submit" className="buy-btn" style={{ width: '100%', marginTop: '1rem' }}>Apply Attributes</button>
                                        </form>
                                    </section>
                                )}

                                {data.isAdmin && (
                                    <>
                                        <section className="stat-editor-section bl-card">
                                            <h3 className="section-title">Base Parameter Modulation</h3>
                                            <form onSubmit={handleStatUpdate} className="donate-form">
                                                <div className="admin-grid-two">
                                                    {[
                                                        { key: 'baseHp', label: 'Base HP' },
                                                        { key: 'baseMp', label: 'Base MP' },
                                                        { key: 'baseSp', label: 'Base SP' },
                                                        { key: 'baseIq', label: 'Base IQ' },
                                                        { key: 'baseTurnOrder', label: 'Base Turn Order' }
                                                    ].map(param => (
                                                        <div key={param.key} className="input-group">
                                                            <label>{param.label}</label>
                                                            <input
                                                                type="number"
                                                                className="house-select"
                                                                value={editStats[param.key]}
                                                                onChange={e => setEditStats({ ...editStats, [param.key]: e.target.value })}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                                <button type="submit" className="buy-btn" style={{ width: '100%', marginTop: '1rem' }}>Apply Base Parameters</button>
                                            </form>
                                        </section>

                                        <section className="stat-editor-section bl-card">
                                            <h3 className="section-title">Funds Modulation</h3>
                                            <form onSubmit={handleFundsUpdate} className="donate-form">
                                                <div className="input-group">
                                                    <label>Total House Funds (CP)</label>
                                                    <input
                                                        type="number"
                                                        className="house-select"
                                                        value={editFunds}
                                                        onChange={e => setEditFunds(e.target.value)}
                                                    />
                                                </div>
                                                <button type="submit" className="buy-btn" style={{ width: '100%' }}>Update Funds</button>
                                            </form>
                                        </section>

                                        <section className="donation-section bl-card">
                                            <h3 className="section-title">Resource Transfer</h3>
                                            <form onSubmit={handleDonation} className="donate-form">
                                                {data.isAdmin && (
                                                    <div className="input-group">
                                                        <label>Target House</label>
                                                        <select
                                                            className="house-select"
                                                            value={targetHouseTransfer}
                                                            onChange={e => setTargetHouseTransfer(e.target.value)}
                                                        >
                                                            <option value="">-- {data.house.name} (Default) --</option>
                                                            {data.allHouses.map(h => (
                                                                <option key={h.name} value={h.name}>{h.name}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                )}

                                                <div className="input-group">
                                                    <label>Source Member</label>
                                                    <select
                                                        className="house-select"
                                                        value={sourceUser}
                                                        onChange={e => setSourceUser(e.target.value)}
                                                        required
                                                    >
                                                        <option value="">-- Select Member --</option>
                                                        {members.map(m => (
                                                            <option key={m._id} value={m._id}>{m.username} ({m.points} CP)</option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div className="input-group">
                                                    <label>CP Amount</label>
                                                    <input
                                                        type="number"
                                                        className="house-select"
                                                        placeholder="Amount"
                                                        value={donation}
                                                        onChange={e => setDonation(e.target.value)}
                                                        min="1"
                                                        required
                                                    />
                                                </div>

                                                <button type="submit" className="buy-btn">Execute Transfer</button>
                                            </form>
                                        </section>

                                        <section className="skill-editor-section bl-card" style={{ gridColumn: '1 / -1' }}>
                                            <div className="section-header-flex">
                                                <h3 className="section-title">Item Matrix Modulation</h3>
                                            </div>
                                            <form onSubmit={handleItemManage} className="donate-form" style={{ marginBottom: '2rem' }}>
                                                <div className="admin-grid-two">
                                                    <div className="input-group">
                                                        <label>Item Name</label>
                                                        <input type="text" className="house-select" value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} required />
                                                    </div>
                                                    <div className="input-group">
                                                        <label>Cost (CP)</label>
                                                        <input type="number" className="house-select" value={newItem.cost} onChange={e => setNewItem({ ...newItem, cost: e.target.value })} required />
                                                    </div>
                                                    <div className="input-group">
                                                        <label>Rarity</label>
                                                        <select className="house-select" value={newItem.rarity} onChange={e => setNewItem({ ...newItem, rarity: e.target.value })}>
                                                            <option value="Normal">Normal</option>
                                                            <option value="Rare">Rare</option>
                                                            <option value="Epic">Epic</option>
                                                            <option value="Legendary">Legendary</option>
                                                            <option value="Mythical">Mythical</option>
                                                        </select>
                                                    </div>
                                                    <div className="input-group">
                                                        <label>Stats (e.g., +10 STR, +5 SPD)</label>
                                                        <input type="text" className="house-select" value={newItem.statsText} onChange={e => setNewItem({ ...newItem, statsText: e.target.value })} placeholder="+10 STR, +5 SPD" />
                                                    </div>
                                                </div>
                                                <div className="input-group" style={{ marginTop: '1rem' }}>
                                                    <label>Description</label>
                                                    <textarea className="house-select" value={newItem.desc} onChange={e => setNewItem({ ...newItem, desc: e.target.value })} rows="2"></textarea>
                                                </div>
                                                <button type="submit" className="buy-btn" style={{ width: '100%', marginTop: '1rem' }}>Create / Update Item</button>
                                            </form>

                                            <div className="logs-table-container">
                                                <table className="logs-table">
                                                    <thead>
                                                        <tr>
                                                            <th>Name</th>
                                                            <th>Rarity</th>
                                                            <th>Cost</th>
                                                            <th>Stats</th>
                                                            <th>Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {items.map(item => (
                                                            <tr key={item._id}>
                                                                <td>{item.name}</td>
                                                                <td>{item.rarity}</td>
                                                                <td>{item.cost} CP</td>
                                                                <td>{item.statsText}</td>
                                                                <td>
                                                                    <button className="undo-btn" style={{ marginRight: '0.5rem' }} onClick={() => setNewItem({ ...item, statsText: item.statsText || '' })}>Edit</button>
                                                                    <button className="undo-btn" style={{ backgroundColor: '#f43f5e' }} onClick={() => handleItemDelete(item._id)}>Delete</button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </section>

                                        <section className="skill-editor-section bl-card" style={{ gridColumn: '1 / -1' }}>
                                            <div className="section-header-flex">
                                                <h3 className="section-title">Technique & Skill Matrix Modulation</h3>
                                                <button className="add-skill-btn" onClick={addSkill}>+ Add New Skill</button>
                                            </div>
                                            <form onSubmit={handleSkillUpdate} className="skills-edit-form">
                                                <div className="skills-edit-grid">
                                                    {editSkills.map((skill, idx) => (
                                                        <div key={idx} className="skill-edit-card">
                                                            <div className="skill-edit-header">
                                                                <h4><i className="bi bi-cpu"></i> Skill #{idx + 1}</h4>
                                                                <button type="button" className="remove-skill-btn" onClick={() => removeSkill(idx)}>
                                                                    <i className="bi bi-trash"></i> DELETE
                                                                </button>
                                                            </div>

                                                            <div className="skill-field-group">
                                                                <div className="input-group">
                                                                    <label><i className="bi bi-tag"></i> Name</label>
                                                                    <input type="text" value={skill.name} onChange={e => handleSingleSkillChange(idx, 'name', e.target.value)} placeholder="Technique Name" />
                                                                </div>

                                                                <div className="input-group">
                                                                    <label><i className="bi bi-image"></i> Image URL / Upload</label>
                                                                    <div className="upload-row">
                                                                        <input type="text" value={skill.image} onChange={e => handleSingleSkillChange(idx, 'image', e.target.value)} placeholder="https://..." />
                                                                        <div className="file-upload-wrapper">
                                                                            <input
                                                                                type="file"
                                                                                accept="image/*"
                                                                                id={`file-${idx}`}
                                                                                onChange={e => handleImageUpload(idx, e.target.files[0])}
                                                                                style={{ display: 'none' }}
                                                                            />
                                                                            <label htmlFor={`file-${idx}`} className="upload-icon-btn" title="Upload Image">
                                                                                <i className="bi bi-cloud-arrow-up"></i>
                                                                            </label>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="field-sub-grid">
                                                                    <div className="input-group">
                                                                        <label><i className="bi bi-lightning"></i> Damage</label>
                                                                        <input type="number" value={skill.damage} onChange={e => handleSingleSkillChange(idx, 'damage', e.target.value)} />
                                                                    </div>
                                                                    <div className="input-group">
                                                                        <label><i className="bi bi-hourglass-split"></i> Cooldown</label>
                                                                        <input type="text" value={skill.cooldown} onChange={e => handleSingleSkillChange(idx, 'cooldown', e.target.value)} />
                                                                    </div>
                                                                </div>

                                                                <div className="field-sub-grid">
                                                                    <div className="input-group">
                                                                        <label><i className="bi bi-gem"></i> Cost</label>
                                                                        <input type="number" value={skill.cost} onChange={e => handleSingleSkillChange(idx, 'cost', e.target.value)} />
                                                                    </div>
                                                                    <div className="input-group">
                                                                        <label><i className="bi bi-droplet"></i> Type</label>
                                                                        <select value={skill.costType} onChange={e => handleSingleSkillChange(idx, 'costType', e.target.value)}>
                                                                            <option value="NONE">NONE</option>
                                                                            <option value="MP">MP</option>
                                                                            <option value="SP">SP</option>
                                                                        </select>
                                                                    </div>
                                                                </div>

                                                                <div className="input-group">
                                                                    <label><i className="bi bi-justify-left"></i> Description</label>
                                                                    <textarea value={skill.desc} onChange={e => handleSingleSkillChange(idx, 'desc', e.target.value)} placeholder="Describe the effect..." />
                                                                </div>

                                                                <div className="checkbox-group" onClick={() => handleSingleSkillChange(idx, 'isUltimate', !skill.isUltimate)}>
                                                                    <input type="checkbox" checked={skill.isUltimate} onChange={e => { }} id={`ult-${idx}`} />
                                                                    <label htmlFor={`ult-${idx}`}>Ultimate Technique (S-Rank)</label>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                                <button type="submit" className="buy-btn" style={{ width: '100%', marginTop: '1.5rem' }}>Commit Skill Matrix Changes</button>
                                            </form>
                                        </section>
                                    </>
                                )}


                                <section className="logs-section bl-card" style={{ gridColumn: '1 / -1' }}>
                                    <h3 className="section-title">Recent Activity</h3>
                                    <div className="logs-table-container">
                                        <table className="logs-table">
                                            <thead>
                                                <tr>
                                                    <th>Type</th>
                                                    <th>Description</th>
                                                    <th>Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {data.transactions?.map(tx => (
                                                    <tr key={tx._id}>
                                                        <td style={{ color: tx.type === 'PURCHASE' ? '#f43f5e' : '#10b981' }}>{tx.type}</td>
                                                        <td>{tx.description}</td>
                                                        <td>
                                                            {data.isAdmin && tx.type === 'PURCHASE' && (
                                                                <button className="undo-btn" onClick={() => handleUndo(tx._id)}>Undo</button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </section>
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {showPromptModal && (
                <div className="prompt-modal-overlay" onClick={() => setShowPromptModal(false)}>
                    <div className="prompt-modal-content" onClick={e => e.stopPropagation()}>
                        <div className="prompt-modal-header">
                            <h3>Beast Prompt</h3>
                            <button className="close-btn" onClick={() => setShowPromptModal(false)}>&times;</button>
                        </div>
                        <div className="prompt-modal-body">
                            <textarea
                                readOnly
                                value={generatedPrompt}
                                className="prompt-textarea"
                            />
                        </div>
                        <div className="prompt-modal-footer">
                            <button className="buy-btn" onClick={copyToClipboard} style={{ width: '100%' }}>Copy to Clipboard</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
