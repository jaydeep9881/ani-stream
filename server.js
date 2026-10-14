/* ══════════════════════════════════════════════════════════
   AniStream — server.js
   Full backend proxy for live HiAnime metadata & video streams
   ══════════════════════════════════════════════════════════ */

import express from 'express';
import cors from 'cors';
import axios from 'axios';
import * as cheerio from 'cheerio';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static frontend files
app.use(express.static(__dirname));

const HIANIME_BASE = 'https://hianime.ba';
const HIANIME_API = `${HIANIME_BASE}/api/theme`;

const http = axios.create({
  timeout: 12000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': HIANIME_BASE
  }
});

// Helper: cleanly extract the pure slug from any HiAnime URL or href
function extractSlug(url) {
  if (!url) return '';
  let str = String(url).trim();
  // Strip origin (https://hianime.ba or similar)
  str = str.replace(/^https?:\/\/[^\/]+/i, '');
  // Strip /watch/
  str = str.replace(/^\/watch\//i, '/');
  // Strip query string (?ep=...)
  str = str.split('?')[0];
  // Strip leading and trailing slashes
  str = str.replace(/^\/+|\/+$/g, '');
  return str;
}

// In-memory cache
const cache = new Map();
function getCached(key) {
  const item = cache.get(key);
  if (!item) return null;
  if (Date.now() - item.time > 5 * 60 * 1000) {
    cache.delete(key);
    return null;
  }
  return item.data;
}
function setCached(key, data) {
  cache.set(key, { time: Date.now(), data });
}

// ── 0. LANDING PAGE & STATIC ROUTING ────────────────────────
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get(['/home', '/home.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'home.html'));
});

// ── 0B. LANDING DATA API ────────────────────────────────────
app.get('/api/landing', async (req, res) => {
  try {
    const cached = getCached('landing_data');
    if (cached) return res.json(cached);

    const { data } = await http.get(HIANIME_BASE);
    const $ = cheerio.load(data);

    // Top search keywords
    const topSearches = [];
    $('.xhashtag a.item, .search-tags a').each((_, el) => {
      const keyword = $(el).text().trim();
      if (keyword && !topSearches.includes(keyword)) {
        topSearches.push(keyword);
      }
    });

    // Trending community discussion posts
    const communityPosts = [];
    $('.connecting-list .item').each((_, el) => {
      const $el = $(el);
      const tag = $el.find('.ztag .zt-blue, .ztag span').first().text().trim() || '#General';
      const time = $el.find('.time span').first().text().replace(/\s+/g, ' ').trim() || 'Recently';
      const replies = $el.find('.gi-stats div').text().trim() || '18';
      const title = $el.find('.item-name a').text().trim();
      const snippet = $el.find('.subject div').text().trim();
      const author = $el.find('.cn-owner .user-name').text().trim() || 'AnimeFan';
      const avatar = $el.find('.profile-avatar img').attr('src') || 'https://hianime.ba/theme/avatars/zoro_chibi/avatar-04.png';

      if (title) {
        communityPosts.push({
          tag,
          time,
          replies,
          title,
          snippet,
          author,
          avatar
        });
      }
    });

    const result = {
      topSearches: topSearches.length > 0 ? topSearches : [
        'Attack on Titan', 'Death Note', 'Fullmetal Alchemist: Brotherhood',
        'One Punch Man', 'Demon Slayer: Kimetsu no Yaiba', 'My Hero Academia',
        'Sword Art Online', 'Hunter x Hunter', 'Naruto', 'Jujutsu Kaisen (TV)'
      ],
      communityPosts: communityPosts.slice(0, 6)
    };

    setCached('landing_data', result);
    res.json(result);
  } catch (err) {
    console.warn('Landing data fetch fallback:', err.message);
    res.json({
      topSearches: [
        'Attack on Titan', 'Death Note', 'Fullmetal Alchemist: Brotherhood',
        'One Punch Man', 'Demon Slayer: Kimetsu no Yaiba', 'My Hero Academia',
        'Sword Art Online', 'Hunter x Hunter', 'Naruto', 'Jujutsu Kaisen (TV)'
      ],
      communityPosts: [
        {
          tag: '#General',
          time: '1 day ago',
          replies: '35',
          title: 'Suggest some isekai with an overpowered protagonist',
          snippet: 'Looking for a fun isekai where the MC is overpowered but the plot keeps you hooked throughout.',
          author: 'ShadowHunter',
          avatar: 'https://hianime.ba/theme/avatars/zoro_chibi/avatar-04.png'
        },
        {
          tag: '#Discussion',
          time: '2 days ago',
          replies: '28',
          title: 'What is the most iconic anime transformation of all time?',
          snippet: 'From Super Saiyan to Gear 5 to Gon’s rage—what transformation gave you the biggest chills?',
          author: 'AnimeSensei',
          avatar: 'https://hianime.ba/theme/avatars/zoro_chibi/avatar-02.png'
        },
        {
          tag: '#Recommendations',
          time: '3 days ago',
          replies: '42',
          title: 'Top 10 Fall 2026 anime that everyone should be watching',
          snippet: 'Here is my curated list of the absolute best hidden gems airing right now on AniStream.',
          author: 'SakuraBlossom',
          avatar: 'https://hianime.ba/theme/avatars/zoro_chibi/avatar-06.png'
        }
      ]
    });
  }
});

// ── 1. GET HOME PAGE (SPOTLIGHT & TRENDING) ──────────────────
app.get('/api/home', async (req, res) => {
  try {
    const cached = getCached('home');
    if (cached) return res.json(cached);

    const { data } = await http.get(`${HIANIME_BASE}/home`);
    const $ = cheerio.load(data);

    // Parse Spotlight items
    const spotlights = [];
    $('#slider .swiper-slide').each((i, el) => {
      const $el = $(el);
      const title = $el.find('.desi-head-title').text().trim();
      const desc = $el.find('.desi-description').text().trim();
      const link = $el.find('.btn-play').attr('href') || $el.find('a').attr('href') || '';
      const id = extractSlug(link);
      const poster = $el.find('.film-poster-img').attr('data-src') || $el.find('.film-poster-img').attr('src');
      const score = $el.find('.tick-rate').text().trim() || '8.9';

      if (title && id) {
        spotlights.push({
          id,
          title,
          desc,
          score,
          poster
        });
      }
    });

    // Parse Trending items
    const trending = [];
    $('#trending-home .item, .film_list-wrap .flw-item').each((i, el) => {
      const $el = $(el);
      const title = $el.find('.film-name a').text().trim() || $el.find('.item-title a').text().trim();
      const href = $el.find('.film-name a').attr('href') || $el.find('.film-poster a').attr('href') || '';
      const id = extractSlug(href);
      const poster = $el.find('.film-poster-img').attr('data-src') || $el.find('.film-poster-img').attr('src');
      const sub = $el.find('.tick-sub').text().trim() || '12';
      const dub = $el.find('.tick-dub').text().trim() || '12';
      const type = $el.find('.fdi-item').first().text().trim() || 'TV';

      if (title && id && trending.length < 24) {
        trending.push({
          id,
          title,
          poster,
          subCount: parseInt(sub, 10) || 12,
          dubCount: parseInt(dub, 10) || 12,
          type,
          score: '9.0'
        });
      }
    });

    const result = {
      spotlights: spotlights.slice(0, 8),
      trending: trending.slice(0, 24)
    };

    setCached('home', result);
    res.json(result);
  } catch (err) {
    console.error('Home scrape error:', err.message);
    res.status(500).json({ error: 'Failed to fetch home anime data', details: err.message });
  }
});

// ── 2. SEARCH ANIME ─────────────────────────────────────────
app.get('/api/search', async (req, res) => {
  try {
    const q = req.query.q;
    if (!q || !q.trim()) return res.json({ results: [] });

    const cacheKey = `search_${q.toLowerCase().trim()}`;
    const cached = getCached(cacheKey);
    if (cached) return res.json(cached);

    const { data } = await http.get(`${HIANIME_BASE}/search?keyword=${encodeURIComponent(q)}`);
    const $ = cheerio.load(data);

    const results = [];
    $('.film_list-wrap .flw-item').each((_, el) => {
      const $el = $(el);
      const title = $el.find('.film-name a').text().trim();
      const href = $el.find('.film-name a').attr('href') || $el.find('.film-poster a').attr('href') || '';
      const id = extractSlug(href);
      const poster = $el.find('.film-poster-img').attr('data-src') || $el.find('.film-poster-img').attr('src');
      const sub = $el.find('.tick-sub').text().trim() || '12';
      const dub = $el.find('.tick-dub').text().trim() || '12';
      const type = $el.find('.fdi-item').first().text().trim() || 'TV';
      const duration = $el.find('.fdi-duration').text().trim() || '24m';

      if (title && id) {
        results.push({
          id,
          title,
          poster,
          subCount: parseInt(sub, 10) || 0,
          dubCount: parseInt(dub, 10) || 0,
          type,
          duration,
          score: '8.8'
        });
      }
    });

    const output = { results };
    setCached(cacheKey, output);
    res.json(output);
  } catch (err) {
    console.error('Search error:', err.message);
    res.status(500).json({ error: 'Search failed', details: err.message });
  }
});

// ── 2B. SEARCH SUGGESTIONS (AUTOCOMPLETE DROPDOWN) ──────────
app.get('/api/search/suggestions', async (req, res) => {
  try {
    const q = req.query.keyword || req.query.q || '';
    if (!q || !q.trim()) return res.json({ suggestions: [] });

    const cacheKey = `suggest_${q.toLowerCase().trim()}`;
    const cached = getCached(cacheKey);
    if (cached) return res.json(cached);

    const { data } = await http.get(`${HIANIME_API}/search/suggestions?keyword=${encodeURIComponent(q)}`, {
      headers: { 'X-Requested-With': 'XMLHttpRequest' }
    });

    const $ = cheerio.load(data.html || '');
    const suggestions = [];

    $('.nav-item, a.item').each((_, el) => {
      const $el = $(el);
      const href = $el.attr('href') || '';
      const id = extractSlug(href);
      const title = $el.find('.film-name').text().trim() || $el.attr('title') || '';
      const jname = $el.find('.film-name').attr('data-jname') || '';
      const poster = $el.find('.film-poster img').attr('src') || $el.find('img').attr('src') || '';
      const meta = $el.find('.film-infor').text().trim().replace(/\s+/g, ' ') || '';

      if (title && id) {
        suggestions.push({
          id,
          title,
          jname,
          poster,
          meta
        });
      }
    });

    const output = { suggestions: suggestions.slice(0, 8) };
    setCached(cacheKey, output);
    res.json(output);
  } catch (err) {
    console.error('Suggestions error:', err.message);
    res.status(500).json({ error: 'Suggestions failed', suggestions: [] });
  }
});

// ── 2C. GENRE ANIME BROWSER ─────────────────────────────────
app.get('/api/genres/:genreName', async (req, res) => {
  try {
    const genre = req.params.genreName.toLowerCase().trim().replace(/\s+/g, '-');
    const cacheKey = `genre_${genre}`;
    const cached = getCached(cacheKey);
    if (cached) return res.json(cached);

    const { data } = await http.get(`${HIANIME_BASE}/genres/${genre}`);
    const $ = cheerio.load(data);

    const results = [];
    $('.film_list-wrap .flw-item').each((_, el) => {
      const $el = $(el);
      const title = $el.find('.film-name a').text().trim();
      const href = $el.find('.film-name a').attr('href') || $el.find('.film-poster a').attr('href') || '';
      const id = extractSlug(href);
      const poster = $el.find('.film-poster-img').attr('data-src') || $el.find('.film-poster-img').attr('src');
      const sub = $el.find('.tick-sub').text().trim() || '12';
      const dub = $el.find('.tick-dub').text().trim() || '12';
      const type = $el.find('.fdi-item').first().text().trim() || 'TV';

      if (title && id) {
        results.push({
          id,
          title,
          poster,
          subCount: parseInt(sub, 10) || 12,
          dubCount: parseInt(dub, 10) || 12,
          type,
          score: '9.0'
        });
      }
    });

    const output = { genre, results: results.slice(0, 30) };
    setCached(cacheKey, output);
    res.json(output);
  } catch (err) {
    console.error(`Genre scrape error for ${req.params.genreName}:`, err.message);
    res.status(500).json({ error: 'Genre fetch failed', genre: req.params.genreName, results: [] });
  }
});

// ── 3. ANIME DETAILS ────────────────────────────────────────
app.get('/api/anime/:id', async (req, res) => {
  try {
    const slug = extractSlug(req.params.id);
    const cacheKey = `anime_${slug}`;
    const cached = getCached(cacheKey);
    if (cached) return res.json(cached);

    const { data } = await http.get(`${HIANIME_BASE}/${slug}`);
    const $ = cheerio.load(data);

    const title = $('.anisc-detail .film-name').text().trim() || slug;
    const jpTitle = $('.anisc-info .item:contains("Japanese:") .name').text().trim() || title;
    const desc = $('.film-description .text').text().trim() || 'No description available.';
    const poster = $('.film-poster .film-poster-img').attr('src') || $('.film-poster-img').attr('data-src');
    const rating = $('.film-stats .tick-pg').text().trim() || 'PG-13';
    const quality = $('.film-stats .tick-quality').text().trim() || 'HD';
    const sub = $('.film-stats .tick-sub').text().trim() || '12';
    const dub = $('.film-stats .tick-dub').text().trim() || '12';
    const studio = $('.anisc-info .item:contains("Studios:") a').text().trim() || 'Animation Studio';
    const status = $('.anisc-info .item:contains("Status:") .name').text().trim() || 'Finished Airing';
    const aired = $('.anisc-info .item:contains("Aired:") .name').text().trim() || 'Recent';

    const genres = [];
    $('.anisc-info .item:contains("Genres:") a').each((_, a) => {
      genres.push($(a).text().trim());
    });

    // Extract numeric anime ID (from meta tag or last slug number)
    let animeIdNum = $('meta[name="hi-anime-id"]').attr('content');
    if (!animeIdNum) {
      const match = slug.match(/-(\d+)$/);
      if (match) animeIdNum = match[1];
    }

    const result = {
      id: slug,
      animeIdNum: animeIdNum || '',
      title,
      jpTitle,
      desc,
      poster,
      rating,
      quality,
      subCount: parseInt(sub, 10) || 12,
      dubCount: parseInt(dub, 10) || 12,
      studio,
      status,
      aired,
      genres,
      score: '9.0'
    };

    setCached(cacheKey, result);
    res.json(result);
  } catch (err) {
    console.error(`Anime detail error for ${req.params.id}:`, err.message);
    res.status(500).json({ error: 'Failed to fetch anime details', details: err.message });
  }
});

// ── 4. EPISODES LIST ────────────────────────────────────────
app.get('/api/episodes/:animeId', async (req, res) => {
  try {
    const slug = extractSlug(req.params.animeId);
    let animeIdNum = '';

    // Check if it's already a pure numeric ID
    if (/^\d+$/.test(slug)) {
      animeIdNum = slug;
    } else {
      // Check if ends in -<digits>
      const match = slug.match(/-(\d+)$/);
      if (match) {
        animeIdNum = match[1];
      } else {
        // Fetch detail page to discover meta[name="hi-anime-id"]
        const detailRes = await http.get(`${HIANIME_BASE}/${slug}`);
        const $d = cheerio.load(detailRes.data);
        animeIdNum = $d('meta[name="hi-anime-id"]').attr('content') || '';
      }
    }

    if (!animeIdNum) {
      return res.status(404).json({ error: 'Could not resolve anime ID number', episodes: [] });
    }

    const cacheKey = `episodes_${animeIdNum}`;
    const cached = getCached(cacheKey);
    if (cached) return res.json(cached);

    const url = `${HIANIME_API}/episode/list/${animeIdNum}`;
    const { data } = await http.get(url, {
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'Referer': `${HIANIME_BASE}/${slug}`
      }
    });

    const $ = cheerio.load(data.html);
    const episodes = [];

    $('.ssl-item.ep-item, .ss-list a').each((i, el) => {
      const $el = $(el);
      const epId = $el.attr('data-id');
      const number = parseInt($el.attr('data-number') || (i + 1), 10);
      const title = $el.attr('title') || $el.find('.ep-name').text().trim() || `Episode ${number}`;

      if (epId) {
        episodes.push({
          id: epId,
          num: number,
          title
        });
      }
    });

    const output = { total: episodes.length, episodes };
    setCached(cacheKey, output);
    res.json(output);
  } catch (err) {
    console.error(`Episodes error for ${req.params.animeId}:`, err.message);
    res.status(500).json({ error: 'Failed to fetch episodes', details: err.message, episodes: [] });
  }
});

