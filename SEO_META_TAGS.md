# SEO Meta Tags for Ryuha Alliance

This document contains all SEO meta tags for each page of the Ryuha Alliance website.

## Base URL
**https://ryuhaalliance.devsandbox.me**

---

## 1. Homepage (/)

### HTML Meta Tags
```html
<title>Ryuha Alliance - United Warriors Community</title>
<meta name="description" content="Join Ryuha Alliance, a legendary gathering of warriors, dreamers, and adventurers from all walks of anime fandom. Honor, Discipline, Courage, Growth, Unity.">
<meta name="keywords" content="Ryuha Alliance, anime community, warriors, anime fandom, gaming community, alliance, honor, discipline, courage">
<meta property="og:title" content="Ryuha Alliance - United Warriors Community">
<meta property="og:description" content="Join Ryuha Alliance, a legendary gathering of warriors, dreamers, and adventurers from all walks of anime fandom. Honor, Discipline, Courage, Growth, Unity.">
<meta property="og:image" content="https://ryuhaalliance.devsandbox.me/assets/cover.jpg">
<meta property="og:url" content="https://ryuhaalliance.devsandbox.me/">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Ryuha Alliance">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Ryuha Alliance - United Warriors Community">
<meta name="twitter:description" content="Join Ryuha Alliance, a legendary gathering of warriors, dreamers, and adventurers from all walks of anime fandom.">
<meta name="twitter:image" content="https://ryuhaalliance.devsandbox.me/assets/cover.jpg">
<link rel="canonical" href="https://ryuhaalliance.devsandbox.me/">
```

### React Component Usage
```jsx
import SEO from '../components/SEO';

<SEO 
  title="Ryuha Alliance - United Warriors Community"
  description="Join Ryuha Alliance, a legendary gathering of warriors, dreamers, and adventurers from all walks of anime fandom. Honor, Discipline, Courage, Growth, Unity."
  keywords="Ryuha Alliance, anime community, warriors, anime fandom, gaming community, alliance, honor, discipline, courage"
  url="/"
/>
```

---

## 2. Events Page (/events)

### HTML Meta Tags
```html
<title>Events - Ryuha Alliance</title>
<meta name="description" content="Discover upcoming events, tournaments, and gatherings in the Ryuha Alliance community. Join warriors from all houses for epic adventures.">
<meta name="keywords" content="Ryuha Alliance events, anime community events, gaming tournaments, alliance gatherings, warrior events">
<meta property="og:title" content="Events - Ryuha Alliance">
<meta property="og:description" content="Discover upcoming events, tournaments, and gatherings in the Ryuha Alliance community.">
<meta property="og:image" content="https://ryuhaalliance.devsandbox.me/assets/cover.jpg">
<meta property="og:url" content="https://ryuhaalliance.devsandbox.me/events">
<meta property="og:type" content="website">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Events - Ryuha Alliance">
<meta name="twitter:description" content="Discover upcoming events, tournaments, and gatherings in the Ryuha Alliance community.">
<link rel="canonical" href="https://ryuhaalliance.devsandbox.me/events">
```

### React Component Usage
```jsx
<SEO 
  title="Events - Ryuha Alliance"
  description="Discover upcoming events, tournaments, and gatherings in the Ryuha Alliance community. Join warriors from all houses for epic adventures."
  keywords="Ryuha Alliance events, anime community events, gaming tournaments, alliance gatherings, warrior events"
  url="/events"
/>
```

---

## 3. Event Detail Page (/events/:id)

### HTML Meta Tags (Dynamic - use event data)
```html
<title>{event.title} - Ryuha Alliance Events</title>
<meta name="description" content="{event.description.substring(0, 160)}">
<meta name="keywords" content="Ryuha Alliance, {event.title}, anime community event, warrior gathering">
<meta property="og:title" content="{event.title} - Ryuha Alliance Events">
<meta property="og:description" content="{event.description.substring(0, 160)}">
<meta property="og:image" content="{event.imageUrl || 'https://ryuhaalliance.devsandbox.me/assets/cover.jpg'}">
<meta property="og:url" content="https://ryuhaalliance.devsandbox.me/events/{event.id}">
<meta property="og:type" content="article">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{event.title} - Ryuha Alliance Events">
<meta name="twitter:description" content="{event.description.substring(0, 160)}">
<meta name="twitter:image" content="{event.imageUrl || 'https://ryuhaalliance.devsandbox.me/assets/cover.jpg'}">
<link rel="canonical" href="https://ryuhaalliance.devsandbox.me/events/{event.id}">
```

