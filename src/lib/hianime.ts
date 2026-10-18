import axios from 'axios';
import * as cheerio from 'cheerio';
import {
  AnimeItem,
  SpotlightItem,
  SearchSuggestion,
  EpisodeItem,
  ServerItem,
  ServerResponse,
  AnimeDetail,
  LandingData,
  CatalogData,
} from './types';

export const HIANIME_BASE = 'https://hianime.ba';
export const HIANIME_API = `${HIANIME_BASE}/api/theme`;

const http = axios.create({
  timeout: 12000,
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9',
    Referer: HIANIME_BASE,
  },
});

export function extractSlug(url: string): string {
  if (!url) return '';
  let str = String(url).trim();
  str = str.replace(/^https?:\/\/[^\/]+/i, '');
  str = str.replace(/^\/watch\//i, '/');
  str = str.split('?')[0];
  str = str.replace(/^\/+|\/+$/g, '');
  return str;
}

// In-memory cache
const memoryCache = new Map<string, { time: number; data: any }>();

export function getCached<T>(key: string): T | null {
  const item = memoryCache.get(key);
  if (!item) return null;
  if (Date.now() - item.time > 5 * 60 * 1000) {
    memoryCache.delete(key);
    return null;
  }
  return item.data as T;
}

export function setCached<T>(key: string, data: T): void {
  memoryCache.set(key, { time: Date.now(), data });
}

// 1. Landing Data
export async function fetchLandingData(): Promise<LandingData> {
  const cacheKey = 'landing_data';
  const cached = getCached<LandingData>(cacheKey);
  if (cached) return cached;

  try {
    const { data } = await http.get(HIANIME_BASE);
    const $ = cheerio.load(data);

    const topSearches: string[] = [];
    $('.xhashtag a.item, .search-tags a').each((_, el) => {
      const keyword = $(el).text().trim();
      if (keyword && !topSearches.includes(keyword)) {
        topSearches.push(keyword);
      }
    });

    const communityPosts: any[] = [];
    $('.connecting-list .item').each((_, el) => {
      const $el = $(el);
      const tag = $el.find('.ztag .zt-blue, .ztag span').first().text().trim() || '#General';
      const time = $el.find('.time span').first().text().replace(/\s+/g, ' ').trim() || 'Recently';
      const replies = $el.find('.gi-stats div').text().trim() || '18';
      const title = $el.find('.item-name a').text().trim();
      const snippet = $el.find('.subject div').text().trim();
      const author = $el.find('.cn-owner .user-name').text().trim() || 'AnimeFan';
      const avatar =
        $el.find('.profile-avatar img').attr('src') ||
        'https://hianime.ba/theme/avatars/zoro_chibi/avatar-04.png';

      if (title) {
        communityPosts.push({
          tag,
          time,
          replies,
          title,
          snippet,
          author,
          avatar,
        });
      }
    });

    const result: LandingData = {
      topSearches:
        topSearches.length > 0
          ? topSearches
          : [
              'Attack on Titan',
              'Death Note',
              'Fullmetal Alchemist: Brotherhood',
              'One Punch Man',
              'Demon Slayer: Kimetsu no Yaiba',
              'My Hero Academia',
              'Sword Art Online',
              'Hunter x Hunter',
              'Naruto',
              'Jujutsu Kaisen (TV)',
            ],
      communityPosts: communityPosts.slice(0, 6),
    };

    setCached(cacheKey, result);
    return result;
  } catch (err: any) {
    console.warn('Landing data fetch fallback:', err.message);
    return {
      topSearches: [
        'Attack on Titan',
        'Death Note',
        'Fullmetal Alchemist: Brotherhood',
        'One Punch Man',
        'Demon Slayer: Kimetsu no Yaiba',
        'My Hero Academia',
        'Sword Art Online',
        'Hunter x Hunter',
        'Naruto',
        'Jujutsu Kaisen (TV)',
      ],
      communityPosts: [
        {
          tag: '#General',
          time: '1 day ago',
          replies: '35',
          title: 'Suggest some isekai with an overpowered protagonist',
          snippet:
            'Looking for a fun isekai where the MC is overpowered but the plot keeps you hooked throughout.',
          author: 'ShadowHunter',
          avatar: 'https://hianime.ba/theme/avatars/zoro_chibi/avatar-04.png',
        },
        {
          tag: '#Discussion',
          time: '2 days ago',
          replies: '28',
          title: 'What is the most iconic anime transformation of all time?',
          snippet:
            'From Super Saiyan to Gear 5 to Gon’s rage—what transformation gave you the biggest chills?',
          author: 'AnimeSensei',
          avatar: 'https://hianime.ba/theme/avatars/zoro_chibi/avatar-02.png',
        },
        {
          tag: '#Recommendations',
          time: '3 days ago',
          replies: '42',
          title: 'Top 10 Fall 2026 anime that everyone should be watching',
          snippet:
            'Here is my curated list of the absolute best hidden gems airing right now on AniStream.',
          author: 'SakuraBlossom',
          avatar: 'https://hianime.ba/theme/avatars/zoro_chibi/avatar-06.png',
        },
      ],
    };
  }
}

// 2. Catalog / Home Data
export async function fetchHomeCatalog(): Promise<CatalogData> {
  const cacheKey = 'home_catalog';
  const cached = getCached<CatalogData>(cacheKey);
  if (cached) return cached;

  try {
    const { data } = await http.get(`${HIANIME_BASE}/home`);
    const $ = cheerio.load(data);

    const spotlights: SpotlightItem[] = [];
    $('#slider .swiper-slide').each((i, el) => {
      const $el = $(el);
      const title = $el.find('.desi-head-title').text().trim();
      const desc = $el.find('.desi-description').text().trim();
      const link = $el.find('.btn-play').attr('href') || $el.find('a').attr('href') || '';
      const id = extractSlug(link);
      const poster =
        $el.find('.film-poster-img').attr('data-src') ||
        $el.find('.film-poster-img').attr('src') ||
        '';
      const score = $el.find('.tick-rate').text().trim() || '8.9';

      if (title && id) {
        spotlights.push({
          id,
          title,
          desc,
          score,
          poster,
          type: 'TV Series',
          quality: 'HD',
          subCount: 12,
          dubCount: 12,
        });
      }
    });

    const trending: AnimeItem[] = [];
    $('#trending-home .item, .film_list-wrap .flw-item').each((i, el) => {
      const $el = $(el);
      const title =
        $el.find('.film-name a').text().trim() || $el.find('.item-title a').text().trim();
      const href =
        $el.find('.film-name a').attr('href') || $el.find('.film-poster a').attr('href') || '';
      const id = extractSlug(href);
      const poster =
        $el.find('.film-poster-img').attr('data-src') ||
        $el.find('.film-poster-img').attr('src') ||
        '';
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
          score: '9.0',
        });
      }
    });

    const result: CatalogData = {
      spotlights: spotlights.slice(0, 8),
      trending: trending.slice(0, 24),
    };

    setCached(cacheKey, result);
    return result;
  } catch (err: any) {
    console.error('Home catalog scrape error:', err.message);
    throw err;
  }
}

