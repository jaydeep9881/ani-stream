import type { Metadata, Viewport } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'AniStream — Watch Free Anime Online in HD (HiAnime Mirror)',
  description:
    'Stream popular anime shows and movies online for free with English subbed and dubbed options. High speed streaming, synchronized subtitles, and daily updates.',
  keywords: [
    'anime',
    'stream anime',
    'watch anime free',
    'hianime',
    'anistream',
    'english sub',
    'english dub',
  ],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0e0d1a',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-bg text-text-main flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