### React Component Usage (in EventDetail.jsx)
```jsx
<SEO 
  title={`${event.title} - Ryuha Alliance Events`}
  description={event.description?.substring(0, 160) || "Join this epic event in the Ryuha Alliance community."}
  keywords={`Ryuha Alliance, ${event.title}, anime community event, warrior gathering`}
  image={event.imageUrl || '/assets/cover.jpg'}
  url={`/events/${event.id}`}
  type="article"
/>
```

---

## 4. Announcements Page (/announcements)

### HTML Meta Tags
```html
<title>Announcements - Ryuha Alliance</title>
<meta name="description" content="Stay updated with the latest announcements, news, and updates from the Ryuha Alliance community. Important information for all warriors.">
<meta name="keywords" content="Ryuha Alliance announcements, community news, alliance updates, warrior news, anime community updates">
<meta property="og:title" content="Announcements - Ryuha Alliance">
<meta property="og:description" content="Stay updated with the latest announcements, news, and updates from the Ryuha Alliance community.">
<meta property="og:image" content="https://ryuhaalliance.devsandbox.me/assets/cover.jpg">
<meta property="og:url" content="https://ryuhaalliance.devsandbox.me/announcements">
<meta property="og:type" content="website">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Announcements - Ryuha Alliance">
<meta name="twitter:description" content="Stay updated with the latest announcements, news, and updates from the Ryuha Alliance community.">
<link rel="canonical" href="https://ryuhaalliance.devsandbox.me/announcements">
```

### React Component Usage
```jsx
<SEO 
  title="Announcements - Ryuha Alliance"
  description="Stay updated with the latest announcements, news, and updates from the Ryuha Alliance community. Important information for all warriors."
  keywords="Ryuha Alliance announcements, community news, alliance updates, warrior news, anime community updates"
  url="/announcements"
/>
```

---

## 5. Announcement Detail Page (/announcements/:id)

### HTML Meta Tags (Dynamic - use announcement data)
```html
<title>{announcement.title} - Ryuha Alliance</title>
<meta name="description" content="{announcement.content.substring(0, 160)}">
<meta name="keywords" content="Ryuha Alliance, {announcement.title}, community announcement, alliance news">
<meta property="og:title" content="{announcement.title} - Ryuha Alliance">
<meta property="og:description" content="{announcement.content.substring(0, 160)}">
<meta property="og:image" content="{announcement.imageUrl || 'https://ryuhaalliance.devsandbox.me/assets/cover.jpg'}">
<meta property="og:url" content="https://ryuhaalliance.devsandbox.me/announcements/{announcement.id}">
<meta property="og:type" content="article">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{announcement.title} - Ryuha Alliance">
<meta name="twitter:description" content="{announcement.content.substring(0, 160)}">
<meta name="twitter:image" content="{announcement.imageUrl || 'https://ryuhaalliance.devsandbox.me/assets/cover.jpg'}">
<link rel="canonical" href="https://ryuhaalliance.devsandbox.me/announcements/{announcement.id}">
```

### React Component Usage (in AnnouncementDetail.jsx)
```jsx
<SEO 
  title={`${announcement.title} - Ryuha Alliance`}
  description={announcement.content?.substring(0, 160) || "Important announcement from Ryuha Alliance."}
  keywords={`Ryuha Alliance, ${announcement.title}, community announcement, alliance news`}
  image={announcement.imageUrl || '/assets/cover.jpg'}
  url={`/announcements/${announcement.id}`}
  type="article"
/>
```

---

## 6. Leaderboard Page (/leaderboard)

### HTML Meta Tags
```html
<title>Leaderboard - Top Warriors | Ryuha Alliance</title>
<meta name="description" content="View the top warriors and houses in the Ryuha Alliance leaderboard. See rankings, points, and achievements of the community's finest.">
<meta name="keywords" content="Ryuha Alliance leaderboard, top warriors, house rankings, anime community rankings, warrior points">
<meta property="og:title" content="Leaderboard - Top Warriors | Ryuha Alliance">
<meta property="og:description" content="View the top warriors and houses in the Ryuha Alliance leaderboard. See rankings, points, and achievements.">
<meta property="og:image" content="https://ryuhaalliance.devsandbox.me/assets/cover.jpg">
<meta property="og:url" content="https://ryuhaalliance.devsandbox.me/leaderboard">
<meta property="og:type" content="website">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Leaderboard - Top Warriors | Ryuha Alliance">
<meta name="twitter:description" content="View the top warriors and houses in the Ryuha Alliance leaderboard.">
<link rel="canonical" href="https://ryuhaalliance.devsandbox.me/leaderboard">
```

