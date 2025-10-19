/**
 * HTML Sanitization Utilities
 * Provides XSS protection through DOMPurify
 */

import DOMPurify from 'isomorphic-dompurify';

// Configure DOMPurify with secure defaults
const configureDOMPurify = () => {
  // Allow specific safe tags and attributes
  const ALLOWED_TAGS = [
    'b', 'i', 'em', 'strong', 'u', 'span', 'div', 'p', 'br',
    'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'blockquote', 'pre', 'code', 'mark', 'small', 'del', 'ins'
  ];

  const ALLOWED_ATTR = [
    'class', 'id', 'title', 'data-*', 'aria-*'
  ];

  // Configure DOMPurify
  DOMPurify.setConfig({
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: true,
    ALLOW_ARIA_ATTR: true,
    FORBID_TAGS: ['script', 'object', 'embed', 'link', 'style', 'meta'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur', 'href', 'src'],
    KEEP_CONTENT: false,
    SANITIZE_DOM: true,
    FORCE_BODY: false,
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
    RETURN_TRUSTED_TYPE: false
  });

  return DOMPurify;
};

// Initialize sanitizer
const sanitizer = configureDOMPurify();

export interface SanitizeOptions {
  allowedTags?: string[];
  allowedAttributes?: string[];
  stripTags?: boolean;
  maxLength?: number;
}

/**
 * Sanitize HTML content to prevent XSS attacks
 */
export function sanitizeHTML(
  dirty: string, 
  options: SanitizeOptions = {}
): string {
  if (!dirty || typeof dirty !== 'string') {
    return '';
  }

  try {
    // Apply length limit if specified
    let content = dirty;
    if (options.maxLength && content.length > options.maxLength) {
      content = content.substring(0, options.maxLength) + '...';
    }

    // Configure sanitizer if custom options provided
    if (options.allowedTags || options.allowedAttributes) {
      const customConfig: any = {};
      
      if (options.allowedTags) {
        customConfig.ALLOWED_TAGS = options.allowedTags;
      }
      
      if (options.allowedAttributes) {
        customConfig.ALLOWED_ATTR = options.allowedAttributes;
      }

      return DOMPurify.sanitize(content, customConfig) as unknown as string;
    }

    // Strip all tags if requested
    if (options.stripTags) {
      return DOMPurify.sanitize(content, { 
        ALLOWED_TAGS: [], 
        ALLOWED_ATTR: [],
        KEEP_CONTENT: true 
      }) as unknown as string;
    }

    // Use default configuration
    return sanitizer.sanitize(content) as unknown as string;
  } catch (error) {
    console.error('HTML sanitization error:', error);
    // Return empty string on error for security
    return '';
  }
}

/**
 * Sanitize plain text (removes all HTML and special characters)
 */
export function sanitizeText(input: string, maxLength?: number): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  try {
    // Remove all HTML tags and decode entities
    let cleaned = DOMPurify.sanitize(input, { 
      ALLOWED_TAGS: [], 
      ALLOWED_ATTR: [],
      KEEP_CONTENT: true 
    }) as unknown as string;

    // Remove extra whitespace
    cleaned = cleaned.replace(/\s+/g, ' ').trim();

    // Apply length limit
    if (maxLength && cleaned.length > maxLength) {
      cleaned = cleaned.substring(0, maxLength).trim() + '...';
    }

    return cleaned;
  } catch (error) {
    console.error('Text sanitization error:', error);
    return '';
  }
}

/**
 * Sanitize user input for search queries
 */
