import { useState } from 'react';
import '../styles/theme.css';

const Coinflip = () => {
    const [isFlipping, setIsFlipping] = useState(false);
    const [result, setResult] = useState(null);

    const [flipTime, setFlipTime] = useState(null);

    const flipCoin = () => {
        if (isFlipping) return;

        setIsFlipping(true);
        setResult(null);
        setFlipTime(null);

        // Animation duration
        setTimeout(() => {
            const outcome = Math.random() < 0.5 ? 'Heads' : 'Tails';
            setResult(outcome);
            setFlipTime(new Date());
            setIsFlipping(false);
        }, 1500);
    };

    return (
        <div className="container" style={{ paddingTop: '100px', minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div className="hdr-group" style={{ textAlign: 'center' }}>
                <h1 className="hdr" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Coin Flip</h1>
                <p style={{ color: 'var(--muted)', fontSize: '1.1rem' }}>Test your destiny.</p>
            </div>

            <div
                className={`coin-container ${isFlipping ? 'flipping' : ''}`}
                onClick={flipCoin}
                style={{
                    width: '200px',
                    height: '200px',
                    perspective: '1000px',
                    margin: '4rem 0',
                    cursor: 'pointer'
                }}
            >
                <div className={`coin ${result ? result.toLowerCase() : ''}`} style={{
                    width: '100%',
                    height: '100%',
                    position: 'relative',
                    transformStyle: 'preserve-3d',
                    transition: isFlipping ? 'none' : 'transform 1s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                }}>
                    <div className="coin-face heads" style={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        borderRadius: '50%',
                        backfaceVisibility: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'linear-gradient(45deg, #FFD700, #FFA500)',
                        boxShadow: '0 0 20px rgba(255, 215, 0, 0.5), inset 0 0 40px rgba(0,0,0,0.2)',
                        border: '4px solid #B8860B',
                        zIndex: 2
                    }}>
                        <div style={{ textAlign: 'center' }}>
                            <i className="fa-solid fa-dragon" style={{ fontSize: '4rem', color: '#B8860B' }}></i>
                            <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: '#B8860B', marginTop: '0.5rem' }}>HEADS</div>
                        </div>
                    </div>
                    <div className="coin-face tails" style={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        borderRadius: '50%',
                        backfaceVisibility: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'linear-gradient(45deg, #C0C0C0, #808080)',
                        boxShadow: '0 0 20px rgba(192, 192, 192, 0.5), inset 0 0 40px rgba(0,0,0,0.2)',
                        border: '4px solid #696969',
                        transform: 'rotateY(180deg)',
                        zIndex: 1
                    }}>
                        <div style={{ textAlign: 'center' }}>
                            <i className="fa-solid fa-fire" style={{ fontSize: '4rem', color: '#696969' }}></i>
                            <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: '#696969', marginTop: '0.5rem' }}>TAILS</div>
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ height: '120px', textAlign: 'center' }}>
                {result && !isFlipping && flipTime && (
                    <div className="fade-in">
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent)', marginBottom: '0.2rem' }}>
                            It's {result.toUpperCase()}!
                        </div>
                        <div style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                            flipped on {flipTime.toLocaleDateString()} at {flipTime.toLocaleTimeString()}
                        </div>
                        <button className="btn btn-primary" onClick={flipCoin} style={{ padding: '0.6rem 1.5rem', fontSize: '1rem' }}>
                            Re: Flip
                        </button>
                    </div>
                )}
                {isFlipping && (
                    <div style={{ color: 'var(--muted)', fontStyle: 'italic' }}>Flipping...</div>
                )}
                {!result && !isFlipping && (
                    <button className="btn btn-primary" onClick={flipCoin} style={{ padding: '0.8rem 2rem', fontSize: '1.2rem' }}>
                        Flip Coin
                    </button>
                )}
            </div>

            <style>{`
                @keyframes flip {
                    0% { transform: rotateY(0); }
                    100% { transform: rotateY(1800deg); }
                }

                .flipping .coin {
                    animation: flip 1.5s ease-out forwards;
                }

                .coin.heads {
                    transform: rotateY(0);
                }

                .coin.tails {
                    transform: rotateY(180deg);
                }

                .fade-in {
                    animation: fadeIn 0.5s ease-in;
                }

                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default Coinflip;
