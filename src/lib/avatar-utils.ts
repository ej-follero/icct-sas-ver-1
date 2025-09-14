/**
 * Avatar utility functions for generating and handling user avatars
 */

export interface AvatarOptions {
  seed?: string;
  size?: number;
  style?: 'avataaars' | 'bottts' | 'pixel-art' | 'identicon';
  backgroundColor?: string;
}

/**
 * Generate a consistent seed from user data
 */
export function generateAvatarSeed(firstName?: string, lastName?: string, email?: string): string {
  if (firstName && lastName) {
    return `${firstName}${lastName}`.replace(/[^a-zA-Z0-9]/g, '');
  }
  if (email) {
    return email.split('@')[0];
  }
  return 'default';
}

/**
 * Generate avatar URL using our proxy API
 */
export function generateAvatarUrl(seed: string, options: AvatarOptions = {}): string {
  const { style = 'avataaars', size = 100, backgroundColor } = options;
  
  // Use our proxy API to avoid CORS issues
  // Use a stable URL that doesn't change unless the seed or options change
  const baseUrl = `/api/avatar/${encodeURIComponent(seed)}`;
  
  // Only add query parameters if they differ from defaults
  const params = new URLSearchParams();
  if (size !== 100) params.append('size', size.toString());
  if (backgroundColor) params.append('backgroundColor', backgroundColor);
  
  const queryString = params.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

/**
 * Generate avatar URL for a user
 */
export function generateUserAvatarUrl(
  firstName?: string,
  lastName?: string,
  email?: string,
  options: AvatarOptions = {}
): string {
  const seed = generateAvatarSeed(firstName, lastName, email);
  return generateAvatarUrl(seed, options);
}

/**
 * Generate initials for avatar fallback
 */
export function generateInitials(firstName?: string, lastName?: string): string {
  const first = firstName?.charAt(0).toUpperCase() || '';
  const last = lastName?.charAt(0).toUpperCase() || '';
  return `${first}${last}` || '?';
}

/**
 * Get avatar color based on user data
 */
export function getAvatarColor(seed: string): string {
  const colors = [
    '#f56565', '#ed8936', '#ecc94b', '#48bb78',
    '#38b2ac', '#4299e1', '#667eea', '#9f7aea',
    '#ed64a6', '#f687b3', '#fc8181', '#fbb6ce'
  ];
  
  // Simple hash function to get consistent color
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return colors[Math.abs(hash) % colors.length];
}

/**
 * Create a fallback avatar SVG
 */
export function createFallbackAvatar(
  initials: string,
  color: string,
  size: number = 100
): string {
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="${color}"/>
      <text x="${size/2}" y="${size/2 + size/8}" 
            font-family="Arial, sans-serif" 
            font-size="${size/3}" 
            font-weight="bold" 
            text-anchor="middle" 
            fill="white">
        ${initials}
      </text>
    </svg>
  `.trim();
}
