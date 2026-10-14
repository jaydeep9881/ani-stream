# AniStream — Open Issues & Feature Roadmap

This document tracks all identified issues, enhancements, and roadmap items for the **AniStream** application.

---

### Issue #1: Video Stream Auto-Failover to Secondary Servers
- **Category:** Bug / Reliability
- **Priority:** High
- **Description:**  
  When an embedded streaming server (e.g. MegaPlay / HD-1) fails or returns an error due to expired session tokens, the player does not automatically fail over to secondary servers (e.g. VidStreaming or HD-2).
- **Proposed Solution:**  
  Add an `onerror` listener to the iframe/video element in `stream.js` that automatically catches stream errors and attempts playback on the next available server in `ep.serverData[state.currentServerType]`.

---

### Issue #2: Catalog Pagination & Infinite Scroll for Search & Genres
- **Category:** Enhancement
- **Priority:** High
- **Description:**  
  Currently, searching or browsing large genres (e.g. *Action*, *Isekai*) only loads page 1 (the first 30 anime titles). Users cannot access subsequent pages of the catalog.
- **Proposed Solution:**  
  Implement a "Load More" button or an `IntersectionObserver` infinite scroll in `stream.js` that fetches `page=2, 3...` from `/api/genres/:genre?page=:page` and appends cards to the anime grid.

---

### Issue #3: "Continue Watching" Shelf & Resume Playback Timestamp
- **Category:** Feature
- **Priority:** Medium
- **Description:**  
  Watch progress is currently recorded in `localStorage`, but there is no dedicated UI shelf on the Home view to resume partially watched episodes.
- **Proposed Solution:**  
  Add a "Continue Watching" carousel above the trending grid on `stream.html`, displaying the anime poster, episode number, and progress bar based on `state.watchHistory`.

---

### Issue #4: Responsive Mobile Hamburger Menu Drawer
- **Category:** UI / Mobile
- **Priority:** Medium
- **Description:**  
  On mobile devices (screen width < 768px), the top navigation bar (`.header-nav`) is hidden to preserve space, leaving users without access to Movies, TV Series, or Most Popular pages.
- **Proposed Solution:**  
  Add a mobile slide-out drawer menu toggled by a hamburger icon button in the header.

---

### Issue #5: Multi-Language Subtitle Track Selector in Custom HLS Player
- **Category:** Enhancement
- **Priority:** Medium
- **Description:**  
  In custom player mode, subtitles currently only render the default track. HiAnime provides multiple language subtitle tracks (English, Spanish, French, German).
- **Proposed Solution:**  
  Extract subtitle track cues from `/api/servers/:episodeId` and add a subtitle language picker dropdown to the custom player control bar.

---

### Issue #6: Episode Quick-Search & Jump Filter on Anime Detail Page
- **Category:** Feature
- **Priority:** Low
- **Description:**  
  For long-running series with 100+ to 1,000+ episodes (like *One Piece* or *Naruto*), scrolling through the episode pill grid is cumbersome.
- **Proposed Solution:**  
  Add an episode range filter (e.g. `1-100`, `101-200`) and an "Episode #" input field to jump directly to an episode.

---

### Issue #7: Proxy Caching & Decryption Layer for High-Traffic m3u8 Sources
- **Category:** Performance / Backend
- **Priority:** High
- **Description:**  
  Direct client-side embeds can be subject to third-party ad injection or referrer restrictions.
- **Proposed Solution:**  
  Add server-side m3u8 stream proxying and caching in `server.js` with automated decryption fallback.
