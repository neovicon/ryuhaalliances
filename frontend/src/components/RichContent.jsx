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
                        className="rich-link"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {part}
                    </a>
                );
            }
            return part;
        });
    };

    // Function to handle both HTML <a> tags and plain text URLs
    const renderComplexContent = (text) => {
        // Match <a href="...">...</a> tags
        // Group 1: Full tag, Group 2: href value, Group 3: link text
        const aTagPattern = /(<a\s+(?:[^>]*?\s+)?href=["']([^"']+)["'][^>]*>(.*?)<\/a>)/gi;
        const parts = text.split(aTagPattern);

        const result = [];
        for (let i = 0; i < parts.length; i += 4) {
            // Text before the <a> tag (or between tags)
            if (parts[i]) {
                result.push(renderContentWithLinks(parts[i]));
            }

            // The <a> tag and its captured groups
            if (i + 1 < parts.length) {
                const href = parts[i + 2];
                const linkText = parts[i + 3];
                result.push(
                    <a
                        key={`html-link-${i}`}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rich-link"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {linkText}
                    </a>
                );
            }
        }
        return result;
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
                                link.className = 'rich-link';
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
        <div className="rich-content-container" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8' }}>
            {lines.map((line, lineIndex) => {
                // First check for images in the line
                const withImages = renderContentWithImages(line);

                // Then process each part for both HTML links and auto-links
                const processed = withImages.map((part, partIndex) => {
                    if (typeof part === 'string') {
                        return <span key={`${lineIndex}-${partIndex}`}>{renderComplexContent(part)}</span>;
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
