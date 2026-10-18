'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  ChevronRight,
  Star,
  Film,
  Calendar,
  Search,
  Tv,
  Info,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import VideoPlayer from '@/components/VideoPlayer';
import { AnimeDetail, EpisodeItem } from '@/lib/types';

interface WatchPageProps {
  params: { slug: string };
}

export default function WatchPage({ params }: WatchPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const epParam = searchParams.get('ep');

  const slug = params.slug;
  const [detail, setDetail] = useState<AnimeDetail | null>(null);
  const [episodes, setEpisodes] = useState<EpisodeItem[]>([]);
  const [activeEp, setActiveEp] = useState<EpisodeItem | null>(null);
  const [epSearch, setEpSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Fetch anime details and episode list
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    async function loadData() {
      try {
        const [detRes, epRes] = await Promise.all([
          fetch(`/api/anime/${encodeURIComponent(slug)}`),
          fetch(`/api/episodes/${encodeURIComponent(slug)}`),
        ]);

        if (detRes.ok && isMounted) {
          const detData = await detRes.json();
          setDetail(detData);
        }

        if (epRes.ok && isMounted) {
          const epData = await epRes.json();
          const epList: EpisodeItem[] = epData.episodes || [];
          setEpisodes(epList);

          // Select current episode
          if (epList.length > 0) {
            if (epParam) {
              const matched = epList.find((e) => String(e.id) === String(epParam));
              setActiveEp(matched || epList[0]);
            } else {
              setActiveEp(epList[0]);
            }
          }
        }
      } catch (err) {
        console.error('Watch page data error:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [slug, epParam]);

  const currentIndex = episodes.findIndex((e) => e.id === activeEp?.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < episodes.length - 1;

  const handlePrev = () => {
    if (hasPrev) {
      const prevEp = episodes[currentIndex - 1];
      setActiveEp(prevEp);
      router.push(`/watch/${encodeURIComponent(slug)}?ep=${prevEp.id}`, { scroll: false });
    }
  };

  const handleNext = () => {
    if (hasNext) {
      const nextEp = episodes[currentIndex + 1];
      setActiveEp(nextEp);
      router.push(`/watch/${encodeURIComponent(slug)}?ep=${nextEp.id}`, { scroll: false });
    }
  };

  const handleSelectEp = (ep: EpisodeItem) => {
    setActiveEp(ep);
    router.push(`/watch/${encodeURIComponent(slug)}?ep=${ep.id}`, { scroll: false });
  };

  // Filter episodes by search input
  const filteredEpisodes = episodes.filter(
    (ep) =>
      String(ep.num).includes(epSearch.trim()) ||
      ep.title.toLowerCase().includes(epSearch.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="py-32 flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 border-4 border-brand-purple border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-text-muted">Loading player and episodes...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs font-medium text-text-muted">
        <a href="/" className="hover:text-white transition-colors">
          Home
        </a>
        <ChevronRight className="w-3.5 h-3.5 text-text-dim" />
        <a href="/home" className="hover:text-white transition-colors">
          Catalog
        </a>
        <ChevronRight className="w-3.5 h-3.5 text-text-dim" />
        <span className="text-white truncate max-w-xs">{detail?.title || slug}</span>
        {activeEp && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-text-dim" />
            <span className="text-brand-pink font-semibold">Episode {activeEp.num}</span>
          </>
        )}
      </nav>

      {/* Main Watch Layout (Player + Sidebar) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Column: Video Player & Info (3 cols) */}
        <div className="lg:col-span-3 space-y-6">
          {activeEp ? (
            <VideoPlayer
              episodeId={activeEp.id}
              episodeNum={activeEp.num}
              animeTitle={detail?.title}
              onPrevEpisode={handlePrev}
              onNextEpisode={handleNext}
              hasPrev={hasPrev}
              hasNext={hasNext}
            />
          ) : (
            <div className="p-12 text-center rounded-3xl bg-bg-card border border-white/5 text-text-muted">
              No episode selected.
            </div>
          )}

          {/* Anime Detail & Synopsis Card */}
          {detail && (
            <div className="p-6 rounded-3xl bg-bg-card border border-white/5 space-y-4">
              <div className="flex flex-col sm:flex-row gap-5">
                <img
                  src={detail.poster || 'https://hianime.ba/theme/images/anw-min.webp'}
                  alt={detail.title}
                  className="w-28 h-40 object-cover rounded-2xl flex-shrink-0 shadow-lg border border-white/10 mx-auto sm:mx-0"
                />
                <div className="flex-1 space-y-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-brand-gold/20 text-brand-gold text-xs font-bold flex items-center gap-1 border border-brand-gold/30">
                      <Star className="w-3.5 h-3.5 fill-brand-gold" />
                      {detail.score}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-white/10 text-white text-xs font-semibold">
                      {detail.quality || 'HD'}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-brand-green text-xs font-bold">
                      SUB {detail.subCount}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-sky-500/20 text-brand-blue text-xs font-bold">
                      DUB {detail.dubCount}
                    </span>
                  </div>

                  <h1 className="font-heading font-black text-xl sm:text-2xl text-white">
                    {detail.title}
                  </h1>
                  {detail.jpTitle && (
                    <p className="text-xs text-text-dim italic">{detail.jpTitle}</p>
                  )}

                  <p className="text-xs sm:text-sm text-text-muted leading-relaxed line-clamp-3">
                    {detail.desc}
                  </p>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {detail.genres.map((g, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-full bg-white/5 text-brand-purpleLight text-xs"
                      >
                        {g}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-white/5 text-xs">
                <div>
                  <span className="text-text-dim block">Studio:</span>
                  <span className="text-white font-medium">{detail.studio}</span>
                </div>
                <div>
                  <span className="text-text-dim block">Status:</span>
                  <span className="text-white font-medium">{detail.status}</span>
                </div>
                <div>
                  <span className="text-text-dim block">Aired:</span>
                  <span className="text-white font-medium">{detail.aired}</span>
                </div>
                <div>
                  <span className="text-text-dim block">Episodes:</span>
                  <span className="text-white font-medium">{episodes.length}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Episode List Sidebar (1 col) */}
        <div className="lg:col-span-1 space-y-4">
          <div className="p-4 rounded-3xl bg-bg-card border border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-bold text-sm text-white flex items-center gap-1.5">
                <Film className="w-4 h-4 text-brand-pink" />
                <span>Episodes</span>
              </h3>
              <span className="text-xs text-text-dim">{episodes.length} Total</span>
            </div>

            {/* Episode Search Bar */}
            <div className="relative">
              <input
                type="text"
                value={epSearch}
                onChange={(e) => setEpSearch(e.target.value)}
                placeholder="Search ep # or title..."
                className="w-full bg-bg-input text-xs text-text-main placeholder-text-dim rounded-xl pl-8 pr-3 py-2 border border-white/10 focus:outline-none focus:border-brand-purple transition-all"
              />
              <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-text-dim" />
            </div>

            {/* Scrollable Episode List */}
            <div className="max-h-[600px] overflow-y-auto space-y-1.5 pr-1">
              {filteredEpisodes.length === 0 ? (
                <div className="p-6 text-center text-xs text-text-dim">No matching episodes.</div>
              ) : (
                filteredEpisodes.map((ep) => {
                  const isActive = activeEp?.id === ep.id;
                  return (
                    <button
                      key={ep.id}
                      type="button"
                      onClick={() => handleSelectEp(ep)}
                      className={`w-full p-2.5 rounded-xl text-left flex items-center gap-3 transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-brand-purple to-brand-pink text-white shadow-glow-purple font-semibold'
                          : 'bg-white/5 hover:bg-white/10 text-text-muted hover:text-white'
                      }`}
                    >
                      <span
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                          isActive ? 'bg-white/20 text-white' : 'bg-black/30 text-brand-pink'
                        }`}
                      >
                        {ep.num}
                      </span>
                      <span className="text-xs truncate flex-1">{ep.title}</span>
                      {isActive && <CheckCircle2 className="w-4 h-4 text-white flex-shrink-0" />}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
