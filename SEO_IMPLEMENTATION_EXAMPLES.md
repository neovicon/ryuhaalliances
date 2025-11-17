# SEO Implementation Examples

This document shows how to implement SEO components in your React pages.

## 1. Homepage Example (Home.jsx)

```jsx
import SEO from '../components/SEO';
import StructuredData, { generateOrganizationSchema } from '../components/StructuredData';

export default function Home() {
  return (
    <div>
      <SEO 
        title="Ryuha Alliance - United Warriors Community"
        description="Join Ryuha Alliance, a legendary gathering of warriors, dreamers, and adventurers from all walks of anime fandom. Honor, Discipline, Courage, Growth, Unity."
        keywords="Ryuha Alliance, anime community, warriors, anime fandom, gaming community, alliance, honor, discipline, courage"
        url="/"
      />
      <StructuredData data={generateOrganizationSchema()} />
      
      {/* Rest of your component */}
    </div>
  );
}
```

---

## 2. Events Page Example (Events.jsx)

```jsx
import SEO from '../components/SEO';

export default function Events() {
  return (
    <div>
      <SEO 
        title="Events - Ryuha Alliance"
        description="Discover upcoming events, tournaments, and gatherings in the Ryuha Alliance community. Join warriors from all houses for epic adventures."
        keywords="Ryuha Alliance events, anime community events, gaming tournaments, alliance gatherings, warrior events"
        url="/events"
      />
      
      {/* Rest of your component */}
    </div>
  );
}
```

---

## 3. Event Detail Page Example (EventDetail.jsx)

```jsx
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import client from '../api/client';
import SEO from '../components/SEO';
import StructuredData, { generateEventSchema } from '../components/StructuredData';

export default function EventDetail() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEvent() {
      try {
        const { data } = await client.get(`/events/${id}`);
        setEvent(data.event);
      } catch (error) {
        console.error('Error loading event:', error);
      } finally {
        setLoading(false);
      }
    }
    loadEvent();
  }, [id]);

  if (loading || !event) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <SEO 
        title={`${event.title} - Ryuha Alliance Events`}
        description={event.description?.substring(0, 160) || "Join this epic event in the Ryuha Alliance community."}
        keywords={`Ryuha Alliance, ${event.title}, anime community event, warrior gathering`}
        image={event.imageUrl || '/assets/cover.jpg'}
        url={`/events/${id}`}
        type="article"
      />
      <StructuredData data={generateEventSchema(event)} />
      
      {/* Rest of your component */}
      <h1>{event.title}</h1>
      <p>{event.description}</p>
    </div>
  );
}
```

---

## 4. Announcements Page Example (Announcements.jsx)

```jsx
import SEO from '../components/SEO';

export default function Announcements() {
  return (
    <div>
      <SEO 
        title="Announcements - Ryuha Alliance"
        description="Stay updated with the latest announcements, news, and updates from the Ryuha Alliance community. Important information for all warriors."
        keywords="Ryuha Alliance announcements, community news, alliance updates, warrior news, anime community updates"
        url="/announcements"
      />
      
      {/* Rest of your component */}
    </div>
  );
}
```

---

## 5. Announcement Detail Page Example (AnnouncementDetail.jsx)

```jsx
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import client from '../api/client';
import SEO from '../components/SEO';
import StructuredData, { generateArticleSchema } from '../components/StructuredData';

export default function AnnouncementDetail() {
  const { id } = useParams();
  const [announcement, setAnnouncement] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAnnouncement() {
      try {
        const { data } = await client.get(`/announcements/${id}`);
        setAnnouncement(data.announcement);
      } catch (error) {
        console.error('Error loading announcement:', error);
      } finally {
        setLoading(false);
      }
    }
    loadAnnouncement();
  }, [id]);

  if (loading || !announcement) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <SEO 
        title={`${announcement.title} - Ryuha Alliance`}
        description={announcement.content?.substring(0, 160) || "Important announcement from Ryuha Alliance."}
        keywords={`Ryuha Alliance, ${announcement.title}, community announcement, alliance news`}
        image={announcement.imageUrl || '/assets/cover.jpg'}
        url={`/announcements/${id}`}
        type="article"
      />
      <StructuredData data={generateArticleSchema(announcement)} />
      
      {/* Rest of your component */}
      <h1>{announcement.title}</h1>
      <div>{announcement.content}</div>
    </div>
  );
}
```

---

## 6. Leaderboard Page Example (Leaderboard.jsx)

```jsx
import SEO from '../components/SEO';

export default function Leaderboard() {
  return (
    <div>
      <SEO 
        title="Leaderboard - Top Warriors | Ryuha Alliance"
        description="View the top warriors and houses in the Ryuha Alliance leaderboard. See rankings, points, and achievements of the community's finest."
        keywords="Ryuha Alliance leaderboard, top warriors, house rankings, anime community rankings, warrior points"
        url="/leaderboard"
      />
      
      {/* Rest of your component */}
    </div>
  );
}
```

---

## 7. Codex Page Example (Codex.jsx)

