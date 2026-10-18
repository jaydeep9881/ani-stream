# ani-stream

AniStream is a high-performance, modern anime streaming web application inspired by **HiAnime**. Built with a Node.js Express backend proxy and a Vanilla JS/CSS dark-mode frontend, it delivers real-time anime search with live autocomplete suggestions, genre browsing, synchronized dual-audio (SUB & DUB) streams, episode navigation, and community discussion boards.

---

## 🌟 Key Features

- **HiAnime First Home Landing Page (`/`):**
  - High-aesthetic dark design with floating mascot illustration.
  - Large centered search bar with debounced live autocomplete suggestions.
  - **Top Search** quick chips (*Attack on Titan*, *Death Note*, *One Punch Man*, *Demon Slayer*, *Naruto*, *Jujutsu Kaisen*, etc.).
  - Two-column section with platform FAQ and live **Trending Community Posts**.
  - Animated **Watch anime →** CTA linking directly into the streaming portal.

- **HiAnime Streaming Catalog Portal (`/home`):**
  - **Spotlight Hero Slider:** Automatically rotates trending spotlight anime.
  - **Interactive Genre Explorer Bar:** Dynamic filter pills for 15+ genres (*Action*, *Adventure*, *Comedy*, *Drama*, *Fantasy*, *Horror*, *Isekai*, *Mystery*, *Romance*, *Sci-Fi*, *Shounen*, *Slice of Life*, *Supernatural*, *Sports*).
  - **Live Floating Search Suggestions:** Autocomplete dropdown showing thumbnails, English and Japanese titles, and release duration metadata.
  - **Catalog Filtering:** SUB and DUB filter tabs.

- **Full Anime Details & Player View:**
  - Comprehensive metadata: Japanese title, Wit/Mappa/KAI Studios, rating, air date, and synopsis.
  - **Clickable Genre Badges:** Clicking any genre tag in the detail view immediately filters the main browse catalog for that genre.
  - **Episode Selector:** Grid and sidebar episode lists.
  - **Dual Player Engine:** Seamlessly toggle between live stream embeds and custom HLS video player controls.
  - **Server Selection:** Multi-server failover for both SUB and DUB audio streams.

---

## 🛠️ Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v3, PostCSS, Lucide Icons, Glassmorphism design tokens
- **Data & Proxy Engine:** Axios, Cheerio (real-time HiAnime scraper & proxy via Next.js Route Handlers)
- **Player Support:** Multi-server iframe embeds with base64 stream link decoders, SUB/DUB dual audio

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- npm

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/jaydeep9881/ani-stream.git
   cd ani-stream
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Next.js development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to:
   - **First Home Landing Page:** `http://localhost:3000/`
   - **Streaming Catalog Portal:** `http://localhost:3000/home`
   - **Watch Anime View:** `http://localhost:3000/watch/:slug`

---

## 📡 API Endpoints

- `GET /api/landing` — Scrapes top search queries and live trending community discussion posts.
- `GET /api/home` — Retrieves spotlight hero slider and trending anime list.
- `GET /api/search?q={query}` — Executes full catalog search.
- `GET /api/search/suggestions?keyword={query}` — Returns debounced search autocomplete suggestions with posters, Japanese names, and metadata.
- `GET /api/genres/:genreName` — Fetches catalog results filtered by genre.
- `GET /api/anime/:id` — Fetches full anime details, synopsis, studio, and genres.
- `GET /api/episodes/:animeId` — Retrieves episode listings for an anime.
- `GET /api/servers/:episodeId` — Resolves streaming servers and embed links for SUB and DUB.

---

## 📄 License

ISC License. Built for educational and portfolio demonstration purposes.
