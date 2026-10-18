'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  RotateCw,
  Lightbulb,
  Maximize,
  ChevronLeft,
  ChevronRight,
  Server,
  Tv,
  ShieldCheck,
} from 'lucide-react';
import { ServerResponse, ServerItem, EpisodeItem } from '@/lib/types';

interface VideoPlayerProps {
  episodeId: string;
  episodeNum?: number;
  animeTitle?: string;
  onPrevEpisode?: () => void;
  onNextEpisode?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
}

export default function VideoPlayer({
  episodeId,
  episodeNum = 1,
  animeTitle,
  onPrevEpisode,
  onNextEpisode,
  hasPrev = false,
  hasNext = false,
}: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [servers, setServers] = useState<ServerResponse | null>(null);
  const [audioType, setAudioType] = useState<'sub' | 'dub'>('sub');
  const [activeServer, setActiveServer] = useState<ServerItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [cinemaMode, setCinemaMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [adShield, setAdShield] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fullscreen container handler & listener
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => {
        console.warn('Fullscreen request failed:', err);
      });
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  // Loophole Protection: Intercept any popup calls escaping to the parent window
  useEffect(() => {
    const originalOpen = window.open;
    window.open = function (...args: any[]) {
      console.warn('[AniStream Ad Shield] Intercepted and blocked popup window.open attempt:', args);
      return null;
    };
    return () => {
      window.open = originalOpen;
    };
  }, []);

  // Fetch servers for current episode
  useEffect(() => {
    if (!episodeId) return;

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    async function loadServers() {
      try {
        const res = await fetch(`/api/servers/${episodeId}`);
        if (!res.ok) throw new Error('Failed to fetch streaming servers');
        const data: ServerResponse = await res.json();

        if (isMounted) {
          setServers(data);
          const defaultList = data.sub.length > 0 ? data.sub : data.dub;
          const defaultAudio = data.sub.length > 0 ? 'sub' : 'dub';
          setAudioType(defaultAudio);
          setActiveServer(defaultList[0] || null);
        }
      } catch (err: any) {
        if (isMounted) {
          console.error('Server fetch error:', err);
          setError('Failed to resolve streaming server link. Please try reloading or select another server.');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadServers();

    return () => {
      isMounted = false;
    };
  }, [episodeId]);

  // Handle Audio tab switch
  const handleAudioSwitch = (type: 'sub' | 'dub') => {
    setAudioType(type);
    if (!servers) return;
    const list = type === 'dub' ? servers.dub : servers.sub;
    if (list.length > 0) {
      setActiveServer(list[0]);
    }
  };

  const handleReload = () => {
    if (activeServer) {
      const cur = activeServer;
      setActiveServer(null);
      setTimeout(() => setActiveServer(cur), 150);
    }
  };

  return (
    <div
      className={`space-y-4 transition-all duration-300 ${
        cinemaMode ? 'fixed inset-0 z-50 bg-black/95 p-4 sm:p-8 flex flex-col justify-center' : ''
      }`}
    >
      {/* Video Container */}
      <div
        ref={containerRef}
        className="relative w-full aspect-video rounded-3xl overflow-hidden bg-black border border-white/10 shadow-2xl"
      >
        {isLoading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-bg-secondary">
            <div className="w-12 h-12 border-4 border-brand-purple border-t-transparent rounded-full animate-spin" />
            <div className="text-sm font-medium text-text-muted">
              Connecting to HiAnime streaming server...
            </div>
          </div>
        ) : error || !activeServer?.embedUrl ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-bg-secondary gap-3">
            <Tv className="w-12 h-12 text-brand-pink" />
            <p className="text-white font-medium max-w-md">{error || 'No streaming server available for this episode.'}</p>
            <button
              type="button"
              onClick={handleReload}
              className="px-4 py-2 rounded-xl bg-brand-purple text-white text-xs font-semibold hover:opacity-90 flex items-center gap-2"
            >
              <RotateCw className="w-4 h-4" /> Try Reconnecting
            </button>
          </div>
        ) : (
          <iframe
            key={`${activeServer.embedUrl}-${adShield}`}
            src={
              activeServer.embedUrl.startsWith('http')
                ? `/api/embed-proxy?url=${encodeURIComponent(activeServer.embedUrl)}`
                : activeServer.embedUrl
            }
            className="w-full h-full border-0"
            sandbox={
              adShield
                ? 'allow-scripts allow-same-origin allow-forms allow-presentation allow-orientation-lock allow-pointer-lock allow-downloads'
                : undefined
            }
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        )}

        {/* Custom AniStream Branding Badge (Masks Host Watermark) */}
        {!isLoading && !error && activeServer?.embedUrl && (
          <div className="absolute top-2.5 right-2.5 z-10 pointer-events-none select-none flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-bg/95 backdrop-blur-md border border-white/10 shadow-lg min-w-[135px] justify-center">
            <div className="w-2 h-2 rounded-full bg-brand-pink animate-pulse" />
            <span className="font-heading font-black text-xs tracking-tight text-white">
              Ani<span className="text-brand-pink">Stream</span>
            </span>
            <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-brand-purple/20 text-brand-purpleLight border border-brand-purple/30">
              HD
            </span>
          </div>
        )}

        {/* Cinema Mode Close Button */}
        {cinemaMode && (
          <button
            type="button"
            onClick={() => setCinemaMode(false)}
            className="absolute top-4 left-4 z-20 px-3.5 py-1.5 rounded-xl bg-black/80 hover:bg-black text-white text-xs font-bold border border-white/20 shadow-lg"
          >
            ← Exit Cinema Mode
          </button>
        )}
      </div>

      {/* Control Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-bg-card border border-white/5">
        
        {/* Left: Episode navigation */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={!hasPrev}
            onClick={onPrevEpisode}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 border transition-all ${
              hasPrev
                ? 'bg-white/5 hover:bg-white/10 text-white border-white/10 cursor-pointer'
                : 'opacity-40 text-text-dim border-transparent cursor-not-allowed'
            }`}
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Prev Ep
          </button>
          <span className="px-3 py-1 rounded-xl bg-brand-purple/20 text-brand-purpleLight font-bold text-xs border border-brand-purple/30">
            Episode {episodeNum}
          </span>
          <button
            type="button"
            disabled={!hasNext}
            onClick={onNextEpisode}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 border transition-all ${
              hasNext
                ? 'bg-white/5 hover:bg-white/10 text-white border-white/10 cursor-pointer'
                : 'opacity-40 text-text-dim border-transparent cursor-not-allowed'
            }`}
          >
            Next Ep <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right: Player Utilities */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReload}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-text-muted hover:text-white border border-white/10 text-xs transition-colors"
            title="Reload Player"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setAdShield(!adShield)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
              adShield
                ? 'bg-emerald-500/20 text-brand-green border-emerald-500/30 shadow-md'
                : 'bg-white/5 text-text-dim border-white/10'
            }`}
            title={adShield ? 'Ad Shield: Active (Popups & Redirects Blocked)' : 'Ad Shield: Off'}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{adShield ? 'Ad Shield ON' : 'Ad Shield OFF'}</span>
          </button>
          <button
            type="button"
            onClick={() => setCinemaMode(!cinemaMode)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 border transition-all ${
              cinemaMode
                ? 'bg-brand-pink text-bg border-transparent font-bold'
                : 'bg-white/5 hover:bg-white/10 text-white border-white/10'
            }`}
            title="Toggle Cinema Mode"
          >
            <Lightbulb className="w-3.5 h-3.5" />
            <span>Cinema</span>
          </button>
          <button
            type="button"
            onClick={toggleFullscreen}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 border transition-all ${
              isFullscreen
                ? 'bg-brand-purple text-white border-transparent font-bold shadow-glow-purple'
                : 'bg-white/5 hover:bg-white/10 text-white border-white/10'
            }`}
            title="Toggle Fullscreen"
          >
            <Maximize className="w-3.5 h-3.5" />
            <span>{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
          </button>
        </div>
      </div>

      {/* Server Selector Panel */}
      {servers && (
        <div className="p-4 rounded-2xl bg-bg-card border border-white/5 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-text-dim uppercase tracking-wider">
            <span className="flex items-center gap-1.5 text-white">
              <Server className="w-4 h-4 text-brand-pink" />
              Streaming Servers
            </span>
            <span>If current server is slow or buffering, choose another below</span>
          </div>

          <div className="space-y-2.5">
            {/* SUB Servers */}
            {servers.sub.length > 0 && (
              <div className="flex items-center gap-3">
                <span className="w-12 text-xs font-bold text-brand-green">SUB:</span>
                <div className="flex flex-wrap items-center gap-2">
                  {servers.sub.map((s, idx) => {
                    const isSelected = audioType === 'sub' && activeServer?.embedUrl === s.embedUrl;
                    return (
                      <button
                        key={`sub-${idx}`}
                        type="button"
                        onClick={() => {
                          setAudioType('sub');
                          setActiveServer(s);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                          isSelected
                            ? 'bg-brand-purple text-white border-brand-purple shadow-glow-purple scale-105'
                            : 'bg-white/5 hover:bg-white/10 text-text-muted hover:text-white border-white/10'
                        }`}
                      >
                        {s.name || `Server ${idx + 1}`}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* DUB Servers */}
            {servers.dub.length > 0 && (
              <div className="flex items-center gap-3">
                <span className="w-12 text-xs font-bold text-brand-blue">DUB:</span>
                <div className="flex flex-wrap items-center gap-2">
                  {servers.dub.map((s, idx) => {
                    const isSelected = audioType === 'dub' && activeServer?.embedUrl === s.embedUrl;
                    return (
                      <button
                        key={`dub-${idx}`}
                        type="button"
                        onClick={() => {
                          setAudioType('dub');
                          setActiveServer(s);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                          isSelected
                            ? 'bg-brand-purple text-white border-brand-purple shadow-glow-purple scale-105'
                            : 'bg-white/5 hover:bg-white/10 text-text-muted hover:text-white border-white/10'
                        }`}
                      >
                        {s.name || `Server ${idx + 1}`}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
