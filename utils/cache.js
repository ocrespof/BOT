// utils/cache.js
/**
 * In-memory cache using node-cache.
 * Automatically clears expired entries via checkperiod, preventing memory leaks.
 */
import NodeCache from 'node-cache';

class Cache {
  constructor() {
    // stdTTL is 300 seconds (5 minutes)
    // checkperiod is 60 seconds (checks for expired data every minute)
    this.store = new NodeCache({ stdTTL: 300, checkperiod: 60, useClones: false });
  }

  /**
   * Generate a cache key from arbitrary arguments.
   */
  static key(...parts) {
    return parts.map(p => typeof p === 'object' ? JSON.stringify(p) : String(p)).join('|');
  }

  /**
   * Retrieve a cached value if it exists and hasn't expired.
   */
  get(key) {
    return this.store.get(key);
  }

  /**
   * Store a value with a TTL (in milliseconds).
   */
  set(key, value, ttlMs = 5 * 60 * 1000) { 
    const ttlSeconds = Math.ceil(ttlMs / 1000);
    this.store.set(key, value, ttlSeconds);
  }

  /**
   * Clear the entire cache.
   */
  clear() {
    this.store.flushAll();
  }
}

export const cache = new Cache();
