// @ts-nocheck
// PGC Tour PWA Service Worker
const CACHE_NAME = "pgc-tour-v1";
const STATIC_CACHE_NAME = "pgc-tour-static-v1";
const DYNAMIC_CACHE_NAME = "pgc-tour-dynamic-v1";

// Files to cache immediately (static assets)
const STATIC_ASSETS = [
  "/",
  "/favicon.ico",
  "/logo192.png",
  "/logo512.png",
  "/manifest.json",
  "/_next/static/css/app/layout.css",
  // Add other critical static assets
];

// API routes to cache with different strategies
const API_ROUTES = [
  "/api/tournament",
  "/api/standings",
  "/api/history",
  "/api/players",
];

// Install event - cache static assets
self.addEventListener("install", (event) => {
  console.log("[SW] Installing...");

  event.waitUntil(
    caches
      .open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log("[SW] Caching static assets");
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log("[SW] Static assets cached");
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error("[SW] Failed to cache static assets:", error);
      }),
  );
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("[SW] Activating...");

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Delete old caches
            if (
              cacheName !== STATIC_CACHE_NAME &&
              cacheName !== DYNAMIC_CACHE_NAME &&
              cacheName !== CACHE_NAME
            ) {
              console.log("[SW] Deleting old cache:", cacheName);
              return caches.delete(cacheName);
            }
          }),
        );
      })
      .then(() => {
        console.log("[SW] Cache cleanup complete");
        return self.clients.claim();
      }),
  );
});

// Fetch event - implement caching strategies
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") {
    return;
  }

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith("http")) {
    return;
  }

  event.respondWith(handleFetch(request));
});

async function handleFetch(request) {
  const url = new URL(request.url);

  try {
    // Strategy 1: Static assets - Cache First
    if (isStaticAsset(url.pathname)) {
      return await cacheFirstStrategy(request, STATIC_CACHE_NAME);
    }

    // Strategy 2: API calls - Network First with fallback
    if (isApiCall(url.pathname)) {
      return await networkFirstStrategy(request, DYNAMIC_CACHE_NAME);
    }

    // Strategy 3: Tournament/live data - Network First (fresh data priority)
    if (isLiveData(url.pathname)) {
      return await networkFirstStrategy(request, DYNAMIC_CACHE_NAME, 5000); // 5s timeout
    }

    // Strategy 4: Images and media - Cache First
    if (isMedia(request)) {
      return await cacheFirstStrategy(request, DYNAMIC_CACHE_NAME);
    }

    // Strategy 5: Pages - Stale While Revalidate
    if (isPageRequest(url.pathname)) {
      // For tournament pages, try network first with extended timeout
      if (url.pathname.includes("/tournament/")) {
        return await networkFirstStrategy(request, DYNAMIC_CACHE_NAME, 30000); // 30s timeout
      }
      return await staleWhileRevalidateStrategy(request, DYNAMIC_CACHE_NAME);
    }

    // Default: Network only
    return await fetch(request);
  } catch (error) {
    console.error("[SW] Fetch failed:", error);

    // Never show offline fallback for document requests - let the app handle it
    // The app has its own loading states and error handling
    if (request.destination === "document") {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      const cachedResponse = await cache.match(request);
      
      // Return cached version if available, otherwise let the network error propagate
      if (cachedResponse) {
        console.log("[SW] Returning cached version instead of offline page");
        return cachedResponse;
      }
    }

    throw error;
  }
}

// Cache First Strategy - for static assets
async function cacheFirstStrategy(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    console.log("[SW] Cache hit:", request.url);
    return cachedResponse;
  }

  console.log("[SW] Cache miss, fetching:", request.url);
  const networkResponse = await fetch(request);

  if (networkResponse.ok) {
    cache.put(request, networkResponse.clone());
  }

  return networkResponse;
}

// Network First Strategy - for API calls and live data
async function networkFirstStrategy(request, cacheName, timeout = 30000) {
  const cache = await caches.open(cacheName);

  try {
    // Try network first with extended timeout
    const networkResponse = await Promise.race([
      fetch(request),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Network timeout")), timeout),
      ),
    ]);

    if (networkResponse.ok) {
      console.log("[SW] Network success:", request.url);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }

    throw new Error("Network response not ok");
  } catch (error) {
    console.log("[SW] Network failed, trying cache:", request.url);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      console.log("[SW] Cache fallback:", request.url);
      return cachedResponse;
    }

    // Don't throw error for API calls - let the app handle the failure
    console.log("[SW] No cache available for:", request.url);
    throw error;
  }
}

// Stale While Revalidate Strategy - for pages
async function staleWhileRevalidateStrategy(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
        console.log("[SW] Updated cache from network:", request.url);
      }
      return networkResponse;
    })
    .catch((error) => {
      console.log("[SW] Network update failed:", error);
      return null; // Return null instead of throwing
    });

  // Return cached version immediately if available
  if (cachedResponse) {
    console.log("[SW] Serving stale cache:", request.url);
    // Update in background (don't await)
    fetchPromise;
    return cachedResponse;
  }

  // No cache, wait for network with extended timeout
  console.log("[SW] No cache, waiting for network:", request.url);
  try {
    const networkResponse = await Promise.race([
      fetchPromise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Network timeout")), 20000), // Increased to 20s
      ),
    ]);

    if (networkResponse && networkResponse.ok) {
      return networkResponse;
    }
    throw new Error("Network response not ok");
  } catch (error) {
    console.log(
      "[SW] Network failed, checking for any cached version:",
      request.url,
    );

    // Try to find any cached version of this page (even if URL params differ)
    const allCacheKeys = await cache.keys();
    const url = new URL(request.url);

    // Look for cached versions of the same path
    for (const cachedRequest of allCacheKeys) {
      const cachedUrl = new URL(cachedRequest.url);
      if (cachedUrl.pathname === url.pathname) {
        const response = await cache.match(cachedRequest);
        if (response) {
          console.log("[SW] Found similar cached page:", cachedRequest.url);
          return response;
        }
      }
    }

    // Still no cache found - let the app handle this instead of showing offline page
    console.log("[SW] No cached version found, letting app handle:", request.url);
    throw error;
  }
}

