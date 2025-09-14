'use client';

import React, { useState, useMemo } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { generateInitials, getAvatarColor } from '@/lib/avatar-utils';
import { useAvatarUrl } from '@/hooks/useAvatarUrl';

interface OptimizedAvatarProps {
  firstName?: string;
  lastName?: string;
  email?: string;
  size?: number;
  className?: string;
  alt?: string;
  src?: string; // Allow custom src override
}

export function OptimizedAvatar({
  firstName,
  lastName,
  email,
  size = 40,
  className,
  alt,
  src: customSrc
}: OptimizedAvatarProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Memoize the avatar URL to prevent unnecessary re-renders
  const avatarUrl = useAvatarUrl(firstName, lastName, email, { size });
  
  // Use custom src if provided, otherwise use generated URL
  const finalSrc = customSrc || avatarUrl;

  // Memoize initials and color to prevent recalculation
  const initials = useMemo(() => 
    generateInitials(firstName, lastName), 
    [firstName, lastName]
  );
  
  const seed = useMemo(() => 
    `${firstName || ''}${lastName || ''}`.replace(/[^a-zA-Z0-9]/g, '') || email?.split('@')[0] || 'default',
    [firstName, lastName, email]
  );
  
  const backgroundColor = useMemo(() => 
    getAvatarColor(seed), 
    [seed]
  );

  const handleImageLoad = () => {
    setIsLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setImageError(true);
  };

  const shouldShowFallback = !finalSrc || imageError;

  return (
    <Avatar 
      className={className}
      style={{ 
        width: size, 
        height: size,
        backgroundColor: shouldShowFallback ? backgroundColor : undefined 
      }}
    >
      {!shouldShowFallback && (
        <AvatarImage
          src={finalSrc}
          alt={alt || `${firstName} ${lastName}`.trim() || 'User avatar'}
          onLoad={handleImageLoad}
          onError={handleImageError}
          style={{ opacity: isLoading ? 0 : 1 }}
        />
      )}
      <AvatarFallback 
        style={{ 
          backgroundColor,
          color: 'white',
          fontSize: Math.max(size * 0.4, 12),
          fontWeight: 'bold'
        }}
      >
        {initials || '?'}
      </AvatarFallback>
    </Avatar>
  );
}