### React Component Usage
```jsx
<SEO 
  title="Leaderboard - Top Warriors | Ryuha Alliance"
  description="View the top warriors and houses in the Ryuha Alliance leaderboard. See rankings, points, and achievements of the community's finest."
  keywords="Ryuha Alliance leaderboard, top warriors, house rankings, anime community rankings, warrior points"
  url="/leaderboard"
/>
```

---

## 7. Codex Page (/codex)

### HTML Meta Tags
```html
<title>The Codex - Policies & Guidelines | Ryuha Alliance</title>
<meta name="description" content="Read the Ryuha Alliance Codex: community policies, guidelines, code of conduct, and expectations for all warriors. Learn about our values and rules.">
<meta name="keywords" content="Ryuha Alliance codex, community policies, guidelines, code of conduct, warrior rules, alliance policies">
<meta property="og:title" content="The Codex - Policies & Guidelines | Ryuha Alliance">
<meta property="og:description" content="Read the Ryuha Alliance Codex: community policies, guidelines, code of conduct, and expectations for all warriors.">
<meta property="og:image" content="https://ryuhaalliance.devsandbox.me/assets/cover.jpg">
<meta property="og:url" content="https://ryuhaalliance.devsandbox.me/codex">
<meta property="og:type" content="website">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="The Codex - Policies & Guidelines | Ryuha Alliance">
<meta name="twitter:description" content="Read the Ryuha Alliance Codex: community policies, guidelines, and code of conduct.">
<link rel="canonical" href="https://ryuhaalliance.devsandbox.me/codex">
```

### React Component Usage
```jsx
<SEO 
  title="The Codex - Policies & Guidelines | Ryuha Alliance"
  description="Read the Ryuha Alliance Codex: community policies, guidelines, code of conduct, and expectations for all warriors. Learn about our values and rules."
  keywords="Ryuha Alliance codex, community policies, guidelines, code of conduct, warrior rules, alliance policies"
  url="/codex"
/>
```

---

## 8. House Detail Page (/houses/:slug)

### HTML Meta Tags (Dynamic - use house data)
```html
<title>{houseName} House - Ryuha Alliance</title>
<meta name="description" content="Learn about the {houseName} house in Ryuha Alliance. Discover members, history, and achievements of this warrior house.">
<meta name="keywords" content="Ryuha Alliance, {houseName} house, anime houses, warrior houses, alliance houses">
<meta property="og:title" content="{houseName} House - Ryuha Alliance">
<meta property="og:description" content="Learn about the {houseName} house in Ryuha Alliance. Discover members, history, and achievements.">
<meta property="og:image" content="https://ryuhaalliance.devsandbox.me/assets/{houseSlug}.jpeg">
<meta property="og:url" content="https://ryuhaalliance.devsandbox.me/houses/{houseSlug}">
<meta property="og:type" content="website">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{houseName} House - Ryuha Alliance">
<meta name="twitter:description" content="Learn about the {houseName} house in Ryuha Alliance.">
<meta name="twitter:image" content="https://ryuhaalliance.devsandbox.me/assets/{houseSlug}.jpeg">
<link rel="canonical" href="https://ryuhaalliance.devsandbox.me/houses/{houseSlug}">
```

### React Component Usage (in HouseDetail.jsx)
```jsx
<SEO 
  title={`${houseName} House - Ryuha Alliance`}
  description={`Learn about the ${houseName} house in Ryuha Alliance. Discover members, history, and achievements of this warrior house.`}
  keywords={`Ryuha Alliance, ${houseName} house, anime houses, warrior houses, alliance houses`}
  image={`/assets/${houseSlug}.jpeg`}
  url={`/houses/${houseSlug}`}
/>
```

---

## 9. Profile Page (/profile)

