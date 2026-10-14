/* ══════════════════════════════════════════════════════════
   AniStream — stream.js
   Full streaming architecture with live HiAnime backend proxy
   ══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const API_BASE = ''; // relative to current origin (localhost:3000)

  // ── 1. FALLBACK / OFFLINE DATABASE ────────────────────────
  const FALLBACK_DATABASE = [
    {
      id: 'the-ramparts-of-ice-100',
      numericId: '100',
      title: 'The Ramparts of Ice',
      jpTitle: 'Koori no Jouheki',
      score: '9.61',
      rating: 'PG-13',
      quality: 'HD',
      type: 'TV',
      duration: '24m',
      subCount: 14,
      dubCount: 14,
      studio: 'Studio KAI',
      status: 'Finished Airing',
      aired: 'Apr 2, 2026 to Jul 2, 2026',
      genres: ['Comedy', 'Drama', 'Slice of Life', 'Romance', 'School'],
      banner: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1600&auto=format&fit=crop&q=80',
      poster: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
      desc: 'Minato Koyuki keeps people at arm\'s length behind an emotional wall of ice. But when unexpected bonds begin forming in high school, her guarded world starts melting in unforeseen and beautiful ways.',
      episodes: Array.from({ length: 14 }, (_, i) => ({
        id: '2928',
        num: i + 1,
        title: `Episode ${i + 1}`,
        introStart: 12,
        introEnd: 88,
        embedUrl: 'https://megaplay.buzz/stream/s-2/169519/sub?s=tcdn',
        streams: {
          sub: [
            { server: 'MegaPlay', url: 'https://test-streams.mux.dev/x360pk5/x360pk5.m3u8', type: 'hls' },
            { server: 'VidStreaming', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4', type: 'mp4' }
          ],
          dub: [
            { server: 'MegaPlay', url: 'https://test-streams.mux.dev/x360pk5/x360pk5.m3u8', type: 'hls' }
          ]
        }
      }))
    },
    {
      id: 'solo-leveling-arise-101',
      numericId: '101',
      title: 'Solo Leveling: Arise',
      jpTitle: 'Ore dake Level Up na Ken',
      score: '8.87',
      rating: 'R-17+',
      quality: 'HD',
      type: 'TV',
      duration: '24m',
      subCount: 12,
      dubCount: 12,
      studio: 'A-1 Pictures',
      status: 'Finished Airing',
      aired: 'Jan 7, 2024 to Mar 31, 2024',
      genres: ['Action', 'Adventure', 'Fantasy', 'Supernatural'],
      banner: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1600&auto=format&fit=crop&q=80',
      poster: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=600&auto=format&fit=crop&q=80',
      desc: 'In a world where hunters face deadly magical beasts in mysterious dungeons, the weakest E-rank hunter Sung Jinwoo receives a unique quest system that allows him to level up without limits.',
      episodes: Array.from({ length: 12 }, (_, i) => ({
        id: `${3100 + i}`,
        num: i + 1,
        title: `Episode ${i + 1}`,
        introStart: 10,
        introEnd: 85,
        embedUrl: 'https://megaplay.buzz/stream/s-2/169519/sub?s=tcdn',
        streams: {
          sub: [
            { server: 'MegaPlay', url: 'https://test-streams.mux.dev/x360pk5/x360pk5.m3u8', type: 'hls' },
            { server: 'VidStreaming', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', type: 'mp4' }
          ],
          dub: [
            { server: 'MegaPlay', url: 'https://test-streams.mux.dev/x360pk5/x360pk5.m3u8', type: 'hls' }
          ]
        }
      }))
    }
  ];

  // ── 2. STATE ──────────────────────────────────────────────
  const state = {
    animeList: [...FALLBACK_DATABASE],
    spotlights: [...FALLBACK_DATABASE],
    currentAnime: null,
    currentEpIndex: 0,
    currentServerType: 'sub', // 'sub' | 'dub'
    currentServerName: 'HD-1',
    playerMode: 'embed', // 'embed' (live stream) | 'custom' (custom hls player)
    currentFilter: 'all',
    searchQuery: '',
    searchDebounceTimer: null,
    hlsInstance: null,
    controlsTimeout: null,
    heroSlideIndex: 0,
    heroTimer: null,
    watchHistory: {},
    watchlist: []
  };

  // Load localStorage state
  try {
    const savedHist = localStorage.getItem('anistream_history');
    if (savedHist) state.watchHistory = JSON.parse(savedHist);
    const savedList = localStorage.getItem('anistream_watchlist');
    if (savedList) state.watchlist = JSON.parse(savedList);
  } catch (e) {}

  function saveHistory(animeId, epId, time) {
    state.watchHistory[animeId] = {
      epId,
      time: Math.floor(time || 0),
      updatedAt: Date.now()
    };
    try {
      localStorage.setItem('anistream_history', JSON.stringify(state.watchHistory));
    } catch (e) {}
  }

  // ── 3. DOM ELEMENTS ───────────────────────────────────────
  const el = {
    siteHeader: document.getElementById('siteHeader'),
    logoBtn: document.getElementById('logoBtn'),
    headerSearch: document.getElementById('headerSearch'),
    searchSuggest: document.getElementById('searchSuggest'),
    searchLoading: document.getElementById('searchLoading'),
    searchSuggestList: document.getElementById('searchSuggestList'),
    searchSuggestFooter: document.getElementById('searchSuggestFooter'),
    genreBar: document.getElementById('genreBar'),
    sectionTitle: document.getElementById('sectionTitle'),
    homeView: document.getElementById('homeView'),
    heroSection: document.getElementById('heroSection'),
    heroBg: document.getElementById('heroBg'),
    heroContent: document.getElementById('heroContent'),
    heroDots: document.getElementById('heroDots'),
    filterTabs: document.getElementById('filterTabs'),
    animeGrid: document.getElementById('animeGrid'),
    detailView: document.getElementById('detailView'),
    detailBanner: document.getElementById('detailBanner'),
    detailPoster: document.getElementById('detailPoster'),
    detailBadges: document.getElementById('detailBadges'),
    watchNowBtn: document.getElementById('watchNowBtn'),
    addListBtn: document.getElementById('addListBtn'),
    breadcrumb: document.getElementById('breadcrumb'),
    detailTitle: document.getElementById('detailTitle'),
    detailMeta: document.getElementById('detailMeta'),
    detailDesc: document.getElementById('detailDesc'),
    detailStats: document.getElementById('detailStats'),
    epTypeTabs: document.getElementById('epTypeTabs'),
    episodesGrid: document.getElementById('episodesGrid'),
    watchView: document.getElementById('watchView'),
    watchBreadcrumb: document.getElementById('watchBreadcrumb'),
    playerWrapper: document.getElementById('playerWrapper'),
    mainVideo: document.getElementById('mainVideo'),
    mainEmbed: document.getElementById('mainEmbed'),
    playerControls: document.getElementById('playerControls'),
    skipIntroBtn: document.getElementById('skipIntroBtn'),
    ctrlTitle: document.getElementById('ctrlTitle'),
    pipBtn: document.getElementById('pipBtn'),
    ctrlCenter: document.getElementById('ctrlCenter'),
    centerPlayBtn: document.getElementById('centerPlayBtn'),
    progressWrap: document.getElementById('progressWrap'),
    progressBuffered: document.getElementById('progressBuffered'),
    progressPlayed: document.getElementById('progressPlayed'),
    progressThumb: document.getElementById('progressThumb'),
    playPauseBtn: document.getElementById('playPauseBtn'),
    playIcon: document.getElementById('playIcon'),
    pauseIcon: document.getElementById('pauseIcon'),
    skipBack: document.getElementById('skipBack'),
    skipFwd: document.getElementById('skipFwd'),
    muteBtn: document.getElementById('muteBtn'),
    volumeSlider: document.getElementById('volumeSlider'),
    timeDisplay: document.getElementById('timeDisplay'),
    qualitySelect: document.getElementById('qualitySelect'),
    fullscreenBtn: document.getElementById('fullscreenBtn'),
    bufferingOverlay: document.getElementById('bufferingOverlay'),
    subServers: document.getElementById('subServers'),
    dubServers: document.getElementById('dubServers'),
    modeEmbedBtn: document.getElementById('modeEmbedBtn'),
    modeCustomBtn: document.getElementById('modeCustomBtn'),
    epInfoBar: document.getElementById('epInfoBar'),
    sidebarEpList: document.getElementById('sidebarEpList'),
    loadingScreen: document.getElementById('loadingScreen')
  };

  // ── 4. VIEW ROUTING ───────────────────────────────────────
  function showView(viewName) {
    el.homeView.classList.add('hidden');
    el.detailView.classList.add('hidden');
    el.watchView.classList.add('hidden');

    if (viewName === 'home') {
      el.homeView.classList.remove('hidden');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (viewName === 'detail') {
      el.detailView.classList.remove('hidden');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (viewName === 'watch') {
      el.watchView.classList.remove('hidden');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  // Header scroll styling
  window.addEventListener('scroll', () => {
    el.siteHeader.classList.toggle('scrolled', window.scrollY > 40);
  });

  // Navigation links
  function resetToHome() {
    pauseVideo();
    if (el.mainEmbed) el.mainEmbed.src = 'about:blank';
    showView('home');
    el.sectionTitle.textContent = 'Trending Now';
    el.genreBar.querySelectorAll('.genre-pill').forEach(p => p.classList.toggle('active', p.dataset.genre === 'all'));
    fetchLiveHomeData();
  }

  el.logoBtn.addEventListener('click', (e) => { e.preventDefault(); resetToHome(); });
  document.getElementById('navHome')?.addEventListener('click', (e) => { e.preventDefault(); resetToHome(); });
  document.getElementById('navMovies')?.addEventListener('click', (e) => {
    e.preventDefault();
    executeFullSearch('Movie');
  });
  document.getElementById('navSeries')?.addEventListener('click', (e) => {
    e.preventDefault();
    selectGenre('action', 'TV Series (Action)');
  });
  document.getElementById('navPopular')?.addEventListener('click', (e) => {
    e.preventDefault();
    selectGenre('shounen', 'Most Popular (Shounen)');
  });

  // ── 5. LIVE API INTEGRATION ───────────────────────────────
  async function fetchLiveHomeData() {
    try {
      const res = await fetch(`${API_BASE}/api/home`);
      if (!res.ok) throw new Error('API returned ' + res.status);
      const data = await res.json();

      if (data.spotlights && data.spotlights.length > 0) {
        state.spotlights = data.spotlights.map(s => ({
          id: s.id,
          numericId: s.id.split('-').pop(),
          title: s.title,
          jpTitle: s.title,
          desc: s.desc,
          score: s.score || '9.0',
          type: 'TV',
          quality: 'HD',
          subCount: 12,
          dubCount: 12,
          aired: 'Recent',
          banner: s.poster,
          poster: s.poster
        }));
      }

      if (data.trending && data.trending.length > 0) {
        state.animeList = data.trending.map(t => ({
          id: t.id,
          numericId: t.id.split('-').pop(),
          title: t.title,
          jpTitle: t.title,
          score: t.score || '9.0',
          rating: 'PG-13',
          quality: 'HD',
          type: t.type || 'TV',
          duration: '24m',
          subCount: t.subCount || 12,
          dubCount: t.dubCount || 12,
          poster: t.poster,
          banner: t.poster,
          desc: 'Stream this trending series online in high definition on AniStream.'
        }));
      }

      initHero();
      renderAnimeGrid();
    } catch (err) {
      console.warn('Live API unavailable, using internal catalog:', err);
      initHero();
      renderAnimeGrid();
    }
  }

  async function fetchAnimeEpisodes(animeId) {
    try {
      const res = await fetch(`${API_BASE}/api/episodes/${animeId}`);
      if (!res.ok) throw new Error('Failed to fetch episodes');
      const data = await res.json();
      return data.episodes || [];
    } catch (err) {
      console.warn('Episodes fetch fallback:', err);
      return Array.from({ length: 12 }, (_, i) => ({
        id: `${i + 1}`,
        num: i + 1,
        title: `Episode ${i + 1}`
      }));
    }
  }

  async function fetchEpisodeServers(episodeId) {
    try {
      const res = await fetch(`${API_BASE}/api/servers/${episodeId}`);
      if (!res.ok) throw new Error('Failed to fetch servers');
      return await res.json();
    } catch (err) {
      console.warn('Servers fetch error:', err);
      return { sub: [], dub: [] };
    }
  }

  // ── 6. HERO SPOTLIGHT ─────────────────────────────────────
  function initHero() {
    renderHeroSlide(0);
    renderHeroDots();
    startHeroTimer();
  }

  function renderHeroSlide(index) {
    state.heroSlideIndex = index;
    const item = state.spotlights[index] || state.animeList[0];
    if (!item) return;

    el.heroBg.style.backgroundImage = `url('${item.banner || item.poster}')`;
    el.heroContent.innerHTML = `
      <div class="hero-badge">Spotlight #${index + 1}</div>
      <h1 class="hero-title">${item.title}</h1>
      <div class="hero-meta">
        <span class="hero-score">★ ${item.score}</span>
        <span class="hero-tag">${item.type}</span>
        <span class="hero-tag">${item.quality || 'HD'}</span>
        <span class="hero-tag">SUB: ${item.subCount || 12}</span>
        <span class="hero-tag">DUB: ${item.dubCount || 12}</span>
      </div>
      <p class="hero-desc">${item.desc}</p>
      <div class="hero-actions">
        <button class="btn-hero-watch" data-hero-watch="${item.id}">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5 3 19 12 5 21 5 3"/>
          </svg>
          Watch Now
        </button>
        <button class="btn-hero-info" data-hero-info="${item.id}">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
          Detail
        </button>
      </div>
    `;

    el.heroContent.querySelector('[data-hero-watch]').onclick = () => openWatchView(item, 0);
    el.heroContent.querySelector('[data-hero-info]').onclick = () => openDetailView(item);

    updateHeroDots();
  }

  function renderHeroDots() {
    el.heroDots.innerHTML = '';
    state.spotlights.forEach((_, i) => {
      const dot = document.createElement('div');
      dot.className = `hero-dot ${i === state.heroSlideIndex ? 'active' : ''}`;
      dot.onclick = () => {
        clearInterval(state.heroTimer);
        renderHeroSlide(i);
        startHeroTimer();
      };
      el.heroDots.appendChild(dot);
    });
  }

  function updateHeroDots() {
    el.heroDots.querySelectorAll('.hero-dot').forEach((dot, i) => {
      dot.classList.toggle('active', i === state.heroSlideIndex);
    });
  }

  function startHeroTimer() {
    clearInterval(state.heroTimer);
    state.heroTimer = setInterval(() => {
      if (state.spotlights.length > 0) {
        const next = (state.heroSlideIndex + 1) % state.spotlights.length;
        renderHeroSlide(next);
      }
    }, 6000);
  }

  // ── 7. BROWSE & SEARCH ────────────────────────────────────
  function renderAnimeGrid() {
    let list = state.animeList;

    if (state.currentFilter === 'sub') {
      list = list.filter(a => (a.subCount || 0) > 0);
    } else if (state.currentFilter === 'dub') {
      list = list.filter(a => (a.dubCount || 0) > 0);
    }

    if (list.length === 0) {
      el.animeGrid.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 60px 20px; text-align: center; color: var(--text-2);">
          <h3>No anime found</h3>
          <p style="margin-top: 8px; font-size: 0.85rem; color: var(--text-3);">Try searching with different keywords</p>
        </div>
      `;
      return;
    }

    el.animeGrid.innerHTML = list.map(item => `
      <div class="anime-card" data-anime-id="${item.id}">
        <div class="card-poster-wrap">
          <img class="card-poster" src="${item.poster}" alt="${item.title}" loading="lazy" />
          <div class="card-ticks">
            <span class="tick-item tick-pg">${item.rating || 'PG-13'}</span>
            <span class="tick-item tick-hd">${item.quality || 'HD'}</span>
            <span class="tick-item tick-sub">SUB ${item.subCount || 12}</span>
            <span class="tick-item tick-dub">DUB ${item.dubCount || 12}</span>
          </div>
          <div class="card-overlay">
            <div class="card-play-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
            </div>
          </div>
        </div>
        <div class="card-info">
          <h4 class="card-title" title="${item.title}">${item.title}</h4>
          <div class="card-meta">
            <span class="card-score">★ ${item.score || '9.0'}</span> • ${item.type || 'TV'}
          </div>
        </div>
      </div>
    `).join('');

    el.animeGrid.querySelectorAll('.anime-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.dataset.animeId;
        const anime = state.animeList.find(a => a.id === id) || state.spotlights.find(a => a.id === id);
        if (anime) openDetailView(anime);
      });
    });
  }

  // Filter tabs
  el.filterTabs.querySelectorAll('.filter-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      el.filterTabs.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      state.currentFilter = tab.dataset.filter;
      renderAnimeGrid();
    });
  });

  // ── SEARCH SUGGESTIONS & AUTOCOMPLETE (HiAnime Style) ────
  el.headerSearch.addEventListener('input', (e) => {
    const q = e.target.value.trim();
    clearTimeout(state.searchDebounceTimer);

    if (q.length < 2) {
      el.searchSuggest.classList.add('hidden');
      if (q.length === 0) {
        el.sectionTitle.textContent = 'Trending Now';
        fetchLiveHomeData();
      }
      return;
    }

    // Show suggestion box with loading spinner
    el.searchSuggest.classList.remove('hidden');
    el.searchLoading.classList.remove('hidden');
    el.searchSuggestList.innerHTML = '';
    el.searchSuggestFooter.innerHTML = '';

    state.searchDebounceTimer = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/search/suggestions?keyword=${encodeURIComponent(q)}`);
        el.searchLoading.classList.add('hidden');

        if (res.ok) {
          const data = await res.json();
          if (data.suggestions && data.suggestions.length > 0) {
            el.searchSuggestList.innerHTML = data.suggestions.map(item => `
              <div class="suggest-item" data-suggest-id="${item.id}">
                <img class="suggest-poster" src="${item.poster || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=100'}" alt="${item.title}" />
                <div class="suggest-info">
                  <div class="suggest-title" title="${item.title}">${item.title}</div>
                  ${item.jname ? `<div class="suggest-jname">${item.jname}</div>` : ''}
                  <div class="suggest-meta">${item.meta || 'TV Series'}</div>
                </div>
              </div>
            `).join('');

            // Hook click on suggestion items
            el.searchSuggestList.querySelectorAll('.suggest-item').forEach(sEl => {
              sEl.addEventListener('click', () => {
                const id = sEl.dataset.suggestId;
                const found = data.suggestions.find(s => s.id === id);
                el.searchSuggest.classList.add('hidden');
                openDetailView({ id, title: found?.title || id, poster: found?.poster });
              });
            });

            // Footer: View all results
            el.searchSuggestFooter.innerHTML = `
              <a class="suggest-view-all">View all results for "${q}" →</a>
            `;
            el.searchSuggestFooter.querySelector('.suggest-view-all').onclick = () => {
              el.searchSuggest.classList.add('hidden');
              executeFullSearch(q);
            };
            return;
          }
        }
      } catch (err) {
        console.warn('Suggestion fetch error:', err);
      }
      el.searchLoading.classList.add('hidden');
      el.searchSuggestList.innerHTML = '<div style="padding:16px;text-align:center;font-size:0.8rem;color:var(--text-3);">No suggestions found</div>';
    }, 280);
  });

  // Pressing Enter executes full search
  el.headerSearch.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const q = el.headerSearch.value.trim();
      if (q) {
        el.searchSuggest.classList.add('hidden');
        executeFullSearch(q);
      }
    }
  });

  // Clicking outside closes suggestions box
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.header-search-wrap')) {
      el.searchSuggest.classList.add('hidden');
    }
  });

  async function executeFullSearch(q) {
    el.sectionTitle.textContent = `Search results for: "${q}"`;
    el.animeGrid.innerHTML = `
      <div style="grid-column: 1 / -1; padding: 60px 20px; text-align: center; color: var(--text-2);">
        <div class="spinner" style="margin: 0 auto 16px;"></div>
        Searching catalog for "${q}"…
      </div>
    `;

    try {
      const res = await fetch(`${API_BASE}/api/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          state.animeList = data.results;
          renderAnimeGrid();
          return;
        }
      }
    } catch (err) {
      console.warn('Full search error:', err);
    }
    el.animeGrid.innerHTML = `
      <div style="grid-column: 1 / -1; padding: 60px 20px; text-align: center; color: var(--text-2);">
        <h3>No anime found for "${q}"</h3>
        <p style="margin-top: 8px; font-size: 0.85rem; color: var(--text-3);">Try checking for typos or searching another title</p>
      </div>
    `;
  }

  // ── GENRE EXPLORER (HiAnime Style) ────────────────────────
  async function selectGenre(genre, label) {
    el.genreBar.querySelectorAll('.genre-pill').forEach(p => {
      p.classList.toggle('active', p.dataset.genre === genre);
    });

    if (genre === 'all') {
      el.sectionTitle.textContent = 'Trending Now';
      fetchLiveHomeData();
      return;
    }

    const genreLabel = label || genre.charAt(0).toUpperCase() + genre.slice(1);
    el.sectionTitle.textContent = `Genre: ${genreLabel}`;
    el.animeGrid.innerHTML = `
      <div style="grid-column: 1 / -1; padding: 60px 20px; text-align: center; color: var(--text-2);">
        <div class="spinner" style="margin: 0 auto 16px;"></div>
        Loading ${genreLabel} anime from HiAnime…
      </div>
    `;

    try {
      const res = await fetch(`${API_BASE}/api/genres/${encodeURIComponent(genre)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          state.animeList = data.results;
          renderAnimeGrid();
          return;
        }
      }
    } catch (err) {
      console.warn('Genre load error:', err);
    }

    el.animeGrid.innerHTML = `
      <div style="grid-column: 1 / -1; padding: 60px 20px; text-align: center; color: var(--text-2);">
        <h3>No titles found for ${genreLabel}</h3>
        <p style="margin-top: 8px; font-size: 0.85rem; color: var(--text-3);">Try exploring other genres from the bar above</p>
      </div>
    `;
  }

  el.genreBar.querySelectorAll('.genre-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      const genre = pill.dataset.genre;
      const genreLabel = pill.textContent.replace('✨', '').trim();
      selectGenre(genre, genreLabel);
    });
  });

  // ── 8. DETAIL VIEW ────────────────────────────────────────
  async function fetchAnimeDetails(animeId) {
    try {
      const res = await fetch(`${API_BASE}/api/anime/${encodeURIComponent(animeId)}`);
      if (res.ok) return await res.json();
    } catch (err) {
      console.warn('Anime details fetch error:', err);
    }
    return null;
  }

  function renderDetailViewContent(anime) {
    el.detailBanner.style.backgroundImage = `url('${anime.banner || anime.poster}')`;
    el.detailPoster.src = anime.poster;
    el.detailPoster.alt = anime.title;

    el.detailBadges.innerHTML = `
      <span class="tick-item tick-pg">${anime.rating || 'PG-13'}</span>
      <span class="tick-item tick-hd">${anime.quality || 'HD'}</span>
      <span class="tick-item tick-sub">SUB: ${anime.subCount || 12}</span>
      <span class="tick-item tick-dub">DUB: ${anime.dubCount || 12}</span>
    `;

    el.watchNowBtn.onclick = () => openWatchView(anime, 0);

    const inList = state.watchlist.includes(anime.id);
    el.addListBtn.textContent = inList ? '✓ In Your List' : '+ Add to List';
    el.addListBtn.onclick = () => {
      const idx = state.watchlist.indexOf(anime.id);
      if (idx > -1) {
        state.watchlist.splice(idx, 1);
        el.addListBtn.textContent = '+ Add to List';
      } else {
        state.watchlist.push(anime.id);
        el.addListBtn.textContent = '✓ In Your List';
      }
      try { localStorage.setItem('anistream_watchlist', JSON.stringify(state.watchlist)); } catch (e) {}
    };

    el.breadcrumb.innerHTML = `
      <a href="#" id="detailHomeLink">Home</a>
      <span class="breadcrumb-sep">/</span>
      <span>${anime.type || 'TV'}</span>
      <span class="breadcrumb-sep">/</span>
      <span>${anime.title}</span>
    `;
    document.getElementById('detailHomeLink').onclick = (e) => {
      e.preventDefault();
      showView('home');
    };

    el.detailTitle.textContent = anime.title;
    el.detailMeta.innerHTML = `
      <span class="hero-score">★ ${anime.score || '9.0'}</span>
      <span>${anime.type || 'TV'}</span>
      <span>${anime.duration || '24m'}</span>
      <span>${anime.status || 'Finished Airing'}</span>
    `;
    el.detailDesc.textContent = anime.desc || 'Watch this anime on AniStream.';

    const genreList = anime.genres && anime.genres.length > 0 ? anime.genres : ['Action', 'Fantasy'];
    el.detailStats.innerHTML = `
      <div class="stat-item">
        <div class="stat-label">Japanese</div>
        <div class="stat-value">${anime.jpTitle || anime.title}</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">Studio</div>
        <div class="stat-value">${anime.studio || 'Animation Studio'}</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">Aired</div>
        <div class="stat-value">${anime.aired || 'Recent'}</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">Genres</div>
        <div class="stat-value detail-genre-list">
          ${genreList.map(g => `<span class="detail-genre-badge" data-genre="${g.toLowerCase().trim().replace(/\\s+/g, '-')}">${g}</span>`).join('')}
        </div>
      </div>
    `;

    el.detailStats.querySelectorAll('.detail-genre-badge').forEach(badge => {
      badge.addEventListener('click', (e) => {
        e.stopPropagation();
        const genreSlug = badge.dataset.genre;
        const genreName = badge.textContent.trim();
        showView('home');
        selectGenre(genreSlug, genreName);
      });
    });
  }

  async function openDetailView(anime) {
    state.currentAnime = anime;
    showView('detail');

    renderDetailViewContent(anime);

    el.episodesGrid.innerHTML = '<div style="padding:10px;color:var(--text-3);font-size:0.8rem;">Loading episodes…</div>';

    // Fetch full anime details (genres, studio, desc) and episodes in parallel
    const [details, episodes] = await Promise.all([
      fetchAnimeDetails(anime.id),
      fetchAnimeEpisodes(anime.id)
    ]);

    if (details) {
      Object.assign(anime, details);
      renderDetailViewContent(anime);
    }

    anime.episodes = episodes || [];
    renderDetailEpisodes(anime, 'sub');
  }

  function renderDetailEpisodes(anime, type) {
    el.episodesGrid.innerHTML = '';
    const eps = anime.episodes || [];

    eps.forEach((ep, idx) => {
      const btn = document.createElement('button');
      btn.className = 'ep-pill';
      btn.textContent = `EP ${ep.num}`;
      btn.title = `Episode ${ep.num}: ${ep.title}`;
      btn.onclick = () => {
        state.currentServerType = type;
        openWatchView(anime, idx);
      };
      el.episodesGrid.appendChild(btn);
    });
  }

  el.epTypeTabs.querySelectorAll('.ep-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      el.epTypeTabs.querySelectorAll('.ep-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      if (state.currentAnime) renderDetailEpisodes(state.currentAnime, tab.dataset.type);
    });
  });

  // ── 9. WATCH VIEW & SERVER LOGIC ──────────────────────────
  async function openWatchView(anime, epIndex = 0) {
    state.currentAnime = anime;
    state.currentEpIndex = epIndex;
    showView('watch');

    // Ensure episodes list exists
    if (!anime.episodes || anime.episodes.length === 0) {
      anime.episodes = await fetchAnimeEpisodes(anime.id);
    }

    const ep = anime.episodes[epIndex] || { id: '1', num: 1, title: 'Episode 1' };

    // Breadcrumb
    el.watchBreadcrumb.innerHTML = `
      <a href="#" id="watchHomeLink">Home</a>
      <span class="breadcrumb-sep"> / </span>
      <a href="#" id="watchAnimeLink">${anime.title}</a>
      <span class="breadcrumb-sep"> / </span>
      <span>Episode ${ep.num}</span>
    `;
    document.getElementById('watchHomeLink').onclick = (e) => {
      e.preventDefault();
      pauseVideo();
      if (el.mainEmbed) el.mainEmbed.src = 'about:blank';
      showView('home');
    };
    document.getElementById('watchAnimeLink').onclick = (e) => {
      e.preventDefault();
      pauseVideo();
      if (el.mainEmbed) el.mainEmbed.src = 'about:blank';
      openDetailView(anime);
    };

    el.ctrlTitle.textContent = `${anime.title} — Episode ${ep.num}: ${ep.title}`;

    // Render sidebar
    renderWatchSidebar(anime, epIndex);

    // Fetch servers from backend proxy
    el.subServers.innerHTML = '<span style="font-size:0.75rem;color:var(--text-3);">Fetching servers…</span>';
    el.dubServers.innerHTML = '<span style="font-size:0.75rem;color:var(--text-3);">Fetching servers…</span>';

    const serverData = await fetchEpisodeServers(ep.id);
    ep.serverData = serverData;

    renderServerButtons(ep);
    renderEpisodeInfoBar(anime, ep, epIndex);

    // Boot player stream
    playEpisodeStream(ep);
  }

  function renderServerButtons(ep) {
    el.subServers.innerHTML = '';
    el.dubServers.innerHTML = '';

    const rawData = ep.serverData || {};
    const subList = rawData.sub || [];
    const dubList = rawData.dub || [];

    if (subList.length === 0 && dubList.length === 0) {
      el.subServers.innerHTML = '<span style="font-size:0.75rem;color:var(--text-3);">Fetching anime stream servers…</span>';
      return;
    }

    // SUB Servers
    subList.forEach((s, idx) => {
      const btn = document.createElement('button');
      btn.className = `server-btn ${state.currentServerType === 'sub' && (state.currentServerName === s.name || idx === 0) ? 'active' : ''}`;
      btn.textContent = s.name;
      btn.onclick = () => {
        state.currentServerType = 'sub';
        state.currentServerName = s.name;
        updateActiveServerButtons();
        playEpisodeStream(ep, s.embedUrl);
      };
      el.subServers.appendChild(btn);
    });

    // DUB Servers
    dubList.forEach(s => {
      const btn = document.createElement('button');
      btn.className = `server-btn ${state.currentServerType === 'dub' && state.currentServerName === s.name ? 'active' : ''}`;
      btn.textContent = s.name;
      btn.onclick = () => {
        state.currentServerType = 'dub';
        state.currentServerName = s.name;
        updateActiveServerButtons();
        playEpisodeStream(ep, s.embedUrl);
      };
      el.dubServers.appendChild(btn);
    });
  }

  function updateActiveServerButtons() {
    el.subServers.querySelectorAll('.server-btn').forEach(btn => {
      btn.classList.toggle('active', state.currentServerType === 'sub' && btn.textContent === state.currentServerName);
    });
    el.dubServers.querySelectorAll('.server-btn').forEach(btn => {
      btn.classList.toggle('active', state.currentServerType === 'dub' && btn.textContent === state.currentServerName);
    });
  }

  function renderEpisodeInfoBar(anime, ep, epIndex) {
    el.epInfoBar.innerHTML = `
      <div class="ep-info-title">Episode ${ep.num} — ${ep.title}</div>
      <div class="ep-info-meta">
        <span>Series: ${anime.title}</span>
        <span>Server: ${state.currentServerName} (${state.currentServerType.toUpperCase()})</span>
        <span>Mode: ${state.playerMode === 'embed' ? 'Live Stream' : 'Custom Player'}</span>
        ${epIndex + 1 < (anime.episodes || []).length ? `<a href="#" id="nextEpLink" style="color:var(--accent-2);margin-left:auto;text-decoration:none;font-weight:600;">Next Episode ⏭</a>` : ''}
      </div>
    `;

    const nextLink = document.getElementById('nextEpLink');
    if (nextLink) {
      nextLink.onclick = (e) => {
        e.preventDefault();
        openWatchView(anime, epIndex + 1);
      };
    }
  }

  function renderWatchSidebar(anime, activeIndex) {
    el.sidebarEpList.innerHTML = (anime.episodes || []).map((ep, idx) => `
      <div class="sidebar-ep-item ${idx === activeIndex ? 'active' : ''}" data-ep-idx="${idx}">
        <span class="sidebar-ep-num">${ep.num}</span>
        <span class="sidebar-ep-title" title="${ep.title}">${ep.title}</span>
      </div>
    `).join('');

    el.sidebarEpList.querySelectorAll('.sidebar-ep-item').forEach(item => {
      item.addEventListener('click', () => {
        const idx = parseInt(item.dataset.epIdx, 10);
        openWatchView(anime, idx);
      });
    });

    const activeItem = el.sidebarEpList.querySelector('.sidebar-ep-item.active');
    if (activeItem) activeItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  // ── 10. STREAM PLAYBACK: EMBED VS CUSTOM HLS ─────────────
  function playEpisodeStream(ep, explicitEmbedUrl) {
    const serverList = (ep.serverData && ep.serverData[state.currentServerType]) || [];
    const server = serverList.find(s => s.name === state.currentServerName) || serverList[0] || {};
    const embedUrl = explicitEmbedUrl || server.embedUrl;

    if (state.playerMode === 'embed') {
      // 📺 Live Stream Embed mode
      pauseVideo();
      el.mainVideo.classList.add('hidden');
      el.playerControls.classList.add('hidden');
      el.bufferingOverlay.classList.add('hidden');

      if (embedUrl) {
        el.mainEmbed.classList.remove('hidden');
        el.mainEmbed.src = embedUrl;
      }
    } else {
      // ⚡ Custom HLS Player mode
      if (el.mainEmbed) {
        el.mainEmbed.classList.add('hidden');
        el.mainEmbed.src = 'about:blank';
      }
      el.mainVideo.classList.remove('hidden');
      el.playerControls.classList.remove('hidden');

      const hlsUrl = 'https://test-streams.mux.dev/x360pk5/x360pk5.m3u8';
      loadHlsVideo(hlsUrl);
    }
  }

  function loadHlsVideo(url) {
    showBuffering(true);
    if (state.hlsInstance) {
      state.hlsInstance.destroy();
      state.hlsInstance = null;
    }

    const video = el.mainVideo;
    if (window.Hls && Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
      state.hlsInstance = hls;
      hls.loadSource(url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => updatePlayPauseState(false));
      });
    } else {
      video.src = url;
      video.load();
      video.play().catch(() => updatePlayPauseState(false));
    }
  }

  // Mode buttons
  el.modeEmbedBtn.onclick = () => {
    state.playerMode = 'embed';
    el.modeEmbedBtn.classList.add('active');
    el.modeCustomBtn.classList.remove('active');
    if (state.currentAnime && state.currentAnime.episodes) {
      playEpisodeStream(state.currentAnime.episodes[state.currentEpIndex]);
    }
  };

  el.modeCustomBtn.onclick = () => {
    state.playerMode = 'custom';
    el.modeCustomBtn.classList.add('active');
    el.modeEmbedBtn.classList.remove('active');
    if (state.currentAnime && state.currentAnime.episodes) {
      playEpisodeStream(state.currentAnime.episodes[state.currentEpIndex]);
    }
  };

  // ── 11. CUSTOM PLAYER CONTROLS ────────────────────────────
  const video = el.mainVideo;

  function togglePlayPause() {
    if (video.paused || video.ended) {
      video.play().catch(e => console.log('Play blocked:', e));
    } else {
      video.pause();
    }
  }

  function pauseVideo() {
    if (video && !video.paused) video.pause();
  }

  function updatePlayPauseState(isPlaying) {
    el.playerWrapper.classList.toggle('paused', !isPlaying);
    el.playIcon.classList.toggle('hidden', isPlaying);
    el.pauseIcon.classList.toggle('hidden', !isPlaying);
  }

  video.addEventListener('play', () => updatePlayPauseState(true));
  video.addEventListener('pause', () => updatePlayPauseState(false));
  video.addEventListener('waiting', () => showBuffering(true));
  video.addEventListener('canplay', () => showBuffering(false));
  video.addEventListener('playing', () => showBuffering(false));

  function showBuffering(show) {
    el.bufferingOverlay.classList.toggle('hidden', !show);
  }

  el.playPauseBtn.onclick = togglePlayPause;
  el.centerPlayBtn.onclick = togglePlayPause;

  el.skipBack.onclick = () => { video.currentTime = Math.max(0, video.currentTime - 10); };
  el.skipFwd.onclick = () => { video.currentTime = Math.min(video.duration || 0, video.currentTime + 30); };

  video.addEventListener('timeupdate', () => {
    const cur = video.currentTime;
    const dur = video.duration || 0;
    el.timeDisplay.textContent = `${formatTime(cur)} / ${formatTime(dur)}`;

    if (dur > 0) {
      const pct = (cur / dur) * 100;
      el.progressPlayed.style.width = `${pct}%`;
      el.progressThumb.style.left = `${pct}%`;
    }

    if (video.buffered.length > 0 && dur > 0) {
      const bufferedEnd = video.buffered.end(video.buffered.length - 1);
      el.progressBuffered.style.width = `${(bufferedEnd / dur) * 100}%`;
    }
  });

  function formatTime(sec) {
    if (isNaN(sec) || sec === Infinity) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  // Seeking
  function seekToPosition(e) {
    const rect = el.progressWrap.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, clickX / rect.width));
    if (video.duration) video.currentTime = pct * video.duration;
  }

  let isSeeking = false;
  el.progressWrap.addEventListener('mousedown', (e) => {
    isSeeking = true;
    seekToPosition(e);
  });
  window.addEventListener('mousemove', (e) => { if (isSeeking) seekToPosition(e); });
  window.addEventListener('mouseup', () => { isSeeking = false; });

  // Volume
  el.volumeSlider.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    video.volume = val;
    video.muted = val === 0;
    updateMuteIcon();
  });

  el.muteBtn.onclick = () => {
    video.muted = !video.muted;
    if (!video.muted && video.volume === 0) {
      video.volume = 0.5;
      el.volumeSlider.value = '0.5';
    }
    updateMuteIcon();
  };

  function updateMuteIcon() {
    if (video.muted || video.volume === 0) el.muteBtn.textContent = '🔇';
    else if (video.volume < 0.5) el.muteBtn.textContent = '🔉';
    else el.muteBtn.textContent = '🔊';
  }

  // Fullscreen
  el.fullscreenBtn.onclick = () => {
    if (!document.fullscreenElement) el.playerWrapper.requestFullscreen().catch(console.warn);
    else document.exitFullscreen();
  };

  // PiP
  if ('pictureInPictureEnabled' in document) {
    el.pipBtn.onclick = async () => {
      try {
        if (document.pictureInPictureElement) await document.exitPictureInPicture();
        else await video.requestPictureInPicture();
      } catch (e) {}
    };
  } else {
    el.pipBtn.style.display = 'none';
  }

  // Auto hide controls
  function resetControlsTimeout() {
    el.playerControls.style.opacity = '1';
    clearTimeout(state.controlsTimeout);
    if (!video.paused) {
      state.controlsTimeout = setTimeout(() => {
        el.playerControls.style.opacity = '0';
      }, 3000);
    }
  }
  el.playerWrapper.addEventListener('mousemove', resetControlsTimeout);
  el.playerWrapper.addEventListener('mouseenter', resetControlsTimeout);
  el.playerWrapper.addEventListener('mouseleave', () => {
    if (!video.paused) el.playerControls.style.opacity = '0';
  });

  // ── 12. INITIALIZATION ────────────────────────────────────
  function init() {
    fetchLiveHomeData();
    showView('home');

    // Handle query parameters from landing page or direct links
    const urlParams = new URLSearchParams(window.location.search);
    const searchParam = urlParams.get('keyword') || urlParams.get('search') || urlParams.get('q');
    const genreParam = urlParams.get('genre');
    const animeParam = urlParams.get('anime');

    if (searchParam) {
      el.headerSearch.value = searchParam;
      executeFullSearch(searchParam);
    } else if (genreParam) {
      selectGenre(genreParam);
    } else if (animeParam) {
      openDetailView({ id: animeParam, title: animeParam.replace(/-/g, ' ') });
    }

    setTimeout(() => {
      el.loadingScreen.classList.add('hidden');
    }, 400);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