// 3. Search Anime
export async function fetchSearchAnime(query: string): Promise<AnimeItem[]> {
  const q = query.trim();
  if (!q) return [];

  const cacheKey = `search_${q.toLowerCase()}`;
  const cached = getCached<AnimeItem[]>(cacheKey);
  if (cached) return cached;

  try {
    const { data } = await http.get(`${HIANIME_BASE}/search?keyword=${encodeURIComponent(q)}`);
    const $ = cheerio.load(data);

    const results: AnimeItem[] = [];
    $('.film_list-wrap .flw-item').each((_, el) => {
      const $el = $(el);
      const title = $el.find('.film-name a').text().trim();
      const href =
        $el.find('.film-name a').attr('href') || $el.find('.film-poster a').attr('href') || '';
      const id = extractSlug(href);
      const poster =
        $el.find('.film-poster-img').attr('data-src') ||
        $el.find('.film-poster-img').attr('src') ||
        '';
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
          score: '8.8',
        });
      }
    });

    setCached(cacheKey, results);
    return results;
  } catch (err: any) {
    console.error('Search error:', err.message);
    return [];
  }
}

// 4. Search Suggestions Dropdown
export async function fetchSearchSuggestions(query: string): Promise<SearchSuggestion[]> {
  const q = query.trim();
  if (!q) return [];

  const cacheKey = `suggest_${q.toLowerCase()}`;
  const cached = getCached<SearchSuggestion[]>(cacheKey);
  if (cached) return cached;

  try {
    const { data } = await http.get(
      `${HIANIME_API}/search/suggestions?keyword=${encodeURIComponent(q)}`,
      {
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
      }
    );

    const $ = cheerio.load(data.html || '');
    const suggestions: SearchSuggestion[] = [];

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
          meta,
        });
      }
    });

    const result = suggestions.slice(0, 8);
    setCached(cacheKey, result);
    return result;
  } catch (err: any) {
    console.error('Suggestions error:', err.message);
    return [];
  }
}

