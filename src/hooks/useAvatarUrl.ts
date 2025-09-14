import { useMemo } from 'react';
import { generateUserAvatarUrl, AvatarOptions } from '@/lib/avatar-utils';

/**
 * Custom hook to generate and memoize avatar URLs
 * This prevents unnecessary re-renders when the same avatar is requested multiple times
 */
export function useAvatarUrl(
  firstName?: string,
  lastName?: string,
  email?: string,
  options: AvatarOptions = {}
): string {
  return useMemo(() => {
    return generateUserAvatarUrl(firstName, lastName, email, options);
  }, [firstName, lastName, email, options.size, options.backgroundColor, options.style]);
}

/**
 * Custom hook to generate and memoize avatar URLs with a stable seed
 */
export function useStableAvatarUrl(
  seed: string,
  options: AvatarOptions = {}
): string {
  return useMemo(() => {
    // Import the function directly to avoid circular dependencies
    const { generateAvatarUrl } = require('@/lib/avatar-utils');
    return generateAvatarUrl(seed, options);
  }, [seed, options.size, options.backgroundColor, options.style]);
}