### HTML Meta Tags (User-specific, should be noindex or dynamic)
```html
<title>Profile - Ryuha Alliance</title>
<meta name="description" content="View and manage your Ryuha Alliance profile. Update your hero license, certificates, and connect with other warriors.">
<meta name="robots" content="noindex, nofollow">
<meta property="og:title" content="Profile - Ryuha Alliance">
<meta property="og:description" content="View and manage your Ryuha Alliance profile.">
<link rel="canonical" href="https://ryuhaalliance.devsandbox.me/profile">
```

### React Component Usage
```jsx
<SEO 
  title="Profile - Ryuha Alliance"
  description="View and manage your Ryuha Alliance profile. Update your hero license, certificates, and connect with other warriors."
  keywords="Ryuha Alliance profile, warrior profile, user profile"
  url="/profile"
  noindex={true}
/>
```

---

## 10. Login Page (/login)

### HTML Meta Tags (Should be noindex)
```html
<title>Sign In - Ryuha Alliance</title>
<meta name="description" content="Sign in to your Ryuha Alliance account to access the warrior community, events, and leaderboard.">
<meta name="robots" content="noindex, nofollow">
<link rel="canonical" href="https://ryuhaalliance.devsandbox.me/login">
```

### React Component Usage
```jsx
<SEO 
  title="Sign In - Ryuha Alliance"
  description="Sign in to your Ryuha Alliance account to access the warrior community, events, and leaderboard."
  keywords="Ryuha Alliance login, sign in, warrior account"
  url="/login"
  noindex={true}
/>
```

---

## 11. Signup Page (/signup)

### HTML Meta Tags (Should be noindex)
```html
<title>Join Ryuha Alliance - Sign Up</title>
<meta name="description" content="Join the Ryuha Alliance community. Create your warrior account and become part of a legendary gathering of anime fans.">
<meta name="robots" content="noindex, nofollow">
<link rel="canonical" href="https://ryuhaalliance.devsandbox.me/signup">
```

### React Component Usage
```jsx
<SEO 
  title="Join Ryuha Alliance - Sign Up"
  description="Join the Ryuha Alliance community. Create your warrior account and become part of a legendary gathering of anime fans."
  keywords="Ryuha Alliance signup, join alliance, warrior registration"
  url="/signup"
  noindex={true}
/>
```

---

## 12. Feed Page (/feed)

### HTML Meta Tags (Should be noindex - authenticated only)
```html
<title>Feed - Ryuha Alliance</title>
<meta name="description" content="View the latest posts and updates from warriors in the Ryuha Alliance community.">
<meta name="robots" content="noindex, nofollow">
<link rel="canonical" href="https://ryuhaalliance.devsandbox.me/feed">
```

### React Component Usage
```jsx
<SEO 
  title="Feed - Ryuha Alliance"
  description="View the latest posts and updates from warriors in the Ryuha Alliance community."
  keywords="Ryuha Alliance feed, community posts, warrior updates"
  url="/feed"
  noindex={true}
/>
```

---

## 13. Admin Page (/admin)

### HTML Meta Tags (Should be noindex - admin only)
```html
<title>Admin Panel - Ryuha Alliance</title>
<meta name="robots" content="noindex, nofollow">
```

### React Component Usage
```jsx
<SEO 
  title="Admin Panel - Ryuha Alliance"
  description="Admin panel for managing the Ryuha Alliance community."
  noindex={true}
/>
```

---

## 14. Moderator Page (/moderator)

### HTML Meta Tags (Should be noindex - moderator only)
```html
<title>Moderator Panel - Ryuha Alliance</title>
<meta name="robots" content="noindex, nofollow">
```

### React Component Usage
```jsx
<SEO 
  title="Moderator Panel - Ryuha Alliance"
  description="Moderator panel for managing community content."
  noindex={true}
/>
```

---

## Implementation Notes

1. **Dynamic Pages**: For event and announcement detail pages, fetch the data first, then render the SEO component with the actual content.

2. **Image URLs**: Always use absolute URLs for Open Graph and Twitter Card images. The SEO component handles this automatically.

3. **Canonical URLs**: Always include canonical URLs to prevent duplicate content issues.

4. **Noindex Pages**: User-specific pages (profile, feed, admin, moderator, login, signup) should have `noindex` to prevent indexing of private content.

5. **Update Frequency**: Update the sitemap.xml `lastmod` dates when content changes significantly.

6. **Structured Data**: Consider adding JSON-LD structured data for events and announcements (see recommendations document).

