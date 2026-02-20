import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../store/auth';

const Labyrinth = () => {
    const socket = useSocket();
    const { user } = useAuth();

    // Game Setup State
    const [wallCount, setWallCount] = useState(0);
    const [mode, setMode] = useState('wall');
    const [startCell, setStartCell] = useState(null);
    const [endCell, setEndCell] = useState(null);
    const [walls, setWalls] = useState(new Set()); // Stores "v-r-c" or "h-r-c"

    // Online State
    const [isOnlineMode, setIsOnlineMode] = useState(false);
    const [gameStatus, setGameStatus] = useState('setup'); // setup, lobby, playing, finished
    const [gameName, setGameName] = useState('');
    const [gamePassword, setGamePassword] = useState('');
    const [messages, setMessages] = useState([]);
    const [chatInput, setChatInput] = useState('');
    const [opponentData, setOpponentData] = useState(null); // { start, end }
    const [turn, setTurn] = useState(null);
    const [myPosition, setMyPosition] = useState(null);
    const [opponentPosition, setOpponentPosition] = useState(null); // To show opponent's move
    const [winner, setWinner] = useState(null);

    // Revealed Walls on Game Over
    const [revealedHostBoard, setRevealedHostBoard] = useState([]);
    const [revealedJoinerBoard, setRevealedJoinerBoard] = useState([]);

    // Auto-scroll for logs
    const logEndRef = useRef(null);

    useEffect(() => {
        logEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);



    // Sound Effects (Optional, can be added later)
    // const playSound = (type) => { ... }

    useEffect(() => {
        // Attempt Reconnection if stored in localStorage
        const savedGame = localStorage.getItem('labyrinth_active_game');
        if (savedGame && socket && user) {
            const { name, password } = JSON.parse(savedGame);
            setGameName(name);
            setGamePassword(password);
            socket.emit('reconnect_game', { name, password, username: user.username });
        }
    }, [socket, user]);

    useEffect(() => {
        if (!socket) return;

        socket.on('error', (msg) => {
            console.error("Socket Error:", msg);
            alert(`ERROR: ${msg}`);
            addLog(`ERROR: ${msg}`, 'error');
            // If it's a "Game not found" error on reconnection, clear storage
            if (msg.includes('not found')) {
                localStorage.removeItem('labyrinth_active_game');
                setIsOnlineMode(false);
                setGameStatus('setup');
            }
        });

        socket.on('game_created', ({ name }) => {
            setGameStatus('waiting');
            localStorage.setItem('labyrinth_active_game', JSON.stringify({ name, password: gamePassword }));
            addLog(`System initialized. Game "${name}" created. Waiting for opponent connection...`, 'system');
        });

        socket.on('game_started', ({ host, joiner, turn, log, name, password }) => {
            setGameStatus('playing');
            setTurn(turn);
            if (log) addLog(log, 'system');
            else addLog(`Match initiated: ${host} vs ${joiner}`, 'system');
            // setMyPosition(startCell); // Removed: we start at opponent's start now

            // Joiner also needs to save to localStorage for reconnection
            if (name && password) {
                localStorage.setItem('labyrinth_active_game', JSON.stringify({ name, password }));
            }
        });

        socket.on('reconnected', (data) => {
            setGameStatus(data.status);
            setTurn(data.turn);
            setMyPosition(data.myPosition);
            setOpponentPosition(data.opponentPosition);
            setOpponentData(data.opponentData);
            setMessages(data.log || []);
            setIsOnlineMode(true);

            // Re-sync local state
            setStartCell(data.startCell);
            setEndCell(data.endCell);
            setWalls(new Set(data.walls));
            setWallCount(data.walls.length);
        });

        socket.on('player_reconnected', ({ username }) => {
            addLog(`Player ${username} re-established connection.`, 'system');
        });

        socket.on('opponent_data', (data) => {
            setOpponentData(data);
            setMyPosition(data.start); // Objective: Navigate opponent's board from their start
            addLog(`Intelligence received. Objective: Reach ${formatPos(data.end)}`, 'system');
        });

        socket.on('turn_update', ({ turn, log }) => {
            setTurn(turn);
            if (log) addLog(log, 'info');
        });

        socket.on('move_result', ({ success, message, position }) => {
            if (success) {
                setMyPosition(position);
                addLog(`Move successful. Position: ${formatPos(position)}`, 'success');
            } else {
                addLog(`Move failed: ${message}`, 'warning');
            }
        });

        socket.on('game_update', ({ player, from, to, moveStr, turn }) => {
            if (turn) setTurn(turn);
            if (player !== user.username) {
                setOpponentPosition(to); // Update where we think opponent is
                addLog(`Opponent moved: ${moveStr}`, 'warning');
            }
        });

        socket.on('game_over', ({ winner, hostBoard, joinerBoard, log }) => {
            setWinner(winner);
            setGameStatus('finished');
            setRevealedHostBoard(hostBoard || []);
            setRevealedJoinerBoard(joinerBoard || []);
            if (log) addLog(log, 'system');
            else addLog(`GAME OVER. Winner: ${winner}`, 'system');
            localStorage.removeItem('labyrinth_active_game');
        });

        return () => {
            socket.off('error');
            socket.off('game_created');
            socket.off('game_started');
            socket.off('reconnected');
            socket.off('player_reconnected');
            socket.off('opponent_data');
            socket.off('turn_update');
            socket.off('move_result');
            socket.off('game_update');
            socket.off('game_over');
        };
    }, [socket, startCell, user, gamePassword]);

    const addLog = (text, type = 'info') => {
        setMessages(prev => [...prev, { text, time: new Date().toLocaleTimeString(), type }]);
    };

    const formatPos = (pos) => {
        if (!pos) return '';
        const [r, c] = pos.split('-').map(Number);
        const cols = ['A', 'B', 'C', 'D', 'E', 'F'];
        return `${cols[c]}${r + 1}`;
    };

    const parsePos = (input) => {
        const match = input.toUpperCase().match(/^([A-F])([1-6])$/);
        if (!match) return null;
        const c = ['A', 'B', 'C', 'D', 'E', 'F'].indexOf(match[1]);
        const r = parseInt(match[2]) - 1;
        return `${r}-${c}`;
    };

    // BFS Path Validation
    const checkPath = () => {
        if (!startCell || !endCell) return false;

        const queue = [startCell];
        const visited = new Set([startCell]);

        while (queue.length > 0) {
            const curr = queue.shift();
            if (curr === endCell) return true;

            const [r, c] = curr.split('-').map(Number);
            const neighbors = [
                { r: r - 1, c, type: 'h', wr: r, wc: c },     // Up
                { r: r + 1, c, type: 'h', wr: r + 1, wc: c }, // Down
                { r: r, c: c - 1, type: 'v', wr: r, wc: c },     // Left
                { r: r, c: c + 1, type: 'v', wr: r, wc: c + 1 }  // Right
            ];

            for (let n of neighbors) {
                if (n.r >= 0 && n.r < 6 && n.c >= 0 && n.c < 6) {
                    const nextKey = `${n.r}-${n.c}`;
                    const wallKey = `${n.type}-${n.wr}-${n.wc}`;

                    if (!visited.has(nextKey) && !walls.has(wallKey)) {
                        visited.add(nextKey);
                        queue.push(nextKey);
                    }
                }
            }
        }
        return false;
    };

    const handleEnableOnline = () => {
        if (!user) return alert("ACCESS DENIED: Login required.");
        if (wallCount !== 20) return alert("CONFIGURATION ERROR: Exactly 20 walls required.");
        if (!startCell || !endCell) return alert("CONFIGURATION ERROR: Start/End points missing.");
        if (!checkPath()) return alert("PATH ERROR: No valid path detected.");

        setIsOnlineMode(true);
        setGameStatus('lobby');
    };

    const createGame = () => {
        console.log("Create Game Triggered");
        if (!socket) {
            console.error("Socket not connected");
            return alert("CONNECTION ERROR: Socket not ready.");
        }
        if (!gameName || !gamePassword) return alert("CREDENTIALS MISSING");

        console.log("Emitting create_game", { gameName, gamePassword });
        socket.emit('create_game', {
            name: gameName,
            password: gamePassword,
            board: Array.from(walls),
            start: startCell,
            end: endCell,
            username: user.username
        });
    };

    const joinGame = () => {
        if (!gameName || !gamePassword) return alert("CREDENTIALS MISSING");
        socket.emit('join_game', {
            name: gameName,
            password: gamePassword,
            board: Array.from(walls),
            start: startCell,
            end: endCell,
            username: user.username
        });
    };

    const handleChatSubmit = (e) => {
        e.preventDefault();
        if (gameStatus !== 'playing') return;
        const target = parsePos(chatInput);
        if (target) {
            socket.emit('make_move', { gameName, targetCell: target });
        } else {
            addLog(`INVALID COORDINATES. Format: A1-F6`, 'error');
        }
        setChatInput('');
    };

    // --- RENDER HELPERS ---
    const renderGrid = (isOpponentMap) => {
        const gridCells = [];
        for (let r = 0; r < 6; r++) {
            for (let c = 0; c < 6; c++) {
                gridCells.push({ r, c });
            }
        }

        // Determine which walls to show
        // If it's Opponent Map:
        // - In Playing: Show NO walls (unless revealed by future mechanics, but properly they are hidden)
        // - In Finished: Show Opponent's Walls (revealedJoinerBoard or revealedHostBoard depending on who is who)
        // Complex logic: We need to know if WE are host or joiner to know which board is "opponent's".
        // Simplified: The server sends `hostBoard` and `joinerBoard`.
        // If I am Host, Opponent Map uses `joinerBoard`.
        // If I am Joiner, Opponent Map uses `hostBoard`.
        // BUT, `revealedHostBoard` is only set on game over.

        // Let's rely on standard `walls` for My Map (Setup/Play).
        // For Opponent Map (Play): Empty.
        // For Opponent Map (Finish): Check `revealed...` arrays.

        let wallsToShow = new Set();
        if (!isOpponentMap) {
            wallsToShow = walls; // Show my walls on my setup/preview
        } else if (gameStatus === 'finished') {
            // We need to know which set of walls belongs to the opponent.
            // Since we don't easily track "Am I Host" in state without prop drilling or context, 
            // we can try to deduct or just show ALL walls if we want to digest the whole game.
            // A simpler way: The server sent `hostBoard` and `joinerBoard`. 
            // If `walls` matches `hostBoard`, then `joinerBoard` is opponent, and vice versa.
            // Let's just merge both for the "Game Over" reveal if we want to see everything?
            // User request: "reveal the opponent walls if anyone wins".
            // So on the "Opponent Map" view, we should show the Opponent's walls.

            // Heuristic: If my `walls` set looks like `hostBoard`, show `joinerBoard`.
            const myWallsArr = Array.from(walls).sort().join(',');
            const hostWallsArr = (revealedHostBoard || []).sort().join(',');

            if (myWallsArr === hostWallsArr) {
                wallsToShow = new Set(revealedJoinerBoard);
            } else {
                wallsToShow = new Set(revealedHostBoard);
            }
        }

        return (
            <div className="maze-grid" style={{ opacity: isOpponentMap && gameStatus === 'playing' ? 1 : (isOnlineMode && gameStatus === 'playing' ? 0.3 : 1) }}>
                {gridCells.map((cell, i) => {
                    const key = `${cell.r}-${cell.c}`;
                    let className = 'cell';

                    if (isOpponentMap) {
                        if (opponentData) {
                            if (key === opponentData.start) className += ' start-node';
                            if (key === opponentData.end) className += ' end-node';
                        }
                        if (key === myPosition) className += ' player-node';
                    } else {
                        if (key === startCell) className += ' start-node';
                        if (key === endCell) className += ' end-node';
                        if (isOnlineMode && key === opponentPosition) className += ' opponent-node';
                    }

                    return (
                        <div
                            key={i}
                            className={className}
                            style={{ gridRow: cell.r + 1, gridColumn: cell.c + 1, position: 'relative' }}
                            onClick={() => !isOnlineMode && handleCellClick(cell.r, cell.c)}
                        >
                            <span className="cell-coord">{formatPos(key)}</span>
                            <div className="cell-content"></div>
                        </div>
                    );
                })}

                {/* Vertical Walls */}
                {Array.from({ length: 6 }).flatMap((_, r) =>
                    Array.from({ length: 5 }).map((_, i) => {
                        const c = i + 1;
                        const key = `v-${r}-${c}`;
                        const isActive = wallsToShow.has(key);
                        return (
                            <div
                                key={key}
                                className={`v-wall ${isActive ? 'wall-active' : ''}`}
                                style={{ '--r': r, '--c': c }}
                                onClick={() => !isOnlineMode && !isOpponentMap && toggleWall('v', r, c)}
                            />
                        );
                    })
                )}

                {/* Horizontal Walls */}
                {Array.from({ length: 5 }).flatMap((_, i) => {
                    const r = i + 1;
                    return Array.from({ length: 6 }).map((_, c) => {
                        const key = `h-${r}-${c}`;
                        const isActive = wallsToShow.has(key);
                        return (
                            <div
                                key={key}
                                className={`h-wall ${isActive ? 'wall-active' : ''}`}
                                style={{ '--r': r, '--c': c }}
                                onClick={() => !isOnlineMode && !isOpponentMap && toggleWall('h', r, c)}
                            />
                        );
                    });
                })}
            </div>
        );
    };

    const handleCellClick = (r, c) => {
        const key = `${r}-${c}`;
        if (mode === 'start') setStartCell(key);
        else if (mode === 'end') setEndCell(key);
    };

    const toggleWall = (type, r, c) => {
        if (mode !== 'wall') return;
        const key = `${type}-${r}-${c}`;
        const newWalls = new Set(walls);

        if (newWalls.has(key)) {
            newWalls.delete(key);
            setWallCount(prev => prev - 1);
        } else {
            if (wallCount >= 20) return alert("MAX WALL INTEGRITY REACHED (20/20)");
            newWalls.add(key);
            setWallCount(prev => prev + 1);
        }
        setWalls(newWalls);
    };

    return (
        <div className="cyber-container">
            <style>{`
                :root {
                    --neon-blue: #00f3ff;
                    --neon-pink: #bc13fe;
                    --neon-green: #0aff0a;
                    --dark-bg: #050510;
                    --grid-line: rgba(0, 243, 255, 0.1);
                }
                
                .cyber-container {
                    background-color: var(--dark-bg);
                    color: var(--neon-blue);
                    font-family: 'Courier New', Courier, monospace;
                    min-height: 100vh;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    background-image: 
                        linear-gradient(var(--grid-line) 1px, transparent 1px),
                        linear-gradient(90deg, var(--grid-line) 1px, transparent 1px);
                    background-size: 30px 30px;
                    padding: 20px;
                }

                .cyber-card {
                    background: rgba(10, 10, 20, 0.9);
                    border: 1px solid var(--neon-blue);
                    box-shadow: 0 0 15px rgba(0, 243, 255, 0.2);
                    border-radius: 8px;
                    padding: 20px;
                    max-width: 100%;
                }

                .h-title {
                    text-align: center;
                    font-size: 2rem;
                    text-transform: uppercase;
                    letter-spacing: 4px;
                    text-shadow: 0 0 10px var(--neon-blue);
                    margin-bottom: 2rem;
                    border-bottom: 2px solid var(--neon-blue);
                    padding-bottom: 10px;
                }

                .maze-wrapper {
                    position: relative;
                    padding: 30px;
                    background: rgba(0,0,0,0.5);
                    border: 1px solid #333;
                    border-radius: 4px;
                    width: fit-content;
                    margin: 0 auto;
                }

                .maze-grid {
                    display: grid;
                    grid-template-columns: repeat(6, var(--cell-size));
                    grid-template-rows: repeat(6, var(--cell-size));
                    position: relative;
                    width: calc(6 * var(--cell-size));
                    height: calc(6 * var(--cell-size));
                    --cell-size: 60px;
                    border: 1px solid rgba(255,255,255,0.1);
                    background: rgba(0,0,0,0.2);
                }

                @media (max-width: 600px) {
                    .maze-grid {
                        --cell-size: clamp(40px, 15vw, 80px);
                    }
                    .maze-wrapper {
                        padding: 0 !important;
                    }
                    .player-node { width: 40% !important; height: 40% !important; margin: 30% !important; }
                }

                .cell {
                    background: rgba(0, 20, 40, 0.6);
                    border: 1px solid rgba(0, 243, 255, 0.1);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                }
                .cell:hover { background: rgba(0, 243, 255, 0.1); }

                /* Nodes */
                .start-node { background: rgba(10, 255, 10, 0.3); box-shadow: inset 0 0 15px var(--neon-green); }
                .end-node { background: rgba(0, 100, 255, 0.3); box-shadow: inset 0 0 15px #0080ff; }
                .player-node { background: white; box-shadow: 0 0 20px white; z-index: 10; border-radius: 50%; width: 60%; height: 60%; margin: 20%; }
                .opponent-node { background: var(--neon-pink); opacity: 0.5; box-shadow: 0 0 15px var(--neon-pink); z-index: 5; }

                /* Walls */
                .v-wall, .h-wall { 
                    position: absolute; 
                    background: rgba(255, 255, 255, 0.05); 
                    transition: all 0.2s; 
                    z-index: 20; 
                }
                .v-wall { 
                    width: 6px; 
                    height: var(--cell-size); 
                    left: calc(var(--c) * var(--cell-size) - 3px);
                    top: calc(var(--r) * var(--cell-size));
                }
                .h-wall { 
                    height: 6px; 
                    width: var(--cell-size); 
                    left: calc(var(--c) * var(--cell-size));
                    top: calc(var(--r) * var(--cell-size) - 3px);
                }
                
                .v-wall:hover, .h-wall:hover { background: rgba(177, 15, 46, 0.2); }
                
                .wall-active {
                    background: #b10f2e !important;
                }

                .maze-left-labels {
                    display: none;
                }
                .maze-top-labels {
                    display: none;
                }

                .cell-coord {
                    position: absolute;
                    top: 2px;
                    left: 4px;
                    font-size: 10px;
                    color: rgba(0, 243, 255, 0.2);
                    pointer-events: none;
                    user-select: none;
                    font-family: monospace;
                }

                /* UI Elements */
                .cyber-card {
                    background: #0d0d0d;
                    border: 1px solid #1a1a1a;
                    padding: 1.5rem;
                    border-radius: 4px;
                }

                .cyber-btn {
                    background: #1a1a1a;
                    border: 1px solid #333;
                    color: #ccc;
                    padding: 8px 16px;
                    text-transform: uppercase;
                    cursor: pointer;
                    transition: all 0.2s;
                    font-family: inherit;
                    letter-spacing: 1px;
                }
                .cyber-btn:hover:not(:disabled) {
                    background: #222;
                    border-color: #444;
                    color: #fff;
                }
                .cyber-btn:disabled { opacity: 0.3; cursor: not-allowed; }
                .cyber-btn.active { background: #b10f2e; border-color: #b10f2e; color: #fff; }

                .cyber-input {
                    background: #000;
                    border: 1px solid #222;
                    color: white;
                    padding: 10px;
                    border-radius: 4px;
                    font-family: inherit;
                    outline: none;
                }
                .cyber-input:focus { border-color: #444; }

                .maze-wrapper {
                    position: relative;
                    padding: 20px;
                    background: #050505;
                    border: 1px solid #111;
                }

                .log-panel {
                    border: 1px solid #1a1a1a;
                    background: rgba(0,0,0,0.5);
                    height: 300px;
                    display: flex;
                    flex-direction: column;
                    padding: 10px;
                    font-family: 'Consolas', monospace;
                    font-size: 0.9rem;
                }
                .log-entry { margin-bottom: 4px; padding-bottom: 4px; border-bottom: 1px solid #222; }
                .log-time { color: #666; font-size: 0.75rem; margin-right: 8px; }
                .log-system { color: var(--neon-blue); }
                .log-error { color: #ff3333; }
                .log-warning { color: #ffaa00; }
                .log-success { color: var(--neon-green); }

            `}</style>

            {!isOnlineMode ? (
                /* SETUP MODE */
                <div className="cyber-card" style={{ width: '100%', maxWidth: '600px' }}>
                    <h1 className="h-title">Your Map</h1>

                    <div className="flex justify-center mb-6">
                        <div className="maze-wrapper">
                            {renderGrid(false)}
                        </div>
                    </div>

                    <div className="flex justify-between items-center mb-6 px-4">
                        <div className="text-xl uppercase tracking-tighter text-gray-400">
                            Walls used: <span style={{ color: wallCount === 20 ? 'var(--neon-green)' : 'white' }}>{wallCount}/20</span>
                        </div>
                        <div className="flex gap-2">
                            <button className={`cyber-btn ${mode === 'wall' ? 'active' : ''}`} onClick={() => setMode('wall')}>Walls</button>
                            <button className={`cyber-btn ${mode === 'start' ? 'active' : ''}`} style={{ borderColor: mode === 'start' ? '#22c55e' : '#333' }} onClick={() => setMode('start')}>Start</button>
                            <button className={`cyber-btn ${mode === 'end' ? 'active' : ''}`} style={{ borderColor: mode === 'end' ? '#3b82f6' : '#333' }} onClick={() => setMode('end')}>End</button>
                        </div>
                    </div>

                    {user ? (
                        <button onClick={handleEnableOnline} className="cyber-btn w-full" style={{ padding: '15px', fontSize: '1.2rem' }}>
                            START GAME
                        </button>
                    ) : (
                        <div className="text-center text-red-500">AUTHENTICATION REQUIRED</div>
                    )}
                </div>
            ) : (
                /* ONLINE MODE */
                <div className="w-full max-w-6xl flex flex-col gap-6">
                    <h1 className="h-title">Multiplayer</h1>

                    {gameStatus === 'lobby' && (
                        <div className="cyber-card self-center">
                            <h2 className="text-xl mb-4 text-center uppercase tracking-widest text-gray-500">Connection</h2>
                            <div className="flex flex-col gap-4">
                                <input placeholder="GAME NAME" value={gameName} onChange={e => setGameName(e.target.value)} className="cyber-input" />
                                <input placeholder="PASSWORD" value={gamePassword} onChange={e => setGamePassword(e.target.value)} className="cyber-input" />
                                <div className="flex gap-4">
                                    <button onClick={() => createGame(gameName.trim(), gamePassword.trim())} className="cyber-btn flex-1">HOST</button>
                                    <button onClick={() => joinGame(gameName.trim(), gamePassword.trim())} className="cyber-btn flex-1">JOIN</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {gameStatus === 'waiting' && (
                        <div className="cyber-card self-center text-center max-w-sm w-full">
                            <div className="text-2xl mb-2 uppercase text-gray-400">Waiting for pool...</div>
                            <div className="text-sm text-gray-600 mb-6 font-mono tracking-widest">GATEWAY ACTIVE</div>

                            <div className="flex flex-col gap-4 mb-6 p-6 bg-black/40 border border-white/5 rounded shadow-inner">
                                <div>
                                    <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1 font-mono">Game ID</div>
                                    <div className="text-xl font-mono text-white tracking-widest">{gameName}</div>
                                </div>
                                <div>
                                    <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1 font-mono">Access Key</div>
                                    <div className="text-xl font-mono text-indigo-400 tracking-widest">{gamePassword}</div>
                                </div>
                            </div>

                            <button
                                onClick={() => {
                                    const url = `${window.location.origin}/labyrinth/spectate/${gameName}`;
                                    navigator.clipboard.writeText(url);
                                    alert('Spectate link copied to clipboard!');
                                }}
                                className="cyber-btn text-xs px-4 py-2 w-full"
                            >
                                COPY SPECTATE LINK
                            </button>
                        </div>
                    )}

                    {(gameStatus === 'playing' || gameStatus === 'finished') && (
                        <div className="flex flex-col lg:flex-row gap-8 justify-center items-start">

                            {/* GAME BOARD */}
                            <div className="cyber-card">
                                <div className="text-center mb-4 text-gray-500 font-bold uppercase tracking-widest">
                                    Opponent's Map
                                </div>
                                <div className="maze-wrapper">
                                    {renderGrid(true)}
                                </div>
                                <div className="mt-4 text-center text-sm text-gray-500">
                                    YOUR POSITION: <span className="text-white font-bold">{myPosition ? formatPos(myPosition) : 'N/A'}</span>
                                </div>
                            </div>

                            {/* CONTROL PANEL */}
                            <div className="cyber-card flex flex-col h-[500px] w-full lg:w-[400px]">
                                <div className="mb-4 text-center">
                                    <h3 className="text-lg font-bold border-b border-gray-700 pb-2">DATA LOG</h3>
                                    <div className={`p-4 mt-2 font-bold text-xl tracking-wider transition-colors duration-500 ${winner ? 'bg-blue-900' :
                                        turn === user.username ? 'bg-green-900/50 text-green-400 border border-green-500' : 'bg-red-900/50 text-red-400 border border-red-500'
                                        }`}>
                                        {winner ? `WINNER: ${winner}` : (turn === user.username ? ">> YOUR TURN <<" : "WAITING FOR OPPONENT")}
                                    </div>
                                </div>

                                <div className="log-panel flex-1 overflow-y-auto mb-4">
                                    {messages.map((m, i) => (
                                        <div key={i} className={`log-entry log-${m.type}`}>
                                            <span className="log-time">[{m.time}]</span>
                                            {m.text}
                                        </div>
                                    ))}
                                    <div ref={logEndRef} />
                                </div>

                                <form onSubmit={handleChatSubmit} className="flex gap-2">
                                    <input
                                        value={chatInput}
                                        onChange={e => setChatInput(e.target.value)}
                                        placeholder="ENTER COORDS (E.G. A3)"
                                        className="cyber-input flex-1 uppercase text-center text-lg tracking-widest"
                                        maxLength={2}
                                        disabled={turn !== user.username || !!winner}
                                        autoFocus
                                    />
                                    <button
                                        type="submit"
                                        className="cyber-btn"
                                        disabled={turn !== user.username || !!winner}
                                    >
                                        EXECUTE
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Labyrinth;
