// utils/cache.js
/**
 * Simple in‑memory cache with TTL (time‑to‑live).
 * Stores any serialisable value and expires entries after the configured duration.
 * Suitable for low‑memory environments like Termux.
 */
class Cache {
  constructor() {
    this.store = new Map(); // key -> { value, expiresAt }
  }

  /**
   * Generate a cache key from arbitrary arguments.
   * @param {...any} parts
   * @returns {string}
   */
  static key(...parts) {
    return parts.map(p => typeof p === 'object' ? JSON.stringify(p) : String(p)).join('|');
  }

  /**
   * Retrieve a cached value if it exists and hasn't expired.
   * @param {string} key
   * @returns {any|undefined}
   */
  get(key) {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  /**
   * Store a value with a TTL (in milliseconds).
   * @param {string} key
   * @param {any} value
   * @param {number} ttlMs
   */
  set(key, value, ttlMs = 5 * 60 * 1000) { // default 5 minutes
    const expiresAt = Date.now() + ttlMs;
    this.store.set(key, { value, expiresAt });
  }

  /**
   * Clear the entire cache – useful for debugging.
   */
  clear() {
    this.store.clear();
  }
}

// Export a singleton instance so all modules share the same cache.
export const cache = new Cache();