// 5. Genre Browser
export async function fetchGenreAnime(genreName: string): Promise<AnimeItem[]> {
  const genre = genreName.toLowerCase().trim().replace(/\s+/g, '-');
  const cacheKey = `genre_${genre}`;
  const cached = getCached<AnimeItem[]>(cacheKey);
  if (cached) return cached;

  try {
    const { data } = await http.get(`${HIANIME_BASE}/genres/${genre}`);
    const $ = cheerio.load(data);

    const results: AnimeItem[] = [];
    $('.film_list-wrap .flw-item').each((_, el) => {
      const $el = $(el);
      const title = $el.find('.film-name a').text().trim();
      const href =
        $el.find('.film-name a').attr('href') || $el.find('.film-poster a').attr('href') || '';
      const id = extractSlug(href);
      const poster =
        $el.find('.film-poster-img').attr('data-src') ||
        $el.find('.film-poster-img').attr('src') ||
        '';
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
          score: '9.0',
        });
      }
    });

    const result = results.slice(0, 30);
    setCached(cacheKey, result);
    return result;
  } catch (err: any) {
    console.error(`Genre scrape error for ${genreName}:`, err.message);
    return [];
  }
}

// 6. Anime Details
export async function fetchAnimeDetails(slugOrId: string): Promise<AnimeDetail> {
  const slug = extractSlug(slugOrId);
  const cacheKey = `anime_${slug}`;
  const cached = getCached<AnimeDetail>(cacheKey);
  if (cached) return cached;

  try {
    const { data } = await http.get(`${HIANIME_BASE}/${slug}`);
    const $ = cheerio.load(data);

    const title = $('.anisc-detail .film-name').text().trim() || slug;
    const jpTitle = $('.anisc-info .item:contains("Japanese:") .name').text().trim() || title;
    const desc =
      $('.film-description .text').text().trim() ||
      'No description available for this anime series.';
    const poster =
      $('.film-poster .film-poster-img').attr('src') ||
      $('.film-poster-img').attr('data-src') ||
      '';
    const rating = $('.film-stats .tick-pg').text().trim() || 'PG-13';
    const quality = $('.film-stats .tick-quality').text().trim() || 'HD';
    const sub = $('.film-stats .tick-sub').text().trim() || '12';
    const dub = $('.film-stats .tick-dub').text().trim() || '12';
    const studio =
      $('.anisc-info .item:contains("Studios:") a').text().trim() || 'Animation Studio';
    const status =
      $('.anisc-info .item:contains("Status:") .name').text().trim() || 'Finished Airing';
    const aired = $('.anisc-info .item:contains("Aired:") .name').text().trim() || 'Recent';

    const genres: string[] = [];
    $('.anisc-info .item:contains("Genres:") a').each((_, a) => {
      genres.push($(a).text().trim());
    });

    let animeIdNum = $('meta[name="hi-anime-id"]').attr('content');
    if (!animeIdNum) {
      const match = slug.match(/-(\d+)$/);
      if (match) animeIdNum = match[1];
    }

    const result: AnimeDetail = {
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
      genres: genres.length > 0 ? genres : ['Action', 'Fantasy'],
      score: '9.0',
    };

    setCached(cacheKey, result);
    return result;
  } catch (err: any) {
    console.error(`Anime detail error for ${slugOrId}:`, err.message);
    throw err;
  }
}

