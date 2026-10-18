import React from 'react';
import { Play, Heart, ShieldAlert, Sparkles } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full border-t border-white/10 bg-bg-secondary/80 mt-20 text-sm text-text-muted">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-purple to-brand-pink flex items-center justify-center">
                <Play className="w-4 h-4 text-white fill-white ml-0.5" />
              </div>
              <span className="font-heading font-black text-xl tracking-tight text-white">
                Ani<span className="text-brand-pink">Stream</span>
              </span>
            </div>
            <p className="text-sm text-text-muted max-w-md leading-relaxed">
              AniStream is a modern, high-performance anime streaming application synchronized with
              the HiAnime catalog. Enjoy dual-audio (SUB & DUB), high-definition playback, and
              instant episode navigation.
            </p>
            <div className="flex items-center gap-3 text-xs text-text-dim">
              <span className="flex items-center gap-1 text-brand-pink font-semibold">
                <Sparkles className="w-3.5 h-3.5" /> 100% Free Anime
              </span>
              <span>•</span>
              <span>No Account Required</span>
              <span>•</span>
              <span>Dual Audio SUB & DUB</span>
            </div>
          </div>

          {/* Navigation Links */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/" className="hover:text-brand-pink transition-colors">
                  First Home
                </a>
              </li>
              <li>
                <a href="/home" className="hover:text-brand-pink transition-colors">
                  Browse Catalog
                </a>
              </li>
              <li>
                <a href="/home?filter=trending" className="hover:text-brand-pink transition-colors">
                  Trending Shows
                </a>
              </li>
              <li>
                <a href="/home?genre=action" className="hover:text-brand-pink transition-colors">
                  Action Anime
                </a>
              </li>
              <li>
                <a href="/home?genre=fantasy" className="hover:text-brand-pink transition-colors">
                  Fantasy Series
                </a>
              </li>
            </ul>
          </div>

          {/* Legal / Disclaimer */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-yellow-400" />
              Disclaimer
            </h4>
            <p className="text-xs text-text-dim leading-relaxed">
              AniStream does not host or store any video files on its servers. All streams are
              provided and hosted by independent third-party services.
            </p>
          </div>
        </div>

        <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-text-dim">
          <div>
            © {new Date().getFullYear()} AniStream. Built for anime enthusiasts with{' '}
            <Heart className="w-3.5 h-3.5 text-brand-pink inline mx-0.5 fill-brand-pink" />.
          </div>
          <div className="flex items-center gap-4">
            <a href="/" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="/" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="https://hianime.ba" target="_blank" rel="noopener noreferrer" className="hover:text-brand-pink transition-colors">HiAnime Mirror</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
