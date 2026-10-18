import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const targetUrl = searchParams.get('url');

    if (!targetUrl) {
      return new NextResponse('Missing target URL', { status: 400 });
    }

    const urlObj = new URL(targetUrl);
    const res = await axios.get(targetUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        Referer: 'https://hianime.ba/',
      },
      responseType: 'text',
      timeout: 12000,
    });

    let html = res.data;

    // Inject base href and watermark / ad suppression styles
    const injection = `
      <base href="${urlObj.origin}/">
      <style>
        .osp-brand, #adbar, .jw-logo, [class*="brand"], [class*="watermark"], div[style*="brand.png"] {
          display: none !important;
          opacity: 0 !important;
          visibility: hidden !important;
          pointer-events: none !important;
          width: 0 !important;
          height: 0 !important;
        }
      </style>
      <script>
        // Block popups and redirects inside embed
        window.open = function() { return null; };
      </script>
    `;

    if (html.includes('<head>')) {
      html = html.replace('<head>', `<head>${injection}`);
    } else {
      html = `${injection}${html}`;
    }

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (error: any) {
    console.error('Embed proxy error:', error.message);
    return new NextResponse('Failed to proxy embed', { status: 500 });
  }
}
