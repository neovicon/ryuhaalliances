import React, { useState } from 'react';
import client from '../../api/client';
import './Beastlord.css';

const CATEGORIES = ['All', 'Normal', 'Rare', 'Epic', 'Legendary'];

export default function Store({ isLord, onPurchase, houseFunds, targetHouseName }) {
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState('All');
    const [search, setSearch] = useState('');
    const [items, setItems] = useState([]);

    const fetchItems = async () => {
        try {
            const res = await client.get('/beastlord/items');
            setItems(res.data.items || []);
        } catch (error) {
            console.error('Error fetching items:', error);
        }
    };

    React.useEffect(() => {
        fetchItems();
    }, []);

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

    const filteredItems = items.filter(item => {
        const matchesCategory = filter === 'All' || item.rarity?.toLowerCase() === filter.toLowerCase();
        const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
            item.desc?.toLowerCase().includes(search.toLowerCase());
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
                        <div className="item-stats">{item.statsText}</div>
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

