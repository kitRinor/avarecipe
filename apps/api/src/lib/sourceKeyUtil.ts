/**
 * Extracts a unique Source ID from a store URL.
 * Format: "service:id" (e.g., "booth:123456")
 */
export const generateSourceKey = (urlStr: string | null): string | null => {
  try {
    if (!urlStr) return null;
    const url = new URL(urlStr);
    const hostname = url.hostname;
    const pathname = url.pathname;

    // 1. BOOTH (booth.pm)
    // Pattern: https://*.booth.pm/items/{id}
    if (hostname.includes('booth.pm')) {
      const match = pathname.match(/\/items\/(\d+)/);
      if (match) return `booth:${match[1]}`;
    }

    // 2. Vket Store (store.vket.com)
    // Pattern: https://store.vket.com/ec/items/{id}/detail
    // Pattern: https://store.vket.com/ec/items/{id}
    if (hostname === 'store.vket.com') {
      const match = pathname.match(/\/items\/(\d+)/);
      if (match) return `vket:${match[1]}`;
    }

    // 3. Gumroad (gumroad.com)
    // Pattern: https://{user}.gumroad.com/l/{slug}
    // Pattern: https://gumroad.com/l/{slug}
    if (hostname.includes('gumroad.com')) {
      const match = pathname.match(/\/l\/([^/]+)/);
      if (match) return `gumroad:${match[1]}`;
    }

    // 4. Unity Asset Store (assetstore.unity.com)
    // Pattern: https://assetstore.unity.com/packages/.../{slug}-{id}
    // The ID is the numeric part at the very end of the path
    if (hostname === 'assetstore.unity.com') {
      const match = pathname.match(/-(\d+)$/);
      if (match) return `unity:${match[1]}`;
    }

    // 5. Jinxxy (jinxxy.com)
    // Pattern: https://jinxxy.com/{user}/{product_slug}
    // Jinxxy uses "user/product" as a unique identifier
    if (hostname === 'jinxxy.com') {
      // Exclude system paths like /market, /dashboard if necessary
      const parts = pathname.split('/').filter(p => p);
      if (parts.length >= 2) {
        const user = parts[0];
        const product = parts[1];
        // Basic check to avoid system pages
        if (!['market', 'dashboard', 'settings'].includes(user)) {
            return `jinxxy:${user}/${product}`;
        }
      }
    }

    return null;
  } catch (e) {
    // Invalid URL
    return null;
  }
};