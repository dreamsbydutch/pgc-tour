"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/src/lib/utils";

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  placeholder?: "blur" | "empty";
  sizes?: string;
  fill?: boolean;
  quality?: number;
  onLoad?: () => void;
  onError?: () => void;
  objectFit?: "contain" | "cover" | "fill" | "none" | "scale-down";
}

/**
 * OptimizedImage Component
 *
 * A wrapper around Next.js Image component with optimized defaults for the PGC Tour app.
 * Provides consistent image optimization, error handling, and loading states.
 *
 * Features:
 * - Automatic WebP/AVIF format conversion
 * - Proper sizing and responsive behavior
 * - Error handling with fallback
 * - Loading states
 * - Optimized caching
 */
export function OptimizedImage({
  src,
  alt,
  width = 64,
  height = 64,
  className,
  priority = false,
  placeholder = "empty",
  sizes,
  fill = false,
  quality = 85,
  onLoad,
  onError,
  objectFit = "contain",
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Handle image load
  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  // Handle image error
  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    onError?.();
  };

  // Generate responsive sizes if not provided
  const responsiveSizes =
    sizes ??
    (fill
      ? "100vw"
      : width && width <= 64
        ? "(max-width: 768px) 32px, 64px"
        : width && width <= 128
          ? "(max-width: 768px) 64px, 128px"
          : "(max-width: 768px) 128px, 256px");

  // Error fallback
  if (hasError) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-gray-200 text-xs text-gray-400",
          fill ? "absolute inset-0" : "",
          className,
        )}
        style={!fill ? { width, height } : undefined}
      >
        <span>No Image</span>
      </div>
    );
  }
  return (
    <div className={cn("relative", fill ? "h-full w-full" : "")}>
      {/* Loading skeleton */}
      {isLoading && (
        <div
          className={cn(
            "animate-pulse rounded-full bg-slate-200",
            !fill ? "" : "h-full w-full",
          )}
          style={!fill ? { width, height } : undefined}
        />
      )}
      <Image
        src={src}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        fill={fill}
        priority={priority}
        placeholder={placeholder}
        sizes={responsiveSizes}
        quality={quality}
        className={cn(
          "transition-opacity duration-300",
          isLoading ? "opacity-0" : "opacity-100",
          className,
        )}
        onLoad={handleLoad}
        onError={handleError}
        // Optimize loading
        loading={priority ? "eager" : "lazy"}
        // Maintain aspect ratio
        style={{
          objectFit: fill ? objectFit : undefined,
          width: fill ? "100%" : "auto",
          height: fill ? "100%" : "auto",
          maxWidth: fill ? "100%" : width,
          maxHeight: fill ? "100%" : height,
        }}
      />
    </div>
  );
}

/**
 * Predefined image component variants for common use cases
 */

// User avatars
export function UserAvatar({
  src,
  alt,
  size = "medium",
  className,
  ...props
}: Omit<OptimizedImageProps, "width" | "height"> & {
  size?: "small" | "medium" | "large";
}) {
  const dimensions = {
    small: { width: 24, height: 24 },
    medium: { width: 36, height: 36 },
    large: { width: 48, height: 48 },
  };

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      {...dimensions[size]}
      className={cn("rounded-full", className)}
      sizes="(max-width: 768px) 24px, 36px"
      objectFit="cover"
      {...props}
    />
  );
}

// Tournament logos
export function TournamentLogo({
  src,
  alt,
  size = "medium",
  className,
  ...props
}: Omit<OptimizedImageProps, "width" | "height"> & {
  size?: "small" | "medium" | "large" | "xl" | "2xl";
}) {
  const dimensions = {
    small: { width: 32, height: 32 },
    medium: { width: 64, height: 64 },
    large: { width: 96, height: 96 },
    xl: { width: 128, height: 128 },
    "2xl": { width: 192, height: 192 },
  };

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      {...dimensions[size]}
      className={className}
      sizes="(max-width: 768px) 96px, 192px"
      quality={90}
      objectFit="contain"
      {...props}
    />
  );
}

// Tour logos
export function TourLogo({
  src,
  alt,
  size = "medium",
  className,
  ...props
}: Omit<OptimizedImageProps, "width" | "height"> & {
  size?: "small" | "medium" | "large";
}) {
  const dimensions = {
    small: { width: 24, height: 24 },
    medium: { width: 32, height: 32 },
    large: { width: 48, height: 48 },
  };

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      {...dimensions[size]}
      className={className}
      sizes="32px"
      objectFit="contain"
      {...props}
    />
  );
}

// Achievement icons (small decorative images)
export function AchievementIcon({
  src,
  alt,
  className,
  ...props
}: Omit<OptimizedImageProps, "width" | "height">) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={20}
      height={20}
      className={className}
      sizes="20px"
      objectFit="contain"
      {...props}
    />
  );
}
