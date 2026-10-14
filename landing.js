/* ══════════════════════════════════════════════════════════
   AniStream — landing.js
   Controller for HiAnime First Home Landing Page
   ══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const API_BASE = '';

  const searchInput = document.getElementById('landingSearchInput');
  const searchForm = document.getElementById('landingSearchForm');
  const suggestBox = document.getElementById('landingSuggestBox');
  const suggestList = document.getElementById('landingSuggestList');
  const topSearchWrap = document.getElementById('topSearchChips');
  const postsList = document.getElementById('postsList');

  let debounceTimer = null;

  // ── 1. LIVE AUTOCOMPLETE SUGGESTIONS ───────────────────────
  if (searchInput && suggestBox && suggestList) {
    searchInput.addEventListener('input', (e) => {
      const q = e.target.value.trim();
      clearTimeout(debounceTimer);

      if (q.length < 2) {
        suggestBox.classList.add('hidden');
        return;
      }

      debounceTimer = setTimeout(async () => {
        try {
          const res = await fetch(`${API_BASE}/api/search/suggestions?keyword=${encodeURIComponent(q)}`);
          if (res.ok) {
            const data = await res.json();
            if (data.suggestions && data.suggestions.length > 0) {
              suggestList.innerHTML = data.suggestions.map(item => `
                <div class="landing-suggest-item" data-id="${item.id}">
                  <img class="landing-suggest-poster" src="${item.poster || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=100'}" alt="${item.title}" />
                  <div class="landing-suggest-info">
                    <div class="landing-suggest-title">${item.title}</div>
                    ${item.jname ? `<div class="landing-suggest-jname">${item.jname}</div>` : ''}
                    <div class="landing-suggest-meta">${item.meta || 'TV Series'}</div>
                  </div>
                </div>
              `).join('');

              suggestBox.classList.remove('hidden');

              suggestList.querySelectorAll('.landing-suggest-item').forEach(el => {
                el.addEventListener('click', () => {
                  const id = el.dataset.id;
                  window.location.href = `./home.html?anime=${encodeURIComponent(id)}`;
                });
              });
              return;
            }
          }
        } catch (err) {
          console.warn('Landing suggest error:', err);
        }
        suggestBox.classList.add('hidden');
      }, 250);
    });

    // Close suggestions when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.search-center-wrap')) {
        suggestBox.classList.add('hidden');
      }
    });
  }

  // ── 2. SEARCH FORM SUBMISSION ──────────────────────────────
  if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const q = searchInput ? searchInput.value.trim() : '';
      if (q) {
        window.location.href = `./home.html?keyword=${encodeURIComponent(q)}`;
      } else {
        window.location.href = './home.html';
      }
    });
  }

  // ── 3. LOAD LANDING DATA (TOP SEARCHES & COMMUNITY) ────────
  async function loadLandingData() {
    try {
      const res = await fetch(`${API_BASE}/api/landing`);
      if (res.ok) {
        const data = await res.json();

        // Render Top Searches
        if (data.topSearches && data.topSearches.length > 0 && topSearchWrap) {
          topSearchWrap.innerHTML = `
            <span class="top-search-label">Top search:</span>
            ${data.topSearches.map(term => `
              <button class="top-search-chip" data-search="${term}">${term}</button>
            `).join('')}
          `;

          topSearchWrap.querySelectorAll('.top-search-chip').forEach(chip => {
            chip.addEventListener('click', () => {
              const query = chip.dataset.search;
              window.location.href = `./home.html?keyword=${encodeURIComponent(query)}`;
            });
          });
        }

        // Render Community Posts
        if (data.communityPosts && data.communityPosts.length > 0 && postsList) {
          postsList.innerHTML = data.communityPosts.map(p => `
            <div class="post-item" onclick="window.location.href='./home.html'">
              <div class="post-meta-top">
                <span class="post-tag">${p.tag}</span>
                <span class="post-time">${p.time}</span>
                <span class="post-replies">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                  ${p.replies}
                </span>
              </div>
              <h4 class="post-title">${p.title}</h4>
              <p class="post-snippet">${p.snippet}</p>
              <div class="post-author">
                <img class="author-avatar" src="${p.avatar}" alt="${p.author}" />
                <span>${p.author}</span>
              </div>
            </div>
          `).join('');
        }
      }
    } catch (err) {
      console.warn('Failed to load landing data:', err);
    }
  }

  // Initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadLandingData);
  } else {
    loadLandingData();
  }
})();
