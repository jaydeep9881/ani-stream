export interface AnimeItem {
  id: string;
  title: string;
  poster: string;
  banner?: string;
  subCount?: number;
  dubCount?: number;
  type?: string;
  score?: string;
  quality?: string;
  duration?: string;
  desc?: string;
}

export interface SpotlightItem {
  id: string;
  title: string;
  desc: string;
  score: string;
  poster: string;
  banner?: string;
  type?: string;
  quality?: string;
  subCount?: number;
  dubCount?: number;
}

export interface SearchSuggestion {
  id: string;
  title: string;
  jname?: string;
  poster: string;
  meta?: string;
}

export interface EpisodeItem {
  id: string;
  num: number;
  title: string;
}

export interface ServerItem {
  name: string;
  type: 'sub' | 'dub';
  embedUrl: string;
}

export interface ServerResponse {
  episodeId: string;
  sub: ServerItem[];
  dub: ServerItem[];
}

export interface AnimeDetail {
  id: string;
  animeIdNum: string;
  title: string;
  jpTitle?: string;
  desc: string;
  poster: string;
  rating?: string;
  quality?: string;
  subCount: number;
  dubCount: number;
  studio?: string;
  status?: string;
  aired?: string;
  genres: string[];
  score: string;
}

export interface CommunityPost {
  tag: string;
  time: string;
  replies: string;
  title: string;
  snippet: string;
  author: string;
  avatar: string;
}

export interface LandingData {
  topSearches: string[];
  communityPosts: CommunityPost[];
}

export interface CatalogData {
  spotlights: SpotlightItem[];
  trending: AnimeItem[];
}
