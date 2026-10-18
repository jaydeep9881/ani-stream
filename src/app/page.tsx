'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  ArrowRight,
  Tv,
  Zap,
  Globe2,
  ShieldCheck,
  MessageSquare,
  Sparkles,
  Play,
} from 'lucide-react';
import { LandingData, SearchSuggestion } from '@/lib/types';

export default function LandingPage() {
  const router = useRouter();
  const [keyword, setKeyword] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [landingData, setLandingData] = useState<LandingData | null>(null);

  // Fetch landing data (top searches, discussions)
  useEffect(() => {
    async function loadLanding() {
      try {
        const res = await fetch('/api/landing');
        if (res.ok) {
          const data = await res.json();
          setLandingData(data);
        }
      } catch (err) {
        console.error('Landing data fetch error:', err);
      }
    }
    loadLanding();
  }, []);

  // Debounced search suggestions
  useEffect(() => {
    if (!keyword.trim() || keyword.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search/suggestions?keyword=${encodeURIComponent(keyword)}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.suggestions || []);
          setIsOpen((data.suggestions || []).length > 0);
        }
      } catch (err) {
        console.error('Suggestions error:', err);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [keyword]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) return;
    router.push(`/home?search=${encodeURIComponent(keyword.trim())}`);
  };

  return (
    <div className="space-y-16 py-8">
      {/* ── 1. HERO SECTION ── */}
      <section className="flex flex-col items-center text-center space-y-6 pt-4 sm:pt-10">
        
        {/* Mascot Banner */}
        <div className="relative group">
          <div className="absolute -inset-4 bg-gradient-to-r from-brand-purple to-brand-pink rounded-full blur-xl opacity-30 group-hover:opacity-50 transition-opacity" />
          <img
            src="https://hianime.ba/theme/images/anw-min.webp"
            alt="AniStream Mascot"
            className="relative w-48 sm:w-64 h-auto object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-300"
          />
        </div>

        {/* Hero Headlines */}
        <div className="space-y-3 max-w-2xl">
          <h1 className="font-heading font-black text-3xl sm:text-5xl lg:text-6xl text-white tracking-tight">
            Ani<span className="text-brand-pink">Stream</span>
          </h1>
          <p className="text-base sm:text-lg text-text-muted">
            The ultimate destination to watch anime online free in HD with synchronized SUB & DUB.
          </p>
        </div>

        {/* Central Search Box with Autocomplete */}
        <div className="relative w-full max-w-xl">
          <form onSubmit={handleSearch} className="relative flex items-center">
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Search anime title, e.g. Solo Leveling, Bleach, One Piece..."
              className="w-full h-14 bg-bg-card text-white text-base pl-12 pr-14 rounded-2xl border border-white/10 shadow-2xl focus:outline-none focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/40 transition-all placeholder:text-text-dim"
            />
            <Search className="absolute left-4 w-5 h-5 text-text-muted" />
            <button
              type="submit"
              className="absolute right-2.5 w-10 h-10 rounded-xl bg-gradient-to-r from-brand-purple to-brand-pink text-white flex items-center justify-center shadow-glow-purple hover:scale-105 transition-transform"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>

          {/* Autocomplete Suggestions Box */}
          {isOpen && (
            <div className="absolute top-full left-0 right-0 mt-3 glass-dropdown rounded-2xl overflow-hidden shadow-2xl z-50 text-left">
              <div className="p-3 border-b border-white/5 text-xs font-bold text-text-dim uppercase tracking-wider flex justify-between">
                <span>Suggested Anime</span>
                <span className="text-brand-pink">{suggestions.length} results</span>
              </div>
              <div className="divide-y divide-white/5 max-h-80 overflow-y-auto">
                {suggestions.map((item) => (
                  <a
                    key={item.id}
                    href={`/watch/${encodeURIComponent(item.id)}`}
                    className="flex items-center gap-3 p-3 hover:bg-white/10 transition-colors group"
                  >
                    <img
                      src={item.poster || 'https://hianime.ba/theme/images/anw-min.webp'}
                      alt={item.title}
                      className="w-11 h-14 object-cover rounded-md flex-shrink-0 group-hover:scale-105 transition-transform"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-white group-hover:text-brand-pink truncate transition-colors">
                        {item.title}
                      </div>
                      {item.jname && (
                        <div className="text-xs text-text-dim truncate">{item.jname}</div>
                      )}
                      {item.meta && (
                        <div className="text-xs text-brand-blue font-bold mt-0.5">{item.meta}</div>
                      )}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Top Search Tags */}
        <div className="max-w-2xl flex flex-wrap items-center justify-center gap-2 pt-1">
          <span className="text-xs font-bold text-text-dim uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-brand-pink" /> Top Searches:
          </span>
          {(landingData?.topSearches || [
            'Solo Leveling',
            'One Piece',
            'Jujutsu Kaisen',
            'Demon Slayer',
            'Bleach',
            'Attack on Titan',
          ]).map((kw, i) => (
            <button
              key={i}
              type="button"
              onClick={() => router.push(`/home?search=${encodeURIComponent(kw)}`)}
              className="px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 text-text-muted hover:text-brand-pink border border-white/5 text-xs font-medium transition-colors"
            >
              {kw}
            </button>
          ))}
        </div>

        {/* Big CTA Button to Full Catalog */}
        <div className="pt-4">
          <a
            href="/home"
            className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-brand-purple via-fuchsia-600 to-brand-pink text-white font-bold text-base tracking-wide shadow-glow-purple hover:scale-105 active:scale-95 transition-all duration-200"
          >
            <Play className="w-5 h-5 fill-white" />
            <span>Go to Full Catalog & Player</span>
            <ArrowRight className="w-5 h-5" />
          </a>
        </div>
      </section>

      {/* ── 2. COMMUNITY DISCUSSIONS ── */}
      {landingData && landingData.communityPosts.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-brand-pink" />
              <h2 className="font-heading font-black text-xl text-white">Community Discussions</h2>
            </div>
            <a href="/home" className="text-xs font-semibold text-brand-pink hover:underline">
              Join Conversation →
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {landingData.communityPosts.map((post, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-bg-card border border-white/5 hover:border-brand-purple/40 space-y-3 transition-all hover:-translate-y-1"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="px-2 py-0.5 rounded-full bg-brand-purple/20 text-brand-purpleLight font-bold">
                    {post.tag}
                  </span>
                  <span className="text-text-dim">{post.time}</span>
                </div>
                <h3 className="font-heading font-semibold text-sm text-white line-clamp-2 hover:text-brand-pink transition-colors">
                  {post.title}
                </h3>
                <p className="text-xs text-text-muted line-clamp-2">{post.snippet}</p>
                <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs text-text-dim">
                  <div className="flex items-center gap-2">
                    <img
                      src={post.avatar}
                      alt={post.author}
                      className="w-5 h-5 rounded-full border border-white/10"
                    />
                    <span className="text-text-muted">{post.author}</span>
                  </div>
                  <span>{post.replies} replies</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── 3. FEATURE HIGHLIGHTS ── */}
      <section className="space-y-6 pt-6">
        <div className="text-center space-y-2">
          <h2 className="font-heading font-black text-2xl sm:text-3xl text-white">
            Why Stream on AniStream?
          </h2>
          <p className="text-sm text-text-muted max-w-xl mx-auto">
            Engineered with modern web standards, synchronized HiAnime mirror servers, and zero
            annoying obstacles.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-3xl bg-bg-card border border-white/5 space-y-3 hover:border-brand-purple/30 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-brand-purple/20 text-brand-purple flex items-center justify-center">
              <Tv className="w-6 h-6" />
            </div>
            <h3 className="font-heading font-bold text-base text-white">Ultra HD Streaming</h3>
            <p className="text-xs text-text-muted leading-relaxed">
              Crystal-clear 1080p and 720p streams powered by fast CDN networks for stutter-free playback.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-bg-card border border-white/5 space-y-3 hover:border-brand-purple/30 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-brand-pink/20 text-brand-pink flex items-center justify-center">
              <Globe2 className="w-6 h-6" />
            </div>
            <h3 className="font-heading font-bold text-base text-white">Dual Audio SUB & DUB</h3>
            <p className="text-xs text-text-muted leading-relaxed">
              Toggle effortlessly between authentic Japanese voice acting with English subs and full English dubs.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-bg-card border border-white/5 space-y-3 hover:border-brand-purple/30 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-brand-green flex items-center justify-center">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="font-heading font-bold text-base text-white">Zero Account Wall</h3>
            <p className="text-xs text-text-muted leading-relaxed">
              No registration, credit card, or passwords required. Click, pick your episode, and start watching immediately.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-bg-card border border-white/5 space-y-3 hover:border-brand-purple/30 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/20 text-brand-blue flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-heading font-bold text-base text-white">Safe & Secure</h3>
            <p className="text-xs text-text-muted leading-relaxed">
              Clean, protected browsing environment with sandboxed video embeds and zero intrusive trackers.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
