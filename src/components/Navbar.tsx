'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Play, X, Compass, Flame, Film, Tv, Radio } from 'lucide-react';
import { SearchSuggestion } from '@/lib/types';

export default function Navbar() {
  const router = useRouter();
  const [keyword, setKeyword] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounced search suggestions
  useEffect(() => {
    if (!keyword.trim() || keyword.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/search/suggestions?keyword=${encodeURIComponent(keyword)}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.suggestions || []);
          setIsOpen((data.suggestions || []).length > 0);
        }
      } catch (err) {
        console.error('Suggestion fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [keyword]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) return;
    setIsOpen(false);
    router.push(`/home?search=${encodeURIComponent(keyword.trim())}`);
  };

  return (
    <header className="sticky top-0 z-50 w-full glass-panel border-b border-white/10 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Brand / Logo */}
        <a href="/" className="flex items-center gap-2 group flex-shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-purple to-brand-pink flex items-center justify-center shadow-glow-purple group-hover:scale-105 transition-transform duration-200">
            <Play className="w-5 h-5 text-white fill-white ml-0.5" />
          </div>
          <div className="flex flex-col">
            <span className="font-heading font-black text-xl tracking-tight text-white group-hover:text-brand-pink transition-colors">
              Ani<span className="text-brand-pink">Stream</span>
            </span>
          </div>
        </a>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-text-muted">
          <a
            href="/"
            className="px-3 py-1.5 rounded-lg hover:text-white hover:bg-white/5 transition-colors"
          >
            First Home
          </a>
          <a
            href="/home"
            className="px-3 py-1.5 rounded-lg hover:text-white hover:bg-white/5 transition-colors flex items-center gap-1.5"
          >
            <Compass className="w-4 h-4 text-brand-pink" />
            Catalog
          </a>
          <a
            href="/home?filter=trending"
            className="px-3 py-1.5 rounded-lg hover:text-white hover:bg-white/5 transition-colors flex items-center gap-1.5"
          >
            <Flame className="w-4 h-4 text-orange-400" />
            Trending
          </a>
          <a
            href="/home?genre=action"
            className="px-3 py-1.5 rounded-lg hover:text-white hover:bg-white/5 transition-colors"
          >
            Action
          </a>
          <a
            href="/home?genre=isekai"
            className="px-3 py-1.5 rounded-lg hover:text-white hover:bg-white/5 transition-colors"
          >
            Isekai
          </a>
        </nav>

        {/* Search Bar with Autocomplete Dropdown */}
        <div className="relative flex-1 max-w-md" ref={dropdownRef}>
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Search anime, movie, ova..."
              className="w-full bg-bg-input text-sm text-text-main placeholder-text-dim rounded-full pl-10 pr-10 py-2 border border-white/10 focus:outline-none focus:border-brand-purple focus:ring-1 focus:ring-brand-purple transition-all"
            />
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-text-muted" />
            {keyword && (
              <button
                type="button"
                onClick={() => {
                  setKeyword('');
                  setSuggestions([]);
                  setIsOpen(false);
                }}
                className="absolute right-3.5 top-2.5 text-text-muted hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </form>

          {/* Autocomplete Dropdown */}
          {isOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 glass-dropdown rounded-2xl overflow-hidden shadow-2xl z-50 max-h-[420px] overflow-y-auto">
              <div className="p-2 border-b border-white/5 text-xs font-semibold text-text-dim uppercase tracking-wider flex justify-between items-center">
                <span>Matching Anime</span>
                {isLoading && <span className="text-brand-pink animate-pulse">Searching...</span>}
              </div>
              <div className="divide-y divide-white/5">
                {suggestions.map((item) => (
                  <a
                    key={item.id}
                    href={`/watch/${encodeURIComponent(item.id)}`}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 p-2.5 hover:bg-white/10 transition-colors group"
                  >
                    <img
                      src={item.poster || 'https://hianime.ba/theme/images/anw-min.webp'}
                      alt={item.title}
                      className="w-10 h-14 object-cover rounded-md flex-shrink-0 group-hover:scale-105 transition-transform"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white group-hover:text-brand-pink truncate transition-colors">
                        {item.title}
                      </div>
                      {item.jname && (
                        <div className="text-xs text-text-dim truncate">{item.jname}</div>
                      )}
                      {item.meta && (
                        <div className="text-xs text-brand-blue font-semibold mt-0.5">
                          {item.meta}
                        </div>
                      )}
                    </div>
                  </a>
                ))}
              </div>
              <div className="p-2 bg-black/20 text-center">
                <button
                  type="button"
                  onClick={handleSearchSubmit}
                  className="text-xs font-semibold text-brand-pink hover:underline"
                >
                  View all results for &quot;{keyword}&quot; →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold">
            <span className="text-brand-green flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-green animate-ping inline-block"></span>
              SUB
            </span>
            <span className="text-white/30">|</span>
            <span className="text-brand-blue">DUB</span>
          </div>

          <a
            href="/home"
            className="hidden sm:inline-flex items-center justify-center px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl bg-gradient-to-r from-brand-purple to-brand-pink text-white shadow-glow-purple hover:opacity-95 hover:scale-102 transition-all"
          >
            Watch Anime
          </a>
        </div>
      </div>
    </header>
  );
}
