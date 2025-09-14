import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory cache for avatars (in production, use Redis or similar)
const avatarCache = new Map<string, { svg: string; timestamp: number }>();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ seed: string }> }
) {
  try {
    const { seed } = await params;
    const { searchParams } = new URL(request.url);
    
    if (!seed) {
      return NextResponse.json(
        { error: 'Seed parameter is required' },
        { status: 400 }
      );
    }

    // Get query parameters
    const size = searchParams.get('size') || '100';
    const backgroundColor = searchParams.get('backgroundColor');
    
    // Create cache key
    const cacheKey = `${seed}-${size}-${backgroundColor || 'default'}`;
    
    // Check cache first
    const cached = avatarCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return new NextResponse(cached.svg, {
        status: 200,
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=31536000, immutable',
          'ETag': `"${cacheKey}"`,
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }
    
    // Construct the Dicebear API URL with parameters
    const dicebearParams = new URLSearchParams({
      seed: seed,
      size: size,
    });
    
    if (backgroundColor) {
      dicebearParams.append('backgroundColor', backgroundColor);
    }
    
    const dicebearUrl = `https://api.dicebear.com/7.x/avataaars/svg?${dicebearParams.toString()}`;
    
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
