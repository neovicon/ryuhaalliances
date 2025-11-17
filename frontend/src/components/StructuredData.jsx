import { useEffect } from 'react';

/**
 * StructuredData Component for JSON-LD schema markup
 * Usage: <StructuredData data={schemaObject} />
 */
export default function StructuredData({ data }) {
  useEffect(() => {
    if (!data) return;

    // Remove existing structured data script if present
    const existingScript = document.getElementById('structured-data');
    if (existingScript) {
      existingScript.remove();
    }

    // Create new script tag with JSON-LD
    const script = document.createElement('script');
    script.id = 'structured-data';
    script.type = 'application/ld+json';
    script.text = JSON.stringify(data);
    document.head.appendChild(script);

    // Cleanup on unmount
    return () => {
      const scriptToRemove = document.getElementById('structured-data');
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [data]);

  return null;
}

/**
 * Helper functions to generate common schema types
 */

export function generateOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Ryuha Alliance",
    "url": "https://ryuhaalliance.devsandbox.me",
    "logo": "https://ryuhaalliance.devsandbox.me/assets/cover.jpg",
    "description": "A legendary gathering of warriors, dreamers, and adventurers from all walks of anime fandom.",
    "sameAs": [
      "https://www.facebook.com/groups/1Brd988fMv/",
      "https://www.youtube.com/@ryuha-alliances",
      "https://discord.gg/ZxVqUaZF"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "email": "contact@ryuha-alliances.org",
      "contactType": "Customer Service"
    }
  };
}

export function generateEventSchema(event) {
  if (!event) return null;
  
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    "name": event.title,
    "description": event.description,
    "image": event.imageUrl || "https://ryuhaalliance.devsandbox.me/assets/cover.jpg",
    "startDate": event.startDate || event.createdAt,
    "endDate": event.endDate,
    "eventStatus": "https://schema.org/EventScheduled",
    "eventAttendanceMode": "https://schema.org/OnlineEventAttendanceMode",
    "organizer": {
      "@type": "Organization",
      "name": "Ryuha Alliance",
      "url": "https://ryuhaalliance.devsandbox.me"
    }
  };
}

export function generateArticleSchema(announcement) {
  if (!announcement) return null;
  
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": announcement.title,
    "description": announcement.content?.substring(0, 200) || announcement.title,
    "image": announcement.imageUrl || "https://ryuhaalliance.devsandbox.me/assets/cover.jpg",
    "datePublished": announcement.createdAt,
    "dateModified": announcement.updatedAt || announcement.createdAt,
    "author": {
      "@type": "Organization",
      "name": "Ryuha Alliance"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Ryuha Alliance",
      "logo": {
        "@type": "ImageObject",
        "url": "https://ryuhaalliance.devsandbox.me/assets/cover.jpg"
      }
    }
  };
}