```jsx
import SEO from '../components/SEO';

export default function Codex() {
  return (
    <div>
      <SEO 
        title="The Codex - Policies & Guidelines | Ryuha Alliance"
        description="Read the Ryuha Alliance Codex: community policies, guidelines, code of conduct, and expectations for all warriors. Learn about our values and rules."
        keywords="Ryuha Alliance codex, community policies, guidelines, code of conduct, warrior rules, alliance policies"
        url="/codex"
      />
      
      {/* Rest of your component */}
    </div>
  );
}
```

---

## 8. House Detail Page Example (HouseDetail.jsx)

```jsx
import { useParams } from 'react-router-dom';
import SEO from '../components/SEO';

export default function HouseDetail() {
  const { slug } = useParams();
  
  // Convert slug to house name (e.g., "pendragon" -> "Pendragon")
  const houseName = slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return (
    <div>
      <SEO 
        title={`${houseName} House - Ryuha Alliance`}
        description={`Learn about the ${houseName} house in Ryuha Alliance. Discover members, history, and achievements of this warrior house.`}
        keywords={`Ryuha Alliance, ${houseName} house, anime houses, warrior houses, alliance houses`}
        image={`/assets/${slug}.jpeg`}
        url={`/houses/${slug}`}
      />
      
      {/* Rest of your component */}
    </div>
  );
}
```

---

## 9. Profile Page Example (Profile.jsx)

```jsx
import SEO from '../components/SEO';

export default function Profile() {
  return (
    <div>
      <SEO 
        title="Profile - Ryuha Alliance"
        description="View and manage your Ryuha Alliance profile. Update your hero license, certificates, and connect with other warriors."
        keywords="Ryuha Alliance profile, warrior profile, user profile"
        url="/profile"
        noindex={true}
      />
      
      {/* Rest of your component */}
    </div>
  );
}
```

---

## 10. Login Page Example (Login.jsx)

```jsx
import SEO from '../components/SEO';

export default function Login() {
  return (
    <div>
      <SEO 
        title="Sign In - Ryuha Alliance"
        description="Sign in to your Ryuha Alliance account to access the warrior community, events, and leaderboard."
        keywords="Ryuha Alliance login, sign in, warrior account"
        url="/login"
        noindex={true}
      />
      
      {/* Rest of your component */}
    </div>
  );
}
```

---

## 11. Signup Page Example (Signup.jsx)

```jsx
import SEO from '../components/SEO';

export default function Signup() {
  return (
    <div>
      <SEO 
        title="Join Ryuha Alliance - Sign Up"
        description="Join the Ryuha Alliance community. Create your warrior account and become part of a legendary gathering of anime fans."
        keywords="Ryuha Alliance signup, join alliance, warrior registration"
        url="/signup"
        noindex={true}
      />
      
      {/* Rest of your component */}
    </div>
  );
}
```

---

## 12. Feed Page Example (Feed.jsx)

```jsx
import SEO from '../components/SEO';

export default function Feed() {
  return (
    <div>
      <SEO 
        title="Feed - Ryuha Alliance"
        description="View the latest posts and updates from warriors in the Ryuha Alliance community."
        keywords="Ryuha Alliance feed, community posts, warrior updates"
        url="/feed"
        noindex={true}
      />
      
      {/* Rest of your component */}
    </div>
  );
}
```

---

## 13. Admin Page Example (Admin.jsx)

```jsx
import SEO from '../components/SEO';

export default function Admin() {
  return (
    <div>
      <SEO 
        title="Admin Panel - Ryuha Alliance"
        description="Admin panel for managing the Ryuha Alliance community."
        noindex={true}
      />
      
      {/* Rest of your component */}
    </div>
  );
}
```

---

## 14. Moderator Page Example (Moderator.jsx)

```jsx
import SEO from '../components/SEO';

export default function Moderator() {
  return (
    <div>
      <SEO 
        title="Moderator Panel - Ryuha Alliance"
        description="Moderator panel for managing community content."
        noindex={true}
      />
      
      {/* Rest of your component */}
    </div>
  );
}
```

---

## Important Notes

1. **Dynamic Content**: For pages with dynamic content (EventDetail, AnnouncementDetail), always fetch the data first, then render the SEO component with the actual content.

2. **Image URLs**: The SEO component automatically converts relative image paths to absolute URLs. Always use relative paths like `/assets/cover.jpg` or the full image URL from your API.

3. **Noindex Pages**: User-specific pages (profile, feed, admin, moderator, login, signup) should have `noindex={true}` to prevent search engines from indexing private content.

4. **Structured Data**: Use the StructuredData component for pages that benefit from rich snippets (homepage, events, announcements).

5. **Error Handling**: If data fails to load, provide fallback values for SEO tags to prevent empty or broken meta tags.

---

## Quick Checklist

- [ ] Import SEO component in all pages
- [ ] Add appropriate title, description, and keywords
- [ ] Set `noindex={true}` for private pages
- [ ] Add StructuredData for homepage, events, and announcements
- [ ] Test meta tags with Facebook Sharing Debugger
- [ ] Test Twitter Cards with Twitter Card Validator
- [ ] Verify canonical URLs are correct
- [ ] Check that images use absolute URLs

