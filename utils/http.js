// utils/http.js
// Centralised HTTP utility to avoid repetitive imports of node-fetch and axios.
// Provides thin wrappers that return the underlying libraries' promises.
// Usage: import { httpGet, httpPost, httpAxios } from '../../utils/http.js';

import axios from 'axios';

/**
 * Simple GET wrapper using axios.
 * @param {string} url - Target URL.
 * @param {object} [options] - Axios request config.
 * @returns {Promise<any>} - Resolved response data.
 */
export async function httpGet(url, options = {}) {
  const response = await axios.get(url, options);
  return response.data;
}

/**
 * Simple POST wrapper using axios.
 * @param {string} url - Target URL.
 * @param {any} body - Body payload.
 * @param {object} [options] - Additional axios request config.
 * @returns {Promise<any>} - Resolved response data.
 */
export async function httpPost(url, body, options = {}) {
  const response = await axios.post(url, body, options);
  return response.data;
}

/**
 * Export the raw axios instance for cases where advanced config is required.
 */
export const httpAxios = axios;