// ── 5. EPISODE SERVERS & STREAM LINKS ───────────────────────
app.get('/api/servers/:episodeId', async (req, res) => {
  try {
    const epId = req.params.episodeId;
    const cacheKey = `servers_${epId}`;
    const cached = getCached(cacheKey);
    if (cached) return res.json(cached);

    const url = `${HIANIME_API}/episode/servers?episodeId=${epId}`;
    const { data } = await http.get(url, {
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'Referer': `${HIANIME_BASE}/`
      }
    });

    const $ = cheerio.load(data.html);
    const sub = [];
    const dub = [];

    $('.server-item').each((_, el) => {
      const $el = $(el);
      const type = $el.attr('data-type'); // 'sub' or 'dub'
      const name = $el.attr('data-server-name') || $el.text().trim();
      const hash = $el.attr('data-hash');

      let embedUrl = null;
      if (hash) {
        try {
          embedUrl = Buffer.from(hash, 'base64').toString('utf-8');
        } catch (e) {}
      }

      if (embedUrl) {
        const item = {
          name,
          type,
          embedUrl
        };

        if (type === 'dub') {
          dub.push(item);
        } else {
          sub.push(item);
        }
      }
    });

    const output = {
      episodeId: epId,
      sub,
      dub
    };

    setCached(cacheKey, output);
    res.json(output);
  } catch (err) {
    console.error(`Servers error for ep ${req.params.episodeId}:`, err.message);
    res.status(500).json({ error: 'Failed to fetch servers', details: err.message, sub: [], dub: [] });
  }
});

// ── 6. START SERVER WITH AUTOMATIC PORT FALLBACK ────────────
function startServer(port) {
  const server = app.listen(port, () => {
    console.log(`\n🚀 AniStream Server running at: http://localhost:${port}`);
    console.log(`   - Web App UI:     http://localhost:${port}/stream.html\n`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      const nextPort = Number(port) + 1;
      console.warn(`⚠️ Port ${port} is in use. Trying port ${nextPort}...`);
      startServer(nextPort);
    } else {
      console.error('Server error:', err);
    }
  });
}

startServer(PORT);