// Message handling for cache invalidation
self.addEventListener("message", (event) => {
  console.log("[SW] Message received:", event.data);

  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }

  if (event.data && event.data.type === "FORCE_UPDATE") {
    console.log("[SW] Forcing cache update for pages");
    // Clear page cache to force fresh requests
    caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
      cache.keys().then((requests) => {
        requests.forEach((request) => {
          const url = new URL(request.url);
          if (isPageRequest(url.pathname)) {
            console.log("[SW] Clearing cached page:", request.url);
            cache.delete(request);
          }
        });
      });
    });
  }
});

// Helper functions to determine request types
function isStaticAsset(pathname) {
  return (
    pathname.startsWith("/_next/static/") ||
    pathname.endsWith(".css") ||
    pathname.endsWith(".js") ||
    pathname.endsWith(".ico") ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".jpg") ||
    pathname.endsWith(".svg") ||
    pathname.endsWith(".woff") ||
    pathname.endsWith(".woff2")
  );
}

function isApiCall(pathname) {
  return pathname.startsWith("/api/") || pathname.startsWith("/trpc/");
}

function isLiveData(pathname) {
  return (
    pathname.includes("/tournament") ||
    pathname.includes("/leaderboard") ||
    pathname.includes("/live") ||
    pathname.includes("/scores")
  );
}

function isMedia(request) {
  return (
    request.destination === "image" ||
    request.destination === "video" ||
    request.destination === "audio"
  );
}

function isPageRequest(pathname) {
  // Don't cache API routes, static files, etc.
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.includes(".")
  ) {
    return false;
  }

  // Cache actual page routes
  return (
    pathname.startsWith("/standings") ||
    pathname.startsWith("/tournament") ||
    pathname === "/" ||
    pathname.startsWith("/player") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/rulebook") ||
    pathname.startsWith("/signin")
  );
}

// Offline fallback page
async function getOfflineFallback() {
  const cache = await caches.open(STATIC_CACHE_NAME);

  // Try to return cached homepage
  const cachedHome = await cache.match("/");
  if (cachedHome) {
    return cachedHome;
  }

  // Return a simple offline message
  return new Response(
    `
    <!DOCTYPE html>
    <html>
      <head>
        <title>PGC Tour - Offline</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            background: #f3f4f6;
            text-align: center;
            padding: 20px;
          }
          .container {
            max-width: 400px;
            background: white;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          }
          h1 { color: #374151; margin-bottom: 16px; }
          p { color: #6b7280; line-height: 1.5; }
          .icon { font-size: 48px; margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon">⛳</div>
          <h1>You're Offline</h1>
          <p>PGC Tour is not available right now. Please check your internet connection and try again.</p>
          <p>Some previously viewed content may still be available.</p>
        </div>
      </body>
    </html>
  `,
    {
      headers: {
        "Content-Type": "text/html",
      },
    },
  );
}

// Background sync for when connectivity is restored
self.addEventListener("sync", (event) => {
  console.log("[SW] Background sync triggered:", event.tag);

  if (event.tag === "background-sync") {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  console.log("[SW] Performing background sync...");

  try {
    // Sync critical data when back online
    const cache = await caches.open(DYNAMIC_CACHE_NAME);

    // Pre-fetch important routes
    const importantRoutes = [
      "/api/tournament/current",
      "/api/standings",
      "/tournament",
      "/standings",
    ];

    for (const route of importantRoutes) {
      try {
        const response = await fetch(route);
        if (response.ok) {
          await cache.put(route, response);
          console.log("[SW] Background sync cached:", route);
        }
      } catch (error) {
        console.log("[SW] Background sync failed for:", route, error);
      }
    }
  } catch (error) {
    console.error("[SW] Background sync error:", error);
  }
}

// Push notifications
self.addEventListener("push", (event) => {
  console.log("[SW] Push received:", event);

  const options = {
    body: "Tournament update available!",
    icon: "/logo192.png",
    badge: "/logo192.png",
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      {
        action: "explore",
        title: "View Tournament",
        icon: "/logo192.png",
      },
      {
        action: "close",
        title: "Close",
        icon: "/logo192.png",
      },
    ],
  };

  if (event.data) {
    const data = event.data.json();
    options.body = data.body || options.body;
    options.title = data.title || "PGC Tour";
  }

  event.waitUntil(self.registration.showNotification("PGC Tour", options));
});

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  console.log("[SW] Notification click received:", event);

  event.notification.close();

  if (event.action === "explore") {
    event.waitUntil(clients.openWindow("/tournament"));
  } else if (event.action === "close") {
    // Just close the notification
  } else {
    // Default action - open the app
    event.waitUntil(clients.openWindow("/"));
  }
});

console.log("[SW] Service Worker registered successfully");
