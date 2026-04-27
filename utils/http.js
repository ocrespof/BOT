// utils/http.js
// Centralised HTTP utility to avoid repetitive imports of node-fetch and axios.
// Provides thin wrappers that return the underlying libraries' promises.
// Usage: import { httpGet, httpPost, httpAxios } from '../../utils/http.js';

import fetch from 'node-fetch';
import axios from 'axios';

/**
 * Simple GET wrapper using node-fetch.
 * @param {string} url - Target URL.
 * @param {object} [options] - Fetch options.
 * @returns {Promise<any>} - Resolved JSON or text response.
 */
export async function httpGet(url, options = {}) {
  const response = await fetch(url, { method: 'GET', ...options });
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) return response.json();
  return response.text();
}

/**
 * Simple POST wrapper using node-fetch.
 * @param {string} url - Target URL.
 * @param {any} body - Body payload.
 * @param {object} [options] - Additional fetch options.
 * @returns {Promise<any>} - Resolved JSON or text response.
 */
export async function httpPost(url, body, options = {}) {
  const response = await fetch(url, {
    method: 'POST',
    body: typeof body === 'string' ? body : JSON.stringify(body),
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) return response.json();
  return response.text();
}

/**
 * Export the raw axios instance for cases where advanced config is required.
 */
export const httpAxios = axios;
