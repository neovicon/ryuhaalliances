import { useState } from 'react';
import { Share2, Check } from 'lucide-react';

export default function ShareButton({ url, title }) {
    const [copied, setCopied] = useState(false);

    const handleShare = async (e) => {
        e.stopPropagation(); // Prevent parent click handlers

        const shareUrl = url || window.location.href;
        const shareTitle = title || document.title;

        // Try native share API first (mobile devices)
        if (navigator.share) {
            try {
                await navigator.share({
                    title: shareTitle,
                    url: shareUrl,
                });
                return;
            } catch (error) {
                // User cancelled or share failed, fall back to copy
                if (error.name !== 'AbortError') {
                    console.error('Error sharing:', error);
                }
            }
        }

        // Fallback: copy to clipboard
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error('Error copying to clipboard:', error);
            // Final fallback: select and copy
            const textArea = document.createElement('textarea');
            textArea.value = shareUrl;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            } catch (err) {
                alert('Failed to copy link. Please copy manually: ' + shareUrl);
            }
            document.body.removeChild(textArea);
        }
    };

    return (
        <button
            onClick={handleShare}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                border: '1px solid rgba(148,163,184,0.3)',
                background: copied ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255,255,255,0.02)',
                color: copied ? '#22c55e' : 'var(--text)',
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
                if (!copied) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                    e.currentTarget.style.borderColor = 'rgba(148,163,184,0.5)';
                }
            }}
            onMouseLeave={(e) => {
                if (!copied) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                    e.currentTarget.style.borderColor = 'rgba(148,163,184,0.3)';
                }
            }}
        >
            {copied ? (
                <>
                    <Check size={16} />
                    <span>Link Copied!</span>
                </>
            ) : (
                <>
                    <Share2 size={16} />
                    <span>Share</span>
                </>
            )}
        </button>
    );
}
