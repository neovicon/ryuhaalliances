import { useEffect } from 'react';

/**
 * SEO Component for dynamic meta tags
 * Usage: <SEO title="Page Title" description="..." keywords="..." />
 */
export default function SEO({
  title = 'Ryuha Alliance - United Warriors Community',
  description = 'Join Ryuha Alliance, a legendary gathering of warriors, dreamers, and adventurers from all walks of anime fandom. Honor, Discipline, Courage, Growth, Unity.',
  keywords = 'Ryuha Alliance, anime community, warriors, anime fandom, gaming community, alliance',
  image = '/assets/cover.jpg',
  url = '',
  type = 'website',
  noindex = false
}) {
  useEffect(() => {
    const baseUrl = window.location.origin;
    const fullUrl = url ? `${baseUrl}${url}` : window.location.href;

    // Fallback to default image if none provided
    const defaultImage = '/assets/cover.jpg';
    const effectiveImage = image || defaultImage;
    const imageUrl = effectiveImage.startsWith('http') ? effectiveImage : `${baseUrl}${effectiveImage}`;

    // Update title
    document.title = title;

    // Update or create meta tags
    const updateMetaTag = (name, content, attribute = 'name') => {
      let element = document.querySelector(`meta[${attribute}="${name}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, name);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // Basic meta tags
    updateMetaTag('description', description);
    updateMetaTag('keywords', keywords);

    // Open Graph tags
    updateMetaTag('og:title', title, 'property');
    updateMetaTag('og:description', description, 'property');
    updateMetaTag('og:image', imageUrl, 'property');
    updateMetaTag('og:url', fullUrl, 'property');
    updateMetaTag('og:type', type, 'property');
    updateMetaTag('og:site_name', 'Ryuha Alliance', 'property');

    // Twitter Card tags
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', title);
    updateMetaTag('twitter:description', description);
    updateMetaTag('twitter:image', imageUrl);

    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', fullUrl);

    // Robots meta
    if (noindex) {
      updateMetaTag('robots', 'noindex, nofollow');
    } else {
      updateMetaTag('robots', 'index, follow');
    }
  }, [title, description, keywords, image, url, type, noindex]);

  return null;
}

