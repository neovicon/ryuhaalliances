import React from 'react';
import './Beastlord.css';

export default function CreatureStats({ creature }) {
    if (!creature) return <div className="loading">Initializing Core Matrix...</div>;

    const StatBar = ({ label, value, color }) => (
        <div className="stat-row">
            <div className="stat-label">
                <span>{label}</span>
                <span className="stat-value" style={{ fontFamily: 'Orbitron', color }}>{value}</span>
            </div>
            <div className="stat-track">
                <div
                    className="stat-fill"
                    style={{
                        width: '100%',
                        backgroundColor: color,
                        boxShadow: `0 0 15px ${color}88`
                    }}
                />
            </div>
        </div>
    );

    const getCreatureImage = (name) => {
        if (!name) return null;
        // Map names to filenames
        const map = {
            'Catton Ying': 'catton_ying.jpeg',
            'Voidkin Runt': 'voidkin_runt.jpeg',
            'Lucina Carneliel Valencius': 'lucina_carneliel_valicius.jpeg',
            'Magmascorpius': 'magmascorpius.jpeg',
            'Vyperta Serpent': 'vyperta_serpent.jpeg',
            'Kraeknor': 'kraeknor.jpeg',
            'Shadowstorm': 'shadowstorm.jpeg',
            'Nagini': 'nagini.jpeg'
        };
        const filename = map[name] || (name.toLowerCase().replace(/ /g, '_') + '.jpeg');
        return `/assets/beasts/${filename}`;
    };

    return (
        <div className="creature-stats-view">
            <div className="creature-card-header">
                <div className="creature-image-container">
                    <img
                        src={getCreatureImage(creature.name)}
                        alt={creature.name}
                        className="creature-image"
                        onError={(e) => e.target.style.display = 'none'}
                    />
                </div>
                <h2 className="creature-name">{creature.name}</h2>
                <p className="creature-desc">{creature.description || "A mystical creature of great potential."}</p>
            </div>

            <div className="stats-container">
                <div className="stat-block bl-card">
                    <h3 className="section-title">Vitality Matrix</h3>
                    <StatBar label="Health (HP)" value={creature.hp} color="#f43f5e" />
                    <StatBar label="Mana (MP)" value={creature.mp} color="#3b82f6" />
                    <StatBar label="Stamina (SP)" value={creature.sp} color="#10b981" />
                </div>


                <div className="stat-block bl-card">
                    <h3 className="section-title">Core Attributes</h3>
                    <div className="attr-grid">
                        {[
                            { name: 'Strength', val: creature.str, color: '#f87171' },
                            { name: 'Durability', val: creature.dur, color: '#fbbf24' },
                            { name: 'Speed', val: creature.spd, color: '#60a5fa' },
                            { name: 'Intelligence', val: creature.int, color: '#a78bfa' },
                            { name: 'Dexterity', val: creature.dex, color: '#34d399' },
                            { name: 'Wisdom', val: creature.wis, color: '#f472b6' },
                        ].map(attr => (
                            <div key={attr.name} className="attr-item">
                                <span className="attr-name">{attr.name}</span>
                                <span className="attr-val" style={{ color: attr.color }}>{attr.val}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="stat-block bl-card">
                    <h3 className="section-title">Battle Parameters</h3>
                    <div className="misc-stats-grid">
                        <div className="misc-item">
                            <span>Critical</span>
                            <span className="misc-val">{creature.critChance}%</span>
                        </div>
                        <div className="misc-item">
                            <span>Evasion</span>
                            <span className="misc-val">{creature.evasionChance}%</span>
                        </div>
                        <div className="misc-item">
                            <span>Atk Speed</span>
                            <span className="misc-val">{creature.atkSpdMult}x</span>
                        </div>
                        <div className="misc-item">
                            <span>Dmg Reduction</span>
                            <span className="misc-val">{Math.round((1 - creature.dmgReduction) * 100)}%</span>
                        </div>
                        <div className="misc-item">
                            <span>Turn Order</span>
                            <span className="misc-val">{creature.turnOrder}</span>
                        </div>
                        <div className="misc-item">
                            <span>Battle IQ</span>
                            <span className="misc-val">{creature.iq}</span>
                        </div>
                        <div className="misc-item">
                            <span>SP Regen</span>
                            <span className="misc-val">+{creature.spRegen || 0}</span>
                        </div>
                        <div className="misc-item">
                            <span>HP Regen</span>
                            <span className="misc-val">+{creature.hpRegen || 0}</span>
                        </div>
                        <div className="misc-item">
                            <span>MP Regen</span>
                            <span className="misc-val">+{creature.mpRegen || 0}</span>
                        </div>
                        <div className="misc-item">
                            <span>Hit Accuracy</span>
                            <span className="misc-val">{creature.hitAccuracy || 0}%</span>
                        </div>
                        <div className="misc-item">
                            <span>Tenacity</span>
                            <span className="misc-val">{creature.tenacity || 0}</span>
                        </div>
                        <div className="misc-item">
                            <span>Status Res.</span>
                            <span className="misc-val">{creature.statusResistance || 0}%</span>
                        </div>
                        <div className="misc-item">
                            <span>DM Accuracy</span>
                            <span className="misc-val">{creature.decisionMakingAccuracy || 0}%</span>
                        </div>
                    </div>
                </div>

                <div className="stat-block bl-card" style={{ gridColumn: '1 / -1' }}>
                    <h3 className="section-title">Cognitive Behavior Pattern</h3>
                    <div style={{ padding: '1rem', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(148,163,184,0.1)' }}>
                        <div style={{ fontSize: '1.2rem', color: '#60a5fa', marginBottom: '0.5rem', fontFamily: 'Orbitron' }}>
                            {creature.behavior || "Stable - No Anomalies Detected"}
                        </div>
                        <p style={{ color: 'var(--muted)', fontSize: '0.9rem', margin: 0 }}>
                            Tactical execution and decision matrix derived from neural capacity (Battle IQ).
                        </p>
                    </div>
                </div>
            </div>

            {creature.skills && creature.skills.length > 0 && (
                <div className="skills-section" style={{ marginTop: '2rem' }}>
                    <h3 className="section-title">Techniques & Skills</h3>
                    <div className="skills-grid">
                        {creature.skills.map((skill, idx) => (
                            <div key={idx} className={`skill-card ${skill.isUltimate ? 'ultimate' : ''}`}>
                                <div className="skill-header">
                                    {skill.image && (
                                        <div className="skill-icon-container">
                                            <img src={skill.image} alt={skill.name} className="skill-icon" onError={(e) => e.target.style.display = 'none'} />
                                        </div>
                                    )}
                                    <span className="skill-name">{skill.name}</span>
                                </div>
                                <p className="skill-desc">{skill.desc}</p>
                                <div className="skill-meta">
                                    {skill.cost > 0 && (
                                        <div className="meta-item">
                                            {skill.costType}: <span className="meta-val">{skill.cost}</span>
                                        </div>
                                    )}
                                    <div className="meta-item">
                                        DMG: <span className="meta-val">{skill.damage}</span>
                                    </div>
                                    <div className="meta-item">
                                        CD: <span className="meta-val">{skill.cooldown}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
