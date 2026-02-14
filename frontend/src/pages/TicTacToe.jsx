import { useState, useEffect } from 'react';
import '../styles/theme.css';

const TicTacToe = () => {
    const [board, setBoard] = useState(Array(9).fill(null));
    const [isPlayerTurn, setIsPlayerTurn] = useState(true); // User goes first
    const [winner, setWinner] = useState(null); // 'X', 'O', 'Draw', or null
    const [winningLine, setWinningLine] = useState([]);
    const [background, setBackground] = useState('linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)');

    const [backgroundImage, setBackgroundImage] = useState(null);

    const handleImageUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            const imageUrl = URL.createObjectURL(file);
            setBackgroundImage(imageUrl);
        }
    };

    const backgrounds = [
        { name: 'Dark Void', value: 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)' },
        { name: 'Cyber Blue', value: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)' },
        { name: 'Neon Purple', value: 'linear-gradient(135deg, #2b1055 0%, #7597de 100%)' },
        { name: 'Crimson Tide', value: 'linear-gradient(135deg, #430b0b 0%, #1a0505 100%)' },
        { name: 'Emerald City', value: 'linear-gradient(135deg, #134e5e 0%, #71b280 100%)' }
    ];

    const checkWinner = (squares) => {
        const lines = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6]
        ];
        for (let i = 0; i < lines.length; i++) {
            const [a, b, c] = lines[i];
            if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
                return { winner: squares[a], line: lines[i] };
            }
        }
        return null;
    };

    const handleClick = (index) => {
        if (board[index] || winner || !isPlayerTurn) return;

        const newBoard = [...board];
        newBoard[index] = 'X';
        setBoard(newBoard);

        const winResult = checkWinner(newBoard);
        if (winResult) {
            setWinner(winResult.winner);
            setWinningLine(winResult.line);
        } else if (!newBoard.includes(null)) {
            setWinner('Draw');
        } else {
            setIsPlayerTurn(false);
        }
    };

    // Computer Move
    useEffect(() => {
        if (!isPlayerTurn && !winner) {
            const timer = setTimeout(() => {
                const makeComputerMove = () => {
                    // Simple AI: Block or Win, else Random
                    const lines = [
                        [0, 1, 2], [3, 4, 5], [6, 7, 8],
                        [0, 3, 6], [1, 4, 7], [2, 5, 8],
                        [0, 4, 8], [2, 4, 6]
                    ];

                    let move = -1;

                    // 1. Try to win
                    for (let line of lines) {
                        const [a, b, c] = line;
                        const squares = [board[a], board[b], board[c]];
                        if (squares.filter(s => s === 'O').length === 2 && squares.includes(null)) {
                            move = line[squares.indexOf(null)];
                            break;
                        }
                    }

                    // 2. Block player
                    if (move === -1) {
                        for (let line of lines) {
                            const [a, b, c] = line;
                            const squares = [board[a], board[b], board[c]];
                            if (squares.filter(s => s === 'X').length === 2 && squares.includes(null)) {
                                move = line[squares.indexOf(null)];
                                break;
                            }
                        }
                    }

                    // 3. Center if available
                    if (move === -1 && board[4] === null) {
                        move = 4;
                    }

                    // 4. Random
                    if (move === -1) {
                        const available = board.map((val, idx) => val === null ? idx : null).filter(val => val !== null);
                        move = available[Math.floor(Math.random() * available.length)];
                    }

                    const newBoard = [...board];
                    newBoard[move] = 'O';
                    setBoard(newBoard);

                    const winResult = checkWinner(newBoard);
                    if (winResult) {
                        setWinner(winResult.winner);
                        setWinningLine(winResult.line);
                    } else if (!newBoard.includes(null)) {
                        setWinner('Draw');
                    }
                    setIsPlayerTurn(true);
                };
                makeComputerMove();
            }, 600); // Delay for realism
            return () => clearTimeout(timer);
        }
    }, [isPlayerTurn, winner, board]);

    const resetGame = () => {
        setBoard(Array(9).fill(null));
        setWinner(null);
        setWinningLine([]);
        setIsPlayerTurn(true);
        setBackgroundImage(null);
    };

    const getStatusMessage = () => {
        if (winner === 'X') return 'You Win!';
        if (winner === 'O') return 'Computer Wins!';
        if (winner === 'Draw') return "It's a Draw!";
        return isPlayerTurn ? "Your Turn (X)" : "Computer Thinking...";
    };

    return (
        <div style={{
            minHeight: '100vh',
            paddingTop: '80px',
            background: backgroundImage ? `url(${backgroundImage}) center/cover no-repeat` : background,
            transition: 'background 0.5s ease',
            color: 'white',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative'
        }}>
            {/* Overlay for readability if image is used */}
            {backgroundImage && (
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    zIndex: 0
                }}></div>
            )}

            <div style={{ position: 'relative', zIndex: 1, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <h1 className="hdr" style={{ fontSize: '3rem', marginBottom: '1rem', textShadow: '0 0 10px rgba(0,0,0,0.5)' }}>Tic Tac Toe</h1>

                <div style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 'bold' }}>Theme:</span>
                        <select
                            onChange={(e) => {
                                setBackground(e.target.value);
                                setBackgroundImage(null); // Reset image if theme is selected
                            }}
                            style={{
                                padding: '0.5rem 1rem',
                                borderRadius: '20px',
                                border: '1px solid rgba(255,255,255,0.2)',
                                background: 'rgba(0,0,0,0.3)',
                                color: 'white',
                                cursor: 'pointer',
                                outline: 'none'
                            }}
                        >
                            {backgrounds.map((bg, idx) => (
                                <option key={idx} value={bg.value} style={{ background: '#222' }}>{bg.name}</option>
                            ))}
                        </select>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <label
                            style={{
                                padding: '0.5rem 1rem',
                                borderRadius: '20px',
                                border: '1px solid rgba(255,255,255,0.2)',
                                background: 'rgba(255, 255, 255, 0.1)',
                                color: 'white',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                transition: 'background 0.3s'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
                            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
                        >
                            <i className="fa-solid fa-upload"></i> Upload BG
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                style={{ display: 'none' }}
                            />
                        </label>
                    </div>
                </div>

                <div style={{
                    marginBottom: '1.5rem',
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    color: winner === 'X' ? '#4ade80' : winner === 'O' ? '#ef4444' : 'white',
                    minHeight: '2rem',
                    textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                }}>
                    {getStatusMessage()}
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '10px',
                    background: 'rgba(255, 255, 255, 0.05)', // More transparent
                    padding: '10px',
                    borderRadius: '15px',
                    backdropFilter: 'blur(3px)', // Little blur
                    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.2)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                    {board.map((cell, index) => (
                        <div
                            key={index}
                            onClick={() => handleClick(index)}
                            style={{
                                width: '100px',
                                height: '100px',
                                background: winningLine.includes(index)
                                    ? (winner === 'X' ? 'rgba(74, 222, 128, 0.3)' : 'rgba(239, 68, 68, 0.3)')
                                    : 'rgba(0, 0, 0, 0.2)', // More transparent cells
                                borderRadius: '10px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '3.5rem',
                                fontWeight: 'bold',
                                cursor: (!board[index] && !winner && isPlayerTurn) ? 'pointer' : 'default',
                                color: cell === 'X' ? '#4ade80' : '#ef4444',
                                textShadow: cell ? `0 0 10px ${cell === 'X' ? '#4ade80' : '#ef4444'}` : 'none',
                                transition: 'all 0.3s ease',
                                border: winningLine.includes(index)
                                    ? `2px solid ${winner === 'X' ? '#4ade80' : '#ef4444'}`
                                    : '1px solid rgba(255,255,255,0.1)'
                            }}
                        >
                            {cell}
                        </div>
                    ))}
                </div>

                <button
                    onClick={resetGame}
                    style={{
                        marginTop: '2rem',
                        padding: '0.8rem 2rem',
                        background: 'var(--accent)',
                        border: 'none',
                        borderRadius: '25px',
                        color: 'black',
                        fontSize: '1.1rem',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        boxShadow: '0 4px 15px rgba(255, 126, 95, 0.4)',
                        transition: 'transform 0.2s',
                    }}
                    onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
                    onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                >
                    {winner ? 'Play Again' : 'Reset Game'}
                </button>
            </div>
        </div>
    );
};

export default TicTacToe;
