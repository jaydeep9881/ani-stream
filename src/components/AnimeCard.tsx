'use client';

import React from 'react';
import { Play, Star } from 'lucide-react';
import { AnimeItem } from '@/lib/types';

interface AnimeCardProps {
  anime: AnimeItem;
  rank?: number;
  onOpenDetail?: (anime: AnimeItem) => void;
}

export default function AnimeCard({ anime, rank, onOpenDetail }: AnimeCardProps) {
  return (
    <div className="group relative flex flex-col rounded-2xl bg-bg-card border border-white/5 overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-glow-purple hover:border-brand-purple/40">
      
      {/* Poster Image Container */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-bg-secondary">
        <img
          src={anime.poster || 'https://hianime.ba/theme/images/anw-min.webp'}
          alt={anime.title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-108"
        />

        {/* Hover Gradient Overlay & Quick Play Button */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-xs">
          <a
            href={`/watch/${encodeURIComponent(anime.id)}`}
            className="w-12 h-12 rounded-full bg-gradient-to-tr from-brand-purple to-brand-pink flex items-center justify-center text-white shadow-glow-purple transform scale-75 group-hover:scale-100 transition-transform duration-300 hover:scale-110"
            title="Watch Now"
          >
            <Play className="w-5 h-5 fill-white ml-0.5" />
          </a>
        </div>

        {/* Rank Number (for Trending rankings) */}
        {typeof rank === 'number' && (
          <div className="absolute top-2.5 left-2.5 w-7 h-7 rounded-lg bg-black/70 backdrop-blur-md border border-white/10 flex items-center justify-center font-heading font-black text-xs text-brand-pink shadow-md">
            {rank < 10 ? `0${rank}` : rank}
          </div>
        )}

        {/* Top Right Score */}
        {anime.score && (
          <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md border border-white/10 flex items-center gap-1 text-[11px] font-semibold text-brand-gold">
            <Star className="w-3 h-3 fill-brand-gold text-brand-gold" />
            {anime.score}
          </div>
        )}

        {/* Bottom Metadata Badges */}
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[11px] font-bold">
          <div className="flex items-center gap-1">
            {typeof anime.subCount === 'number' && anime.subCount > 0 && (
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/90 text-white backdrop-blur-xs">
                SUB {anime.subCount}
              </span>
            )}
            {typeof anime.dubCount === 'number' && anime.dubCount > 0 && (
              <span className="px-1.5 py-0.5 rounded bg-sky-500/90 text-white backdrop-blur-xs">
                DUB {anime.dubCount}
              </span>
            )}
          </div>
          {anime.type && (
            <span className="px-1.5 py-0.5 rounded bg-white/20 text-white backdrop-blur-xs uppercase text-[10px]">
              {anime.type}
            </span>
          )}
        </div>
      </div>

      {/* Title & Detail Actions */}
      <div className="p-3 flex flex-col flex-1 justify-between gap-1.5">
        <a
          href={`/watch/${encodeURIComponent(anime.id)}`}
          className="font-heading font-semibold text-sm text-text-main group-hover:text-brand-pink transition-colors line-clamp-1"
          title={anime.title}
        >
          {anime.title}
        </a>

        <div className="flex items-center justify-between text-xs text-text-dim">
          <span>{anime.duration || '24m'}</span>
          {onOpenDetail && (
            <button
              type="button"
              onClick={() => onOpenDetail(anime)}
              className="text-text-muted hover:text-white transition-colors underline-offset-2 hover:underline"
            >
              Info
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
