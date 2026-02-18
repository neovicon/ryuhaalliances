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
        if (!socket) return;

        socket.on('error', (msg) => {
            console.error("Socket Error:", msg);
            alert(`ERROR: ${msg}`);
            addLog(`ERROR: ${msg}`, 'error');
        });

        socket.on('game_created', ({ name }) => {
            setGameStatus('waiting');
            addLog(`System initialized. Game "${name}" created. Waiting for opponent connection...`, 'system');
        });

        socket.on('game_started', ({ host, joiner, turn }) => {
            setGameStatus('playing');
            setTurn(turn);
            addLog(`Match initiated: ${host} vs ${joiner}`, 'system');
            setMyPosition(startCell);
        });

        socket.on('opponent_data', (data) => {
            setOpponentData(data);
            setOpponentPosition(data.start); // Initialize opponent position
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

        socket.on('game_update', ({ player, from, to, moveStr }) => {
            if (player !== user.username) {
                setOpponentPosition(to); // Update where we think opponent is
                addLog(`Opponent detected moving: ${moveStr}`, 'warning');
            }
        });

        socket.on('game_over', ({ winner, hostBoard, joinerBoard }) => {
            setWinner(winner);
            setGameStatus('finished');
            setRevealedHostBoard(hostBoard || []);
            setRevealedJoinerBoard(joinerBoard || []);
            addLog(`GAME OVER. Winner: ${winner}`, 'system');
        });

        return () => {
            socket.off('error');
            socket.off('game_created');
            socket.off('game_started');
            socket.off('opponent_data');
            socket.off('turn_update');
            socket.off('move_result');
            socket.off('game_update');
            socket.off('game_over');
        };
    }, [socket, startCell, user]);

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
                        // OPPONENT MAP VIEW (Where I move)
                        if (opponentData) {
                            if (key === opponentData.start) className += ' start-node'; // Where I start on their map
                            if (key === opponentData.end) className += ' end-node';     // Where I need to go
                        }
                        if (key === myPosition) className += ' player-node';
                    } else {
                        // MY MAP VIEW (Setup or where Opponent moves)
                        if (key === startCell) className += ' start-node';
                        if (key === endCell) className += ' end-node';
                        if (isOnlineMode && key === opponentPosition) className += ' opponent-node'; // Show opponent ghost
                    }

                    return (
                        <div
                            key={i}
                            className={className}
                            style={{ gridRow: cell.r + 1, gridColumn: cell.c + 1 }}
                            onClick={() => !isOnlineMode && handleCellClick(cell.r, cell.c)}
                        >
                            <div className="cell-content"></div>
                        </div>
                    );
                })}

                {/* Render Walls */}
                {[
                    // Vertical Walls
                    ...Array.from({ length: 6 }).flatMap((_, r) =>
                        Array.from({ length: 5 }).map((_, i) => {
                            const c = i + 1;
                            const key = `v-${r}-${c}`;
                            const isActive = wallsToShow.has(key);
                            return (
                                <div
                                    key={`v-${r}-${c}`}
                                    className={`v-wall ${isActive ? 'wall-active' : ''}`}
                                    style={{ left: (c * 60 - 4) + 'px', top: (r * 60) + 'px' }}
                                    onClick={() => !isOnlineMode && !isOpponentMap && toggleWall('v', r, c)}
                                />
                            );
                        })
                    ),
                    // Horizontal Walls
                    ...Array.from({ length: 5 }).flatMap((_, i) => {
                        const r = i + 1;
                        return Array.from({ length: 6 }).map((_, c) => {
                            const key = `h-${r}-${c}`;
                            const isActive = wallsToShow.has(key);
                            return (
                                <div
                                    key={`h-${r}-${c}`}
                                    className={`h-wall ${isActive ? 'wall-active' : ''}`}
                                    style={{ left: (c * 60) + 'px', top: (r * 60 - 4) + 'px' }}
                                    onClick={() => !isOnlineMode && !isOpponentMap && toggleWall('h', r, c)}
                                />
                            );
                        });
                    })
                ]}
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
                    grid-template-columns: repeat(6, 60px);
                    grid-template-rows: repeat(6, 60px);
                    position: relative;
                    width: 360px;
                    height: 360px;
                }

                @media (max-width: 500px) {
                    .maze-grid {
                        grid-template-columns: repeat(6, 45px);
                        grid-template-rows: repeat(6, 45px);
                        width: 270px; /* 6 * 45 */
                        height: 270px;
                    }
                    .cell { width: 45px !important; height: 45px !important; }
                    .v-wall { height: 45px !important; left: calc(var(--c) * 45px - 4px) !important; top: calc(var(--r) * 45px) !important; }
                    .h-wall { width: 45px !important; left: calc(var(--c) * 45px) !important; top: calc(var(--r) * 45px - 4px) !important; }
                    .maze-top-labels { grid-template-columns: repeat(6, 45px) !important; left: 45px !important; }
                    .maze-left-labels { grid-template-rows: repeat(6, 45px) !important; width: 45px !important; }
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
                .v-wall, .h-wall { position: absolute; background: rgba(255, 255, 255, 0.05); transition: all 0.2s; z-index: 20; }
                .v-wall { width: 8px; height: 60px; margin-left: -4px; border-radius: 4px; }
                .h-wall { height: 8px; width: 60px; margin-top: -4px; border-radius: 4px; }
                
                .v-wall:hover, .h-wall:hover { background: rgba(255, 0, 85, 0.3); }
                
                .wall-active {
                    background: #ff0055 !important;
                    box-shadow: 0 0 10px #ff0055, 0 0 20px #ff0055;
                }

                /* Labels */
                .maze-top-labels {
                    position: absolute; top: -25px; left: 0; right: 0;
                    display: grid; grid-template-columns: repeat(6, 60px);
                    text-align: center; color: var(--neon-blue); font-weight: bold;
                }
                .maze-left-labels {
                    position: absolute; left: -25px; top: 0; bottom: 0;
                    display: grid; grid-template-rows: repeat(6, 60px);
                    align-items: center; justify-items: center; color: var(--neon-blue); font-weight: bold;
                }

                /* UI Elements */
                .cyber-btn {
                    background: transparent;
                    border: 1px solid var(--neon-blue);
                    color: var(--neon-blue);
                    padding: 8px 16px;
                    text-transform: uppercase;
                    cursor: pointer;
                    transition: all 0.3s;
                    font-family: inherit;
                    letter-spacing: 1px;
                }
                .cyber-btn:hover:not(:disabled) {
                    background: var(--neon-blue);
                    color: black;
                    box-shadow: 0 0 20px var(--neon-blue);
                }
                .cyber-btn:disabled { opacity: 0.3; cursor: not-allowed; }
                .cyber-btn.active { background: var(--neon-blue); color: black; box-shadow: 0 0 15px var(--neon-blue); }

                .cyber-input {
                    background: rgba(0, 0, 0, 0.5);
                    border: 1px solid #333;
                    color: white;
                    padding: 10px;
                    border-radius: 4px;
                    font-family: inherit;
                    outline: none;
                }
                .cyber-input:focus { border-color: var(--neon-blue); box-shadow: 0 0 10px rgba(0, 243, 255, 0.2); }

                .log-panel {
                    border: 1px solid #333;
                    background: rgba(0,0,0,0.8);
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
                    <h1 className="h-title">System Setup</h1>

                    <div className="flex justify-center mb-6">
                        <div className="maze-wrapper">
                            <div className="maze-top-labels"><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span><span>6</span></div>
                            <div className="maze-left-labels"><span>A</span><span>B</span><span>C</span><span>D</span><span>E</span><span>F</span></div>
                            {renderGrid(false)}
                        </div>
                    </div>

                    <div className="flex justify-between items-center mb-6 px-4">
                        <div className="text-xl">
                            INTEGRITY: <span style={{ color: wallCount === 20 ? 'var(--neon-green)' : 'white' }}>{wallCount}/20</span>
                        </div>
                        <div className="flex gap-2">
                            <button className={`cyber-btn ${mode === 'wall' ? 'active' : ''}`} onClick={() => setMode('wall')}>Build</button>
                            <button className={`cyber-btn ${mode === 'start' ? 'active' : ''}`} style={{ borderColor: 'var(--neon-green)' }} onClick={() => setMode('start')}>Start</button>
                            <button className={`cyber-btn ${mode === 'end' ? 'active' : ''}`} style={{ borderColor: '#0080ff' }} onClick={() => setMode('end')}>End</button>
                        </div>
                    </div>

                    {user ? (
                        <button onClick={handleEnableOnline} className="cyber-btn w-full" style={{ padding: '15px', fontSize: '1.2rem' }}>
                            INITIALIZE UPLINK
                        </button>
                    ) : (
                        <div className="text-center text-red-500">AUTHENTICATION REQUIRED</div>
                    )}
                </div>
            ) : (
                /* ONLINE MODE */
                <div className="w-full max-w-6xl flex flex-col gap-6">
                    <h1 className="h-title">Online Uplink</h1>

                    {gameStatus === 'lobby' && (
                        <div className="cyber-card self-center">
                            <h2 className="text-xl mb-4 text-center">CONNECTION PARAMETERS</h2>
                            <div className="flex flex-col gap-4">
                                <input placeholder="PROTOCOL ID (Name)" value={gameName} onChange={e => setGameName(e.target.value)} className="cyber-input" />
                                <input placeholder="ACCESS KEY (Password)" value={gamePassword} onChange={e => setGamePassword(e.target.value)} className="cyber-input" />
                                <div className="flex gap-4">
                                    <button onClick={createGame} className="cyber-btn flex-1">HOST PROTOCOL</button>
                                    <button onClick={joinGame} className="cyber-btn flex-1">JOIN PROTOCOL</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {gameStatus === 'waiting' && (
                        <div className="cyber-card self-center text-center animate-pulse">
                            <div className="text-2xl mb-2">WAITING FOR PEER CONNECTION...</div>
                            <div className="text-sm text-gray-400">System ready. Standby.</div>
                        </div>
                    )}

                    {(gameStatus === 'playing' || gameStatus === 'finished') && (
                        <div className="flex flex-col lg:flex-row gap-8 justify-center items-start">

                            {/* GAME BOARD */}
                            <div className="cyber-card">
                                <div className="text-center mb-4 text-yellow-400 font-bold tracking-widest">
                                    TARGET SECTOR (NAVIGATE)
                                </div>
                                <div className="maze-wrapper">
                                    <div className="maze-top-labels"><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span><span>6</span></div>
                                    <div className="maze-left-labels"><span>A</span><span>B</span><span>C</span><span>D</span><span>E</span><span>F</span></div>
                                    {renderGrid(true)}
                                </div>
                                <div className="mt-4 text-center text-sm text-gray-400">
                                    CURRENT COORDS: <span className="text-white font-bold text-lg">{myPosition ? formatPos(myPosition) : 'N/A'}</span>
                                </div>
                            </div>

                            {/* CONTROL PANEL */}
                            <div className="cyber-card flex flex-col h-[500px] w-full lg:w-[400px]">
                                <div className="mb-4 text-center">
                                    <h3 className="text-lg font-bold border-b border-gray-700 pb-2">DATA LOG</h3>
                                    <div className={`p-4 mt-2 font-bold text-xl tracking-wider transition-colors duration-500 ${winner ? 'bg-blue-900' :
                                        turn === socket.id ? 'bg-green-900/50 text-green-400 border border-green-500' : 'bg-red-900/50 text-red-400 border border-red-500'
                                        }`}>
                                        {winner ? `WINNER: ${winner}` : (turn === socket.id ? ">> YOUR TURN <<" : "WAITING FOR OPPONENT")}
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
                                        disabled={turn !== socket.id || !!winner}
                                        autoFocus
                                    />
                                    <button
                                        type="submit"
                                        className="cyber-btn"
                                        disabled={turn !== socket.id || !!winner}
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
