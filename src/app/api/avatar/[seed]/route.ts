import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory cache for avatars (in production, use Redis or similar)
const avatarCache = new Map<string, { svg: string; timestamp: number }>();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ seed: string }> }
) {
  const { seed } = await params;
  try {
    const { searchParams } = new URL(request.url);
    
    if (!seed) {
      return NextResponse.json(
        { error: 'Seed parameter is required' },
        { status: 400 }
      );
    }

    // Get and sanitize query parameters
    const rawSize = searchParams.get('size');
    const style = (searchParams.get('style') || 'avataaars').trim();
    const backgroundColor = searchParams.get('backgroundColor') || undefined;

    // Sanitize seed: keep alphanum, dash, underscore; cap length
    const safeSeed = String(seed).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 100) || 'user';

    // Validate and clamp size
    let sizeNum = parseInt(rawSize || '100', 10);
    if (!Number.isFinite(sizeNum)) sizeNum = 100;
    sizeNum = Math.max(24, Math.min(512, sizeNum));
    
    // Create cache key
    const cacheKey = `${style}-${safeSeed}-${sizeNum}-${backgroundColor || 'default'}`;
    
    // Check cache first
    const cached = avatarCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      // Handle conditional request (ETag)
      const ifNoneMatch = request.headers.get('if-none-match');
      const etag = `"${cacheKey}"`;
      if (ifNoneMatch && ifNoneMatch === etag) {
        return new NextResponse(null, {
          status: 304,
          headers: {
            'ETag': etag,
            'Cache-Control': 'public, max-age=31536000, immutable',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET',
            'Access-Control-Allow-Headers': 'Content-Type',
          }
        });
      }
      return new NextResponse(cached.svg, {
        status: 200,
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=31536000, immutable',
          'ETag': etag,
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }
    
    // Construct the DiceBear API URL with parameters
    const dicebearParams = new URLSearchParams({
      seed: safeSeed,
      size: String(sizeNum),
    });
    
    // Validate backgroundColor (hex without #)
    if (backgroundColor && /^[0-9a-fA-F]{3,8}$/.test(backgroundColor)) {
      dicebearParams.append('backgroundColor', backgroundColor);
    }
    
    const dicebearUrl = `https://api.dicebear.com/7.x/${encodeURIComponent(style)}/svg?${dicebearParams.toString()}`;
    
    // Fetch the avatar from Dicebear
    const response = await fetch(dicebearUrl, {
      headers: {
        'User-Agent': 'ICCT-Attendance-System/1.0',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch avatar: ${response.statusText}`);
    }

    // Get the SVG content
    const svgContent = await response.text();
    
    // Cache the result
    avatarCache.set(cacheKey, {
      svg: svgContent,
      timestamp: Date.now()
    });
    
    // Return the SVG with proper headers and stronger caching
    return new NextResponse(svgContent, {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=31536000, immutable', // Cache for 1 year, immutable
        'ETag': `"${cacheKey}"`, // Add ETag for better caching
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });

  } catch (error) {
    console.error('Avatar proxy error:', error);
    
    // Return a fallback avatar instead of an error
    const fallbackSvg = `
      <svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="50" fill="#e5e7eb"/>
        <text x="50" y="55" font-family="Arial, sans-serif" font-size="24" font-weight="bold" text-anchor="middle" fill="#6b7280">?</text>
      </svg>
    `.trim();
    
    return new NextResponse(fallbackSvg, {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=31536000, immutable', // Cache for 1 year, immutable
        'ETag': `"fallback-${seed}"`, // Add ETag for better caching
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }
}
