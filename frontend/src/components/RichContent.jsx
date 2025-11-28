// RichContent.jsx - Component for rendering rich text content with images and hyperlinks
export default function RichContent({ content }) {
    if (!content) return null;

    // Function to detect and convert URLs to clickable links
    const renderContentWithLinks = (text) => {
        // URL regex pattern
        const urlPattern = /(https?:\/\/[^\s]+)/g;
        const parts = text.split(urlPattern);

        return parts.map((part, index) => {
            if (part.match(urlPattern)) {
                return (
                    <a
                        key={index}
                        href={part}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            color: 'var(--primary)',
                            textDecoration: 'underline',
                            wordBreak: 'break-all'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {part}
                    </a>
                );
            }
            return part;
        });
    };

    // Function to detect image URLs and render them inline
    const renderContentWithImages = (text) => {
        // Image URL pattern (common image extensions)
        const imagePattern = /(https?:\/\/[^\s]+\.(?:jpg|jpeg|png|gif|webp|svg))/gi;
        const parts = text.split(imagePattern);

        return parts.map((part, index) => {
            if (part.match(imagePattern)) {
                return (
                    <div key={index} style={{ margin: '1rem 0' }}>
                        <img
                            src={part}
                            alt="Content image"
                            style={{
                                maxWidth: '100%',
                                borderRadius: '8px',
                                border: '1px solid rgba(148,163,184,0.2)'
                            }}
                            onError={(e) => {
                                // If image fails to load, show the URL as a link instead
                                e.target.style.display = 'none';
                                const link = document.createElement('a');
                                link.href = part;
                                link.textContent = part;
                                link.target = '_blank';
                                link.rel = 'noopener noreferrer';
                                link.style.color = 'var(--primary)';
                                link.style.textDecoration = 'underline';
                                e.target.parentNode.appendChild(link);
                            }}
                        />
                    </div>
                );
            }
            return part;
        });
    };

    // Split content by newlines to preserve formatting
    const lines = content.split('\n');

    return (
        <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8' }}>
            {lines.map((line, lineIndex) => {
                // First check for images in the line
                const withImages = renderContentWithImages(line);

                // Then process each part for links
                const processed = withImages.map((part, partIndex) => {
                    if (typeof part === 'string') {
                        return <span key={`${lineIndex}-${partIndex}`}>{renderContentWithLinks(part)}</span>;
                    }
                    return <span key={`${lineIndex}-${partIndex}`}>{part}</span>;
                });

                return (
                    <div key={lineIndex}>
                        {processed}
                        {lineIndex < lines.length - 1 && <br />}
                    </div>
                );
            })}
        </div>
    );
}