export function sanitizeSearchQuery(query: string): string {
  if (!query || typeof query !== 'string') {
    return '';
  }

  try {
    // Remove special characters that could be used for injection
    const cleaned = query
      .replace(/[<>\"'%&\x00-\x1f\x7f-\x9f]/g, '') // Remove dangerous characters
      .replace(/[^\w\s\-\.]/g, '') // Keep only alphanumeric, spaces, hyphens, and dots
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
      .substring(0, 200); // Limit length

    return cleaned;
  } catch (error) {
    console.error('Search query sanitization error:', error);
    return '';
  }
}

/**
 * Sanitize file names
 */
export function sanitizeFileName(fileName: string): string {
  if (!fileName || typeof fileName !== 'string') {
    return 'untitled';
  }

  try {
    // Remove path traversal attempts and dangerous characters
    const cleaned = fileName
      .replace(/[\/\\:*?"<>|]/g, '_') // Replace dangerous characters
      .replace(/\.\./g, '_') // Remove path traversal
      .replace(/^\.+/, '') // Remove leading dots
      .replace(/[^\w\-\._]/g, '_') // Keep only safe characters
      .replace(/_+/g, '_') // Replace multiple underscores with single
      .trim()
      .substring(0, 255); // Limit length

    return cleaned || 'untitled';
  } catch (error) {
    console.error('File name sanitization error:', error);
    return 'untitled';
  }
}

/**
 * Validate and sanitize URLs
 */
export function sanitizeURL(url: string): string | null {
  if (!url || typeof url !== 'string') {
    return null;
  }

  try {
    // Basic URL validation before parsing
    if (url.length > 2048) {
      return null; // Prevent extremely long URLs
    }

    const urlObj = new URL(url);
    
    // Only allow safe protocols
    const allowedProtocols = ['http:', 'https:', 'mailto:'];
    if (!allowedProtocols.includes(urlObj.protocol)) {
      return null;
    }

    // Block dangerous hosts (localhost, private IPs)
    const hostname = urlObj.hostname.toLowerCase();
    const blockedHosts = [
      'localhost',
      '127.0.0.1',
      '0.0.0.0',
      '[::]',
      '::1'
    ];

    if (blockedHosts.includes(hostname)) {
      return null;
    }

    // Block private IP ranges (improved regex)
    if (hostname.match(/^(10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|192\.168\.|169\.254\.|127\.)/)) {
      return null;
    }

    // Block suspicious patterns
    if (hostname.includes('..') || hostname.includes('//')) {
      return null;
    }

    return urlObj.toString();
  } catch (error) {
    console.error('URL sanitization error:', error);
    return null;
  }
}

/**
 * Create a safe highlight function that prevents XSS
 */
export function safeHighlight(
  text: string, 
  matches: readonly [number, number][] | undefined,
  className: string = 'highlight'
): string {
  if (!text || !matches || matches.length === 0) {
    return sanitizeHTML(text);
  }

  try {
    // First sanitize the input text
    const cleanText = sanitizeText(text);
    
    // Validate matches array
    const validMatches = matches.filter(([start, end]) => 
      typeof start === 'number' && 
      typeof end === 'number' && 
      start >= 0 && 
      end >= start && 
      start < cleanText.length && 
      end < cleanText.length
    );
    
    if (validMatches.length === 0) {
      return sanitizeHTML(text);
    }
    
    // Sort matches by start position (descending) to avoid index shifting
    const sortedMatches = [...validMatches].sort((a, b) => b[0] - a[0]);
    
    let result = cleanText;
    
    // Apply highlights from end to beginning
    for (const [start, end] of sortedMatches) {
      if (start >= 0 && end <= result.length && start < end) {
        const before = result.substring(0, start);
        const highlighted = result.substring(start, end + 1);
        const after = result.substring(end + 1);
        
        // Use safe HTML construction with sanitized className
        const safeClassName = sanitizeText(className).replace(/[^a-zA-Z0-9\-_]/g, '');
        result = `${before}<span class="${safeClassName}">${highlighted}</span>${after}`;
      }
    }
    
    return result;
  } catch (error) {
    console.error('Safe highlight error:', error);
    return sanitizeHTML(text);
  }
}

/**
 * Sanitize object properties recursively
 */
export function sanitizeObject<T extends Record<string, any>>(
  obj: T,
  maxDepth: number = 5
): T {
  if (!obj || typeof obj !== 'object' || maxDepth <= 0) {
    return obj;
  }

  try {
    const result = {} as T;

    for (const [key, value] of Object.entries(obj)) {
      const sanitizedKey = sanitizeText(key);
      
      if (typeof value === 'string') {
        result[sanitizedKey as keyof T] = sanitizeHTML(value) as T[keyof T];
      } else if (Array.isArray(value)) {
        result[sanitizedKey as keyof T] = value.map(item => 
          typeof item === 'string' ? sanitizeHTML(item) : 
          typeof item === 'object' && item !== null ? sanitizeObject(item, maxDepth - 1) : item
        ) as T[keyof T];
      } else if (typeof value === 'object' && value !== null) {
        result[sanitizedKey as keyof T] = sanitizeObject(value, maxDepth - 1) as T[keyof T];
      } else {
        result[sanitizedKey as keyof T] = value;
      }
    }

    return result;
  } catch (error) {
    console.error('Object sanitization error:', error);
    // Return a safe empty object on error
    return {} as T;
  }
}

/**
 * Create safe React props for dangerouslySetInnerHTML
 */
export function createSafeHTML(html: string, options?: SanitizeOptions) {
  return {
    __html: sanitizeHTML(html, options)
  };
}

// Export configured DOMPurify instance for advanced usage
export { sanitizer as DOMPurify };

// Default export
export default {
  sanitizeHTML,
  sanitizeText,
  sanitizeSearchQuery,
  sanitizeFileName,
  sanitizeURL,
  safeHighlight,
  sanitizeObject,
  createSafeHTML
};
