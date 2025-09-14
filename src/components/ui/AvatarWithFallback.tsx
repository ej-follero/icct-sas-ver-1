'use client';

import React, { useState } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { generateInitials, getAvatarColor } from '@/lib/avatar-utils';

interface AvatarWithFallbackProps {
  src?: string;
  alt?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  size?: number;
  className?: string;
}

export function AvatarWithFallback({
  src,
  alt,
  firstName,
  lastName,
  email,
  size = 40,
  className
}: AvatarWithFallbackProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const initials = generateInitials(firstName, lastName);
  const seed = `${firstName || ''}${lastName || ''}`.replace(/[^a-zA-Z0-9]/g, '') || email?.split('@')[0] || 'default';
  const backgroundColor = getAvatarColor(seed);

  const handleImageLoad = () => {
    setIsLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setImageError(true);
  };

  const shouldShowFallback = !src || imageError;

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
          src={src}
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
