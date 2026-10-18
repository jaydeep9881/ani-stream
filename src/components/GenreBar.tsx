'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';

interface GenreBarProps {
  activeGenre: string;
  onSelectGenre: (genre: string) => void;
}

const GENRES = [
  { id: 'all', label: 'All Shows', icon: true },
  { id: 'action', label: 'Action' },
  { id: 'adventure', label: 'Adventure' },
  { id: 'comedy', label: 'Comedy' },
  { id: 'drama', label: 'Drama' },
  { id: 'fantasy', label: 'Fantasy' },
  { id: 'horror', label: 'Horror' },
  { id: 'isekai', label: 'Isekai' },
  { id: 'mystery', label: 'Mystery' },
  { id: 'romance', label: 'Romance' },
  { id: 'sci-fi', label: 'Sci-Fi' },
  { id: 'shounen', label: 'Shounen' },
  { id: 'slice-of-life', label: 'Slice of Life' },
  { id: 'supernatural', label: 'Supernatural' },
  { id: 'sports', label: 'Sports' },
];

export default function GenreBar({ activeGenre, onSelectGenre }: GenreBarProps) {
  return (
    <div className="w-full flex items-center gap-3 py-4 overflow-x-auto no-scrollbar scroll-smooth">
      <div className="flex-shrink-0 text-xs font-bold uppercase tracking-wider text-text-dim flex items-center gap-1.5 pl-1">
        <Sparkles className="w-3.5 h-3.5 text-brand-pink" />
        <span>Genres:</span>
      </div>
      <div className="flex items-center gap-2">
        {GENRES.map((g) => {
          const isActive = activeGenre.toLowerCase() === g.id.toLowerCase();
          return (
            <button
              key={g.id}
              type="button"
              onClick={() => onSelectGenre(g.id)}
              className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 border ${
                isActive
                  ? 'bg-gradient-to-r from-brand-purple to-brand-pink text-white border-transparent shadow-glow-purple scale-105'
                  : 'bg-bg-card/70 hover:bg-bg-hover text-text-muted hover:text-white border-white/5'
              }`}
            >
              {g.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
