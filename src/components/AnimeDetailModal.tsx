'use client';

import React, { useState, useEffect } from 'react';
import { X, Play, Star, Calendar, Film, Check, ExternalLink } from 'lucide-react';
import { AnimeDetail, EpisodeItem } from '@/lib/types';

interface AnimeDetailModalProps {
  slug: string | null;
  onClose: () => void;
}

export default function AnimeDetailModal({ slug, onClose }: AnimeDetailModalProps) {
  const [detail, setDetail] = useState<AnimeDetail | null>(null);
  const [episodes, setEpisodes] = useState<EpisodeItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [epFilter, setEpFilter] = useState<'sub' | 'dub'>('sub');

  useEffect(() => {
    if (!slug) {
      setDetail(null);
      setEpisodes([]);
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    async function loadData() {
      try {
        const [detRes, epRes] = await Promise.all([
          fetch(`/api/anime/${encodeURIComponent(slug!)}`),
          fetch(`/api/episodes/${encodeURIComponent(slug!)}`),
        ]);

        if (detRes.ok && isMounted) {
          const detData = await detRes.json();
          setDetail(detData);
        }

        if (epRes.ok && isMounted) {
          const epData = await epRes.json();
          setEpisodes(epData.episodes || []);
        }
      } catch (err) {
        console.error('Detail modal load error:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [slug]);

  if (!slug) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-bg-secondary border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center border border-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto p-6 sm:p-8 space-y-6">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <div className="w-10 h-10 border-4 border-brand-purple border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-text-muted">Loading anime details from HiAnime...</span>
            </div>
          ) : detail ? (
            <>
              {/* Header Grid: Poster + Info */}
              <div className="flex flex-col sm:flex-row gap-6">
                
                {/* Poster */}
                <div className="w-44 sm:w-56 flex-shrink-0 mx-auto sm:mx-0">
                  <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-glow-purple border border-white/10">
                    <img
                      src={detail.poster || 'https://hianime.ba/theme/images/anw-min.webp'}
                      alt={detail.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <a
                    href={`/watch/${encodeURIComponent(detail.id)}`}
                    className="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-brand-purple to-brand-pink text-white font-bold text-sm tracking-wide shadow-glow-purple flex items-center justify-center gap-2 hover:opacity-95 transition-opacity"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    Watch Now
                  </a>
                </div>

                {/* Details Column */}
                <div className="flex-1 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-brand-gold/20 text-brand-gold text-xs font-bold flex items-center gap-1 border border-brand-gold/30">
                      <Star className="w-3.5 h-3.5 fill-brand-gold" />
                      {detail.score}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-white/10 text-white text-xs font-semibold">
                      {detail.quality || 'HD'}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-white/10 text-white text-xs font-semibold">
                      {detail.rating || 'PG-13'}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-brand-green text-xs font-bold">
                      SUB {detail.subCount}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-sky-500/20 text-brand-blue text-xs font-bold">
                      DUB {detail.dubCount}
                    </span>
                  </div>

                  <h2 className="font-heading font-black text-2xl sm:text-3xl text-white">
                    {detail.title}
                  </h2>
                  {detail.jpTitle && (
                    <p className="text-xs text-text-dim italic">{detail.jpTitle}</p>
                  )}

                  {/* Genres */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {detail.genres.map((g, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-full bg-bg-card text-brand-purpleLight border border-white/5 text-xs font-medium"
                      >
                        {g}
                      </span>
                    ))}
                  </div>

                  {/* Synopsis */}
                  <p className="text-sm text-text-muted leading-relaxed line-clamp-5 pt-2">
                    {detail.desc}
                  </p>

                  {/* Metadata Stats Table */}
                  <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/10 text-xs">
                    <div>
                      <span className="text-text-dim">Status:</span>{' '}
                      <span className="text-white font-medium">{detail.status}</span>
                    </div>
                    <div>
                      <span className="text-text-dim">Aired:</span>{' '}
                      <span className="text-white font-medium">{detail.aired}</span>
                    </div>
                    <div>
                      <span className="text-text-dim">Studio:</span>{' '}
                      <span className="text-white font-medium">{detail.studio}</span>
                    </div>
                    <div>
                      <span className="text-text-dim">Episodes:</span>{' '}
                      <span className="text-white font-medium">{episodes.length || detail.subCount}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Episodes List Section */}
              <div className="border-t border-white/10 pt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading font-bold text-lg text-white">
                    Available Episodes ({episodes.length})
                  </h3>
                  <div className="flex items-center gap-1 bg-bg-card p-1 rounded-lg border border-white/5 text-xs">
                    <button
                      type="button"
                      onClick={() => setEpFilter('sub')}
                      className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                        epFilter === 'sub'
                          ? 'bg-brand-purple text-white'
                          : 'text-text-muted hover:text-white'
                      }`}
                    >
                      SUB
                    </button>
                    <button
                      type="button"
                      onClick={() => setEpFilter('dub')}
                      className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                        epFilter === 'dub'
                          ? 'bg-brand-purple text-white'
                          : 'text-text-muted hover:text-white'
                      }`}
                    >
                      DUB
                    </button>
                  </div>
                </div>

                {episodes.length === 0 ? (
                  <p className="text-xs text-text-dim">No episodes listed.</p>
                ) : (
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2 max-h-52 overflow-y-auto p-1">
                    {episodes.map((ep) => (
                      <a
                        key={ep.id}
                        href={`/watch/${encodeURIComponent(detail.id)}?ep=${ep.id}`}
                        className="p-2 rounded-xl bg-bg-card hover:bg-gradient-to-r hover:from-brand-purple hover:to-brand-pink text-text-muted hover:text-white border border-white/5 text-center text-xs font-bold transition-all"
                        title={ep.title}
                      >
                        {ep.num}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="py-20 text-center text-text-muted">Failed to load anime details.</div>
          )}
        </div>
      </div>
    </div>
  );
}
