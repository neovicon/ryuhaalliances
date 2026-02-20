import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../store/auth';

/**
 * LabyrinthSpectator Page
 * Allows users to watch a game live without participating.
 */
const LabyrinthSpectator = () => {
    const { gameName } = useParams();
    const socket = useSocket();
    const { user } = useAuth();

    const [status, setStatus] = useState('waiting');
    const [hostName, setHostName] = useState('');
    const [joinerName, setJoinerName] = useState('');
    const [hostPos, setHostPos] = useState(null);
    const [joinerPos, setJoinerPos] = useState(null);
    const [hostTarget, setHostTarget] = useState(null);
    const [joinerTarget, setJoinerTarget] = useState(null);
    const [turn, setTurn] = useState(null);
    const [messages, setMessages] = useState([]);
    const [winner, setWinner] = useState(null);
    const [revealedHostBoard, setRevealedHostBoard] = useState([]);
    const [revealedJoinerBoard, setRevealedJoinerBoard] = useState([]);

    const formatPos = (key) => {
        if (!key) return 'N/A';
        const [r, c] = key.split('-').map(Number);
        return `${String.fromCharCode(65 + c)}${r + 1}`;
    };

    useEffect(() => {
        if (!socket) return;

        socket.emit('spectate_game', { name: gameName });

        socket.on('spectating_started', (data) => {
            setHostName(data.hostName);
            setJoinerName(data.joinerName);
            setHostPos(data.hostPos);
            setJoinerPos(data.joinerPos);
            setHostTarget(data.hostTarget);
            setJoinerTarget(data.joinerTarget);
            setStatus(data.status);
            setTurn(data.turn);
            setMessages(data.log || []);
        });

        socket.on('game_started', (data) => {
            setHostName(data.host);
            setJoinerName(data.joiner);
            setHostPos(data.hostPos);
            setJoinerPos(data.joinerPos);
            setHostTarget(data.hostTarget);
            setJoinerTarget(data.joinerTarget);
            setStatus('playing');
            if (data.log) addLog(data.log, 'system');
        });

        socket.on('game_update', (data) => {
            if (data.player === hostName) setHostPos(data.to);
            else setJoinerPos(data.to);
            if (data.turn) setTurn(data.turn);
            addLog(`${data.player} moved to ${formatPos(data.to.split('-')[0], data.to.split('-')[1])}`, 'info');
        });

        socket.on('turn_update', (data) => {
            setTurn(data.turn);
            if (data.log) addLog(data.log, 'info');
        });

        socket.on('game_over', (data) => {
            setWinner(data.winner);
            setStatus('finished');
            setRevealedHostBoard(data.hostBoard || []);
            setRevealedJoinerBoard(data.joinerBoard || []);
            if (data.log) addLog(data.log, 'system');
        });

        socket.on('error', (msg) => {
            addLog(`Error: ${msg}`, 'error');
        });

        return () => {
            socket.off('spectating_started');
            socket.off('game_started');
            socket.off('game_update');
            socket.off('turn_update');
            socket.off('game_over');
            socket.off('error');
        };
    }, [socket, gameName, hostName]);

    const addLog = (text, type = 'info') => {
        setMessages(prev => [...prev, { text, time: new Date().toLocaleTimeString(), type }]);
    };

    const renderGrid = (isHostPerspective) => {
        const gridCells = [];
        for (let r = 0; r < 6; r++) {
            for (let c = 0; c < 6; c++) {
                gridCells.push({ r, c });
            }
        }

        const wallsToShow = new Set(isHostPerspective ? revealedJoinerBoard : revealedHostBoard);

        return (
            <div className="maze-grid">
                {gridCells.map((cell, i) => {
                    const key = `${cell.r}-${cell.c}`;
                    let className = 'cell';

                    if (isHostPerspective) {
                        if (key === hostPos) className += ' player-node';
                        if (key === joinerPos) className += ' opponent-node';
                    } else {
                        if (key === joinerPos) className += ' player-node';
                        if (key === hostPos) className += ' opponent-node';
                    }

                    return (
                        <div key={i} className={className} style={{ gridRow: cell.r + 1, gridColumn: cell.c + 1, position: 'relative' }}>
                            <span className="cell-coord">{formatPos(key)}</span>
                            <div className="cell-content"></div>
                        </div>
                    );
                })}

                {/* Walls (Only visible if game is finished) */}
                {Array.from(wallsToShow).map(wallKey => {
                    const [type, r, c] = wallKey.split('-');
                    return (
                        <div
                            key={wallKey}
                            className={`${type}-wall wall-active`}
                            style={{ '--r': parseInt(r), '--c': parseInt(c) }}
                        />
                    );
                })}
            </div>
        );
    };

    return (
        <div className="labyrinth-page container mx-auto px-4 py-8">
            <style>{`
                .maze-grid {
                    display: grid;
                    grid-template-columns: repeat(6, var(--cell-size));
                    grid-template-rows: repeat(6, var(--cell-size));
                    position: relative;
                    width: calc(6 * var(--cell-size));
                    height: calc(6 * var(--cell-size));
                    --cell-size: 50px;
                    border: 1px solid rgba(255,255,255,0.05);
                    background: rgba(0,0,0,0.2);
                }
                
                @media (max-width: 600px) {
                    .maze-grid {
                        --cell-size: clamp(35px, 14vw, 60px);
                    }
                    .maze-wrapper {
                        padding: 0 !important;
                    }
                    .player-node { width: 40% !important; height: 40% !important; margin: 30% !important; }
                }

                .cell {
                    border: 1px solid rgba(255, 255, 255, 0.03);
                    position: relative;
                }
                .cell-content { width: 100%; height: 100%; }
                
                .player-node {
                    position: absolute;
                    width: 30%;
                    height: 30%;
                    background: #3b82f6; 
                    border-radius: 50%;
                    margin: 35%;
                    z-index: 10;
                }
                .opponent-node {
                    position: absolute;
                    width: 30%;
                    height: 30%;
                    background: #ef4444; 
                    border-radius: 50%;
                    margin: 35%;
                    z-index: 10;
                }

                .v-wall, .h-wall { 
                    position: absolute; 
                    background: rgba(255, 255, 255, 0.05); 
                    z-index: 20; 
                }
                .v-wall { 
                    width: 4px; 
                    height: var(--cell-size); 
                    left: calc(var(--c) * var(--cell-size) - 2px);
                    top: calc(var(--r) * var(--cell-size));
                }
                .h-wall { 
                    height: 4px; 
                    width: var(--cell-size); 
                    left: calc(var(--c) * var(--cell-size));
                    top: calc(var(--r) * var(--cell-size) - 2px);
                }
                .wall-active { background: #b10f2e !important; }

                .cyber-card {
                    background: #0d0d0d;
                    border: 1px solid #1a1a1a;
                    padding: 1rem;
                    border-radius: 4px;
                }

                .maze-wrapper {
                    padding: 10px;
                    background: #050505;
                    border: 1px solid #111;
                }

                .cell-coord {
                    position: absolute;
                    top: 2px;
                    left: 2px;
                    font-size: 8px;
                    color: rgba(255, 255, 255, 0.1);
                    pointer-events: none;
                }
            `}</style>

            <h1 className="text-3xl font-bold text-center mb-8 uppercase tracking-widest text-white">
                Labyrinth <span className="text-red-600">Spectate</span>
            </h1>

            <div className="flex flex-col lg:flex-row gap-8 justify-center items-start">
                {/* HOST VIEW */}
                <div className="cyber-card">
                    <div className="text-center mb-4 text-blue-400 font-bold tracking-widest uppercase">
                        {hostName || 'HOST'}'S PROGRESS
                    </div>
                    <div className="maze-wrapper">
                        {renderGrid(true)}
                    </div>
                </div>

                {/* SIDEBAR */}
                <div className="w-full lg:w-80 flex flex-col gap-6">
                    <div className="cyber-card">
                        <h2 className="text-xl mb-4 border-b border-gray-700 pb-2">GAME STATUS</h2>
                        <div className="space-y-4">
                            <div>
                                <span className="text-gray-400 text-xs block uppercase">Phase</span>
                                <span className="text-white font-mono">{status.toUpperCase()}</span>
                            </div>
                            <div>
                                <span className="text-gray-400 text-xs block uppercase">Players</span>
                                <span className="text-white font-mono">{hostName || '...'} vs {joinerName || '...'}</span>
                            </div>
                            <div>
                                <span className="text-gray-400 text-xs block uppercase text-center mt-2">Active Turn</span>
                                <div className={`text-center p-2 mt-1 font-mono font-bold border rounded ${turn === hostName ? 'text-blue-400 border-blue-900 bg-blue-900/20' : turn === joinerName ? 'text-pink-400 border-pink-900 bg-pink-900/20' : 'text-gray-500 border-gray-800'}`}>
                                    {turn || 'WAITING...'}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="cyber-card flex-1 flex flex-col min-h-[300px]">
                        <h2 className="text-xl mb-4 border-b border-gray-700 pb-2">LIVE LOG</h2>
                        <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar max-h-64">
                            {messages.map((msg, i) => (
                                <div key={i} className={`text-xs p-2 rounded bg-black/40 border-l-2 ${msg.type === 'system' ? 'border-yellow-500' : msg.type === 'warning' ? 'border-red-500' : 'border-blue-500'}`}>
                                    <span className="text-gray-500 mr-2">[{msg.time}]</span>
                                    <span className="text-gray-200">{msg.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* JOINER VIEW */}
                <div className="cyber-card">
                    <div className="text-center mb-4 text-pink-400 font-bold tracking-widest uppercase">
                        {joinerName || 'JOINER'}'S PROGRESS
                    </div>
                    <div className="maze-wrapper">
                        {renderGrid(false)}
                    </div>
                </div>
            </div>

            <div className="mt-8 text-center">
                <Link to="/labyrinth" className="text-gray-500 hover:text-white transition-colors">
                    ← EXIT WATCH MODE
                </Link>
            </div>
        </div>
    );
};

export default LabyrinthSpectator;
