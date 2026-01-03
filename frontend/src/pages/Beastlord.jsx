import React, { useEffect, useState, useCallback } from 'react';
import client from '../api/client';
import CreatureStats from '../components/beastlord/CreatureStats';
import Store from '../components/beastlord/Store';
import '../components/beastlord/Beastlord.css';

export default function Beastlord() {
    const [tab, setTab] = useState('stats');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedHouse, setSelectedHouse] = useState('');

    // Donation States
    const [donation, setDonation] = useState('');
    const [sourceUser, setSourceUser] = useState('');
    const [targetHouseTransfer, setTargetHouseTransfer] = useState(''); // For admin donation
    const [members, setMembers] = useState([]);

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
            alert(err.response?.data?.error || 'Transfer failed');
        }
    };

    const handleUndo = async (transactionId) => {
        if (!confirm('Are you sure you want to undo this purchase?')) return;
        try {
            await client.post(`/beastlord/undo-purchase/${transactionId}`);
            alert('Purchase undone!');
            fetchData(selectedHouse);
        } catch (err) {
            alert(err.response?.data?.error || 'Undo failed');
        }
    };

    const handlePurchaseSuccess = (newData) => {
        fetchData(selectedHouse); // Just refresh everything to be safe
        alert('Purchase successful!');
    };

    const sanctuaryRef = React.useRef(null);
    const [editStats, setEditStats] = useState({ str: 0, dex: 0, spd: 0, dur: 0, int: 0, wis: 0 });

    useEffect(() => {
        if (data?.creature) {
            setEditStats({
                str: data.creature.str,
                dex: data.creature.dex,
                spd: data.creature.spd,
                dur: data.creature.dur,
                int: data.creature.int,
                wis: data.creature.wis,
            });
        }
    }, [data]);

    const handleStatUpdate = async (e) => {
        e.preventDefault();
        try {
            await client.post('/beastlord/update-stats', {
                targetHouseName: selectedHouse,
                stats: editStats
            });
            alert('Stats updated!');
            fetchData(selectedHouse);
        } catch (err) {
            alert(err.response?.data?.error || 'Update failed');
        }
    };

    const scrollToSanctuary = () => {
        sanctuaryRef.current?.scrollIntoView({ behavior: 'smooth' });
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
                            <CreatureStats creature={data.creature} />
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
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                                {Object.keys(editStats).map(stat => (
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
        </div>
    );
}