// 7. Episodes List
export async function fetchAnimeEpisodes(slugOrId: string): Promise<EpisodeItem[]> {
  const slug = extractSlug(slugOrId);
  let animeIdNum = '';

  if (/^\d+$/.test(slug)) {
    animeIdNum = slug;
  } else {
    const match = slug.match(/-(\d+)$/);
    if (match) {
      animeIdNum = match[1];
    } else {
      const detail = await fetchAnimeDetails(slug);
      animeIdNum = detail.animeIdNum;
    }
  }

  if (!animeIdNum) return [];

  const cacheKey = `episodes_${animeIdNum}`;
  const cached = getCached<EpisodeItem[]>(cacheKey);
  if (cached) return cached;

  try {
    const url = `${HIANIME_API}/episode/list/${animeIdNum}`;
    const { data } = await http.get(url, {
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        Referer: `${HIANIME_BASE}/${slug}`,
      },
    });

    const $ = cheerio.load(data.html || '');
    const episodes: EpisodeItem[] = [];

    $('.ssl-item.ep-item, .ss-list a').each((i, el) => {
      const $el = $(el);
      const epId = $el.attr('data-id');
      const number = parseInt($el.attr('data-number') || String(i + 1), 10);
      const title =
        $el.attr('title') || $el.find('.ep-name').text().trim() || `Episode ${number}`;

      if (epId) {
        episodes.push({
          id: epId,
          num: number,
          title,
        });
      }
    });

    setCached(cacheKey, episodes);
    return episodes;
  } catch (err: any) {
    console.error(`Episodes error for ${slugOrId}:`, err.message);
    return [];
  }
}

// 8. Servers & Stream Links (with base64 data-hash decoding)
export async function fetchEpisodeServers(episodeId: string): Promise<ServerResponse> {
  const cacheKey = `servers_${episodeId}`;
  const cached = getCached<ServerResponse>(cacheKey);
  if (cached) return cached;

  try {
    const url = `${HIANIME_API}/episode/servers?episodeId=${episodeId}`;
    const { data } = await http.get(url, {
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        Referer: `${HIANIME_BASE}/`,
      },
    });

    const $ = cheerio.load(data.html || '');
    const sub: ServerItem[] = [];
    const dub: ServerItem[] = [];

    $('.server-item').each((_, el) => {
      const $el = $(el);
      const type = ($el.attr('data-type') || 'sub') as 'sub' | 'dub';
      const name = $el.attr('data-server-name') || $el.text().trim();
      const hash = $el.attr('data-hash');

      let embedUrl: string | null = null;
      if (hash) {
        try {
          embedUrl = Buffer.from(hash, 'base64').toString('utf-8');
        } catch (e) {}
      }

      if (embedUrl) {
        const item: ServerItem = {
          name,
          type,
          embedUrl,
        };

        if (type === 'dub') {
          dub.push(item);
        } else {
          sub.push(item);
        }
      }
    });

    const output: ServerResponse = {
      episodeId,
      sub,
      dub,
    };

    setCached(cacheKey, output);
    return output;
  } catch (err: any) {
    console.error(`Servers error for episode ${episodeId}:`, err.message);
    return { episodeId, sub: [], dub: [] };
  }
}
