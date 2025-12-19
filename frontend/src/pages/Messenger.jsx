import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../store/auth';
import client from '../api/client';
import { Send, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const SOCKET_URL = API_URL.replace('/api', '');

export default function Messenger() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [socket, setSocket] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [cursor, setCursor] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    const messagesEndRef = useRef(null);
    const chatContainerRef = useRef(null);

    useEffect(() => {
        // Initialize socket connection
        const newSocket = io(SOCKET_URL, {
            withCredentials: true,
            transports: ['websocket', 'polling'] // Try both
        });

        setSocket(newSocket);

        newSocket.on('connect', () => {
            if (user) {
                newSocket.emit('join_chat', { username: user.username });
            }
        });

        newSocket.on('receive_message', (message) => {
            setMessages((prev) => [...prev, message]);
            scrollToBottom();
        });

        return () => {
            newSocket.disconnect();
        };
    }, [user]);

    useEffect(() => {
        loadMessages();
    }, []);

    const loadMessages = async (nextCursor = null) => {
        try {
            const params = nextCursor ? { cursor: nextCursor } : {};
            const { data } = await client.get('/messages', { params });

            if (nextCursor) {
                setMessages((prev) => [...data.messages, ...prev]);
            } else {
                setMessages(data.messages);
                scrollToBottom();
            }

            setCursor(data.nextCursor);
            setHasMore(!!data.nextCursor);
        } catch (error) {
            console.error('Error loading messages:', error);
        } finally {
            setLoading(false);
        }
    };

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !socket) return;

        const messageData = {
            sender: user,
            content: newMessage
        };

        // Optimistic update? No, let's wait for server broadcast for simplicity and consistency
        // Actually, for better UX, we should probably wait for the broadcast
        // But we can emit immediately
        socket.emit('send_message', messageData);
        setNewMessage('');
    };

    const handleScroll = (e) => {
        if (e.target.scrollTop === 0 && hasMore && !loading) {
            // Load more messages when scrolled to top
            // We need to maintain scroll position
            const scrollHeight = e.target.scrollHeight;
            loadMessages(cursor).then(() => {
                // Adjust scroll position after loading
                setTimeout(() => {
                    e.target.scrollTop = e.target.scrollHeight - scrollHeight;
                }, 0);
            });
        }
    };

    if (!user) {
        return (
            <div className="container" style={{ padding: '2rem', textAlign: 'center' }}>
                <h2>Please login to access Messenger</h2>
            </div>
        );
    }

    return (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', background: '#0f172a', zIndex: 10000 }}>
            <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', borderRadius: 0, border: 'none', margin: 0 }}>
                {/* Chat Header */}
                <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid rgba(148,163,184,0.1)', background: 'rgba(30, 41, 59, 0.5)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button
                        onClick={() => navigate(-1)}
                        style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem', borderRadius: '50%' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h3 className="hdr" style={{ margin: 0, fontSize: '1.1rem' }}>Global Chat</h3>
                        <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Chat with everyone in the alliance</span>
                    </div>
                </div>

                {/* Messages Area */}
                <div
                    ref={chatContainerRef}
                    style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: '1rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem'
                    }}
                    onScroll={handleScroll}
                >
                    {loading && <div style={{ textAlign: 'center', color: 'var(--muted)' }}>Loading...</div>}

                    {hasMore && !loading && (
                        <div style={{ textAlign: 'center', padding: '0.5rem' }}>
                            <button
                                onClick={() => loadMessages(cursor)}
                                className="btn"
                                style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem', background: 'transparent', border: '1px solid var(--muted)' }}
                            >
                                Load older messages
                            </button>
                        </div>
                    )}

                    {messages.map((msg, index) => {
                        const isOwn = msg.sender._id === user._id;
                        const showAvatar = index === 0 || messages[index - 1].sender._id !== msg.sender._id;

                        return (
                            <div
                                key={msg._id || index}
                                style={{
                                    display: 'flex',
                                    flexDirection: isOwn ? 'row-reverse' : 'row',
                                    gap: '0.75rem',
                                    alignItems: 'flex-end'
                                }}
                            >
                                {!isOwn && (
                                    <div style={{ width: 32, height: 32, flexShrink: 0 }}>
                                        {showAvatar && (
                                            <img
                                                src={msg.sender.photoUrl || `https://ui-avatars.com/api/?name=${msg.sender.username}&background=random`}
                                                alt={msg.sender.username}
                                                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                                            />
                                        )}
                                    </div>
                                )}

                                <div style={{ maxWidth: '70%' }}>
                                    {!isOwn && showAvatar && (
                                        <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: 2, marginLeft: 4 }}>
                                            {msg.sender.username}
                                        </div>
                                    )}
                                    <div style={{
                                        padding: '0.75rem 1rem',
                                        borderRadius: '12px',
                                        background: isOwn ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                                        color: '#fff',
                                        borderTopRightRadius: isOwn ? 2 : 12,
                                        borderTopLeftRadius: !isOwn ? 2 : 12,
                                        wordBreak: 'break-word'
                                    }}>
                                        {msg.content}
                                    </div>
                                    <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', marginTop: 2, textAlign: isOwn ? 'right' : 'left' }}>
                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <form onSubmit={handleSendMessage} style={{ padding: '1rem', borderTop: '1px solid rgba(148,163,184,0.1)', display: 'flex', gap: '0.5rem' }}>
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        style={{
                            flex: 1,
                            padding: '0.75rem 1rem',
                            borderRadius: '24px',
                            border: '1px solid rgba(148,163,184,0.2)',
                            background: 'rgba(0,0,0,0.2)',
                            color: '#fff',
                            outline: 'none'
                        }}
                    />
                    <button
                        type="submit"
                        className="btn"
                        disabled={!newMessage.trim()}
                        style={{ borderRadius: '50%', width: 48, height: 48, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                        <Send size={20} />
                    </button>
                </form>
            </div>
        </div>
    );
}
