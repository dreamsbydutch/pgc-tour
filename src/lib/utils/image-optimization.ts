/**
 * Image optimization utilities for the PGC Tour application
 * Handles image URL optimization, caching, and performance improvements
 */

// Common image URLs that are used frequently - can be preloaded
export const COMMON_IMAGES = {
  PGC_LOGO: "/logo512.png",
  RBC_CANADIAN_OPEN:
    "https://jn9n1jxo7g.ufs.sh/f/3f3580a5-8a7f-4bc3-a16c-53188869acb2-x8pl2f.png",
  TOUR_CHAMPIONSHIP:
    "https://jn9n1jxo7g.ufs.sh/f/94GU8p0EVxqPNsO8w6FZhY1BamONzvl3bLgdn0IXVM8fEoTC",
} as const;

/**
 * Optimizes external image URLs for better performance
 * Adds optimization parameters where supported
 */
export function optimizeImageUrl(
  url: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: "webp" | "avif" | "auto";
  } = {},
): string {
  if (!url) return "";

  // If it's a local image, return as-is
  if (url.startsWith("/") || url.startsWith("./")) {
    return url;
  }

  // For external URLs, try to add optimization parameters
  try {
    const urlObj = new URL(url);

    // Handle different CDN providers
    if (urlObj.hostname.includes("googleusercontent.com")) {
      // Google User Content (avatars)
      if (options.width) {
        urlObj.searchParams.set("s", options.width.toString());
      }
      return urlObj.toString();
    }

    if (
      urlObj.hostname.includes("utfs.io") ||
      urlObj.hostname.includes("jn9n1jxo7g.ufs.sh")
    ) {
      // UploadThing or similar services - add optimization params if supported
      if (options.width) {
        urlObj.searchParams.set("w", options.width.toString());
      }
      if (options.height) {
        urlObj.searchParams.set("h", options.height.toString());
      }
      if (options.quality) {
        urlObj.searchParams.set("q", options.quality.toString());
      }
      if (options.format && options.format !== "auto") {
        urlObj.searchParams.set("f", options.format);
      }
      return urlObj.toString();
    }

    // For other URLs, return as-is
    return url;
  } catch {
    // If URL parsing fails, return original
    return url;
  }
}

/**
 * Gets the appropriate image size based on display context
 */
export function getOptimalImageSize(
  context:
    | "avatar"
    | "tournament-logo"
    | "tour-logo"
    | "achievement"
    | "header-logo",
) {
  const sizes = {
    avatar: {
      small: { width: 24, height: 24 },
      medium: { width: 36, height: 36 },
      large: { width: 48, height: 48 },
    },
    "tournament-logo": {
      small: { width: 64, height: 64 },
      medium: { width: 96, height: 96 },
      large: { width: 128, height: 128 },
      xl: { width: 150, height: 150 },
    },
    "tour-logo": {
      small: { width: 24, height: 24 },
      medium: { width: 32, height: 32 },
      large: { width: 48, height: 48 },
    },
    achievement: {
      small: { width: 16, height: 16 },
      medium: { width: 20, height: 20 },
      large: { width: 24, height: 24 },
    },
    "header-logo": {
      small: { width: 80, height: 80 },
      medium: { width: 96, height: 96 },
      large: { width: 128, height: 128 },
    },
  };

  return sizes[context];
}

/**
 * Generates responsive sizes attribute for images based on context
 */
export function getResponsiveSizes(
  context:
    | "avatar"
    | "tournament-logo"
    | "tour-logo"
    | "achievement"
    | "header-logo",
): string {
  const sizesMap = {
    avatar: "(max-width: 768px) 24px, 36px",
    "tournament-logo":
      "(max-width: 768px) 64px, (max-width: 1200px) 96px, 128px",
    "tour-logo": "(max-width: 768px) 24px, 32px",
    achievement: "20px",
    "header-logo": "(max-width: 768px) 80px, 96px",
  };

  return sizesMap[context];
}

/**
 * Preloads critical images that are likely to be needed
 */
export function preloadCriticalImages() {
  if (typeof window === "undefined") return;

  const criticalImages = [
    COMMON_IMAGES.PGC_LOGO,
    // Add other critical images that appear above the fold
  ];

  criticalImages.forEach((src) => {
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    link.href = src;
    document.head.appendChild(link);
  });
}

/**
 * Creates a blur data URL for placeholder
 */
export function createBlurDataURL(
  width: number = 10,
  height: number = 10,
): string {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  // Create a simple gradient blur effect
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#f3f4f6");
  gradient.addColorStop(1, "#e5e7eb");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  return canvas.toDataURL();
}

/**
 * Image loading priority helper
 */
export function shouldPrioritizeImage(
  context: "hero" | "above-fold" | "below-fold",
): boolean {
  return context === "hero" || context === "above-fold";
}

/**
 * Gets tournament-specific image optimizations
 */
export function getTournamentImageUrl(
  tournamentName: string,
  logoUrl?: string,
): string {
  // Handle special tournament cases with optimized URLs
  switch (tournamentName) {
    case "RBC Canadian Open":
      return COMMON_IMAGES.RBC_CANADIAN_OPEN;
    case "TOUR Championship":
      return COMMON_IMAGES.TOUR_CHAMPIONSHIP;
    default:
      return logoUrl || "";
  }
}
