'use client';

import React, { useState, useEffect } from 'react';
import { Play, Info, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { SpotlightItem } from '@/lib/types';

interface SpotlightHeroProps {
  spotlights: SpotlightItem[];
  onOpenDetail?: (item: SpotlightItem) => void;
}

export default function SpotlightHero({ spotlights, onOpenDetail }: SpotlightHeroProps) {
  const [currentIdx, setCurrentIdx] = useState(0);

  useEffect(() => {
    if (!spotlights || spotlights.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % spotlights.length);
    }, 6500);
    return () => clearInterval(interval);
  }, [spotlights]);

  if (!spotlights || spotlights.length === 0) return null;

  const current = spotlights[currentIdx];

  const handlePrev = () => {
    setCurrentIdx((prev) => (prev === 0 ? spotlights.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIdx((prev) => (prev + 1) % spotlights.length);
  };

  return (
    <div className="relative w-full h-[480px] sm:h-[540px] lg:h-[600px] overflow-hidden rounded-3xl bg-bg-secondary border border-white/10 group">
      {/* Background Poster Image */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-all duration-700 filter brightness-50 contrast-110 scale-105 group-hover:scale-100"
        style={{
          backgroundImage: `url('${current.banner || current.poster}')`,
        }}
      />

      {/* Dark Vignette & Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-bg via-bg/70 to-transparent max-w-3xl" />

      {/* Hero Content */}
      <div className="relative z-10 h-full max-w-3xl flex flex-col justify-end p-6 sm:p-10 lg:p-14 space-y-4">
        
        {/* Spotlight Badge & Meta */}
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="px-3 py-1 rounded-full bg-brand-pink text-bg font-extrabold text-xs uppercase tracking-wider shadow-glow-pink">
            Spotlight #{currentIdx + 1}
          </span>
          <span className="px-2.5 py-0.5 rounded-md bg-white/10 backdrop-blur-md text-brand-gold text-xs font-semibold flex items-center gap-1 border border-white/10">
            <Star className="w-3.5 h-3.5 fill-brand-gold text-brand-gold" />
            {current.score || '8.9'}
          </span>
          <span className="px-2 py-0.5 rounded-md bg-white/10 backdrop-blur-md text-xs font-medium text-white/80 border border-white/10">
            {current.type || 'TV Series'}
          </span>
          <span className="px-2 py-0.5 rounded-md bg-brand-purple/20 text-brand-purpleLight text-xs font-semibold border border-brand-purple/30">
            HD
          </span>
          <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-brand-green text-xs font-semibold border border-emerald-500/30">
            SUB {current.subCount || 12}
          </span>
          <span className="px-2 py-0.5 rounded-md bg-sky-500/20 text-brand-blue text-xs font-semibold border border-sky-500/30">
            DUB {current.dubCount || 12}
          </span>
        </div>

        {/* Title */}
        <h1 className="font-heading font-black text-2xl sm:text-4xl lg:text-5xl text-white tracking-tight line-clamp-2 leading-tight drop-shadow-md">
          {current.title}
        </h1>

        {/* Synopsis / Description */}
        <p className="text-sm sm:text-base text-text-muted line-clamp-3 max-w-2xl leading-relaxed">
          {current.desc ||
            'Experience this sensational anime series with high-definition live streaming, synchronized subtitles, and crystal-clear audio.'}
        </p>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <a
            href={`/watch/${encodeURIComponent(current.id)}`}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-brand-purple to-brand-pink text-white font-bold text-sm tracking-wide shadow-glow-purple hover:scale-105 active:scale-95 transition-all duration-200"
          >
            <Play className="w-4 h-4 fill-white" />
            Watch Now
          </a>
          
          {onOpenDetail && (
            <button
              type="button"
              onClick={() => onOpenDetail(current)}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-medium text-sm backdrop-blur-md border border-white/10 transition-all duration-200"
            >
              <Info className="w-4 h-4" />
              Detail
            </button>
          )}
        </div>
      </div>

      {/* Prev / Next Slide Arrows */}
      <button
        type="button"
        onClick={handlePrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border border-white/10"
        aria-label="Previous Spotlight"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        type="button"
        onClick={handleNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border border-white/10"
        aria-label="Next Spotlight"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Slide Indicators / Dots */}
      <div className="absolute right-6 bottom-6 z-20 flex items-center gap-2">
        {spotlights.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setCurrentIdx(i)}
            className={`transition-all duration-300 rounded-full ${
              i === currentIdx
                ? 'w-7 h-2 bg-brand-pink shadow-glow-pink'
                : 'w-2 h-2 bg-white/30 hover:bg-white/60'
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
