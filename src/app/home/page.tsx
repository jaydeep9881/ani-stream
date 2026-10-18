'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Flame, Compass, Filter, RefreshCw, AlertCircle } from 'lucide-react';
import SpotlightHero from '@/components/SpotlightHero';
import GenreBar from '@/components/GenreBar';
import AnimeCard from '@/components/AnimeCard';
import AnimeDetailModal from '@/components/AnimeDetailModal';
import { AnimeItem, SpotlightItem, CatalogData } from '@/lib/types';

function CatalogContent() {
  const searchParams = useSearchParams();
  const searchKeyword = searchParams.get('search');
  const initialGenre = searchParams.get('genre') || 'all';

  const [catalog, setCatalog] = useState<CatalogData | null>(null);
  const [displayList, setDisplayList] = useState<AnimeItem[]>([]);
  const [activeGenre, setActiveGenre] = useState<string>(initialGenre);
  const [audioFilter, setAudioFilter] = useState<'all' | 'sub' | 'dub'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load home catalog initially
  useEffect(() => {
    async function loadCatalog() {
      try {
        setIsLoading(true);
        setError(null);
        const res = await fetch('/api/catalog');
        if (!res.ok) throw new Error('Failed to load anime catalog');
        const data: CatalogData = await res.json();
        setCatalog(data);
        if (!searchKeyword && initialGenre === 'all') {
          setDisplayList(data.trending || []);
        }
      } catch (err: any) {
        console.error('Catalog load error:', err);
        setError('Failed to load anime catalog. Please refresh.');
      } finally {
        setIsLoading(false);
      }
    }

    loadCatalog();
  }, []);

  // Handle Search Keyword query param
  useEffect(() => {
    if (!searchKeyword) return;

    async function doSearch() {
      setIsLoading(true);
      setActiveGenre('all');
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchKeyword)}`);
        if (res.ok) {
          const data = await res.json();
          setDisplayList(data.results || []);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsLoading(false);
      }
    }

    doSearch();
  }, [searchKeyword]);

  // Handle Genre selection
  const handleSelectGenre = async (genre: string) => {
    setActiveGenre(genre);

    if (genre === 'all') {
      if (catalog) setDisplayList(catalog.trending || []);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/genres/${encodeURIComponent(genre)}`);
      if (res.ok) {
        const data = await res.json();
        setDisplayList(data.results || []);
      }
    } catch (err) {
      console.error('Genre fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter display list by SUB / DUB
  const filteredList = displayList.filter((item) => {
    if (audioFilter === 'sub') return (item.subCount || 0) > 0;
    if (audioFilter === 'dub') return (item.dubCount || 0) > 0;
    return true;
  });

  return (
    <div className="space-y-10">
      
      {/* ── 1. SPOTLIGHT HERO SLIDER ── */}
      {catalog && catalog.spotlights.length > 0 && !searchKeyword && activeGenre === 'all' && (
        <SpotlightHero
          spotlights={catalog.spotlights}
          onOpenDetail={(item) => setSelectedSlug(item.id)}
        />
      )}

      {/* ── 2. GENRE BAR ── */}
      <GenreBar activeGenre={activeGenre} onSelectGenre={handleSelectGenre} />

      {/* ── 3. SECTION HEADER & FILTERS ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h2 className="font-heading font-black text-2xl text-white flex items-center gap-2">
            {searchKeyword ? (
              <>
                <Compass className="w-6 h-6 text-brand-pink" />
                <span>Search results for &quot;{searchKeyword}&quot;</span>
              </>
            ) : activeGenre !== 'all' ? (
              <>
                <Compass className="w-6 h-6 text-brand-pink" />
                <span className="capitalize">{activeGenre} Anime</span>
              </>
            ) : (
              <>
                <Flame className="w-6 h-6 text-brand-pink" />
                <span>Trending Now</span>
              </>
            )}
          </h2>
          <p className="text-xs text-text-dim mt-0.5">
            Showing {filteredList.length} anime series synchronized from HiAnime
          </p>
        </div>

        {/* Audio Filter Tabs: ALL, SUB, DUB */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-bg-card border border-white/5 self-start sm:self-auto text-xs font-semibold">
          <button
            type="button"
            onClick={() => setAudioFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              audioFilter === 'all'
                ? 'bg-brand-purple text-white shadow-glow-purple'
                : 'text-text-muted hover:text-white'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setAudioFilter('sub')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              audioFilter === 'sub'
                ? 'bg-emerald-500 text-white shadow-md'
                : 'text-text-muted hover:text-white'
            }`}
          >
            SUB
          </button>
          <button
            type="button"
            onClick={() => setAudioFilter('dub')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              audioFilter === 'dub'
                ? 'bg-sky-500 text-white shadow-md'
                : 'text-text-muted hover:text-white'
            }`}
          >
            DUB
          </button>
        </div>
      </div>

      {/* ── 4. ANIME GRID ── */}
      {isLoading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 border-4 border-brand-purple border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium text-text-muted">Loading anime catalog...</span>
        </div>
      ) : error ? (
        <div className="py-20 text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <p className="text-white font-medium">{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-xl bg-brand-purple text-white text-xs font-bold"
          >
            Retry
          </button>
        </div>
      ) : filteredList.length === 0 ? (
        <div className="py-20 text-center text-text-muted space-y-2">
          <p className="text-base text-white">No anime found matching your criteria.</p>
          <button
            type="button"
            onClick={() => {
              setActiveGenre('all');
              setAudioFilter('all');
              if (catalog) setDisplayList(catalog.trending);
            }}
            className="text-xs text-brand-pink hover:underline font-semibold"
          >
            Reset filters to view all trending anime
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
          {filteredList.map((anime, idx) => (
            <AnimeCard
              key={anime.id || idx}
              anime={anime}
              rank={activeGenre === 'all' && !searchKeyword ? idx + 1 : undefined}
              onOpenDetail={(item) => setSelectedSlug(item.id)}
            />
          ))}
        </div>
      )}

      {/* ── 5. ANIME DETAIL MODAL ── */}
      <AnimeDetailModal slug={selectedSlug} onClose={() => setSelectedSlug(null)} />
    </div>
  );
}

export default function CatalogPage() {
  return (
    <Suspense
      fallback={
        <div className="py-24 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-brand-purple border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <CatalogContent />
    </Suspense>
  );
}
