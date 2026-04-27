// src/ai/client.js
/**
 * Central AI client with fallback between multiple providers.
 * Supported providers (in order): Gemini, Claude, GPT‑OSS.
 * Each provider is called via a simple HTTP POST that returns `{ result: "..." }`.
 * The function abstracts the call so commands only need to provide the content,
 * the prompt and the user identifier.
 */
import axios from 'axios';
import { cache } from '../../utils/cache.js';

// Proveedores reales y gratuitos
const providers = [
  {
    name: 'Siputzx (Blackbox AI)',
    url: 'https://ai.siputzx.my.id',
    method: 'POST',
    buildPayload: ({ content, prompt, user }) => ({
      content: content,
      user: user || 'user',
      prompt: prompt,
      webSearchMode: true
    }),
    parseResponse: (data) => data?.result
  },
  {
    name: 'Stellar Gemini (Fallback)',
    url: global?.APIs?.stellar?.url ? `${global.APIs.stellar.url}/ai/gemini` : null,
    method: 'GET',
    buildPayload: ({ content, prompt }) => `?text=${encodeURIComponent(content)}&prompt=${encodeURIComponent(prompt)}&key=${global?.APIs?.stellar?.key || ''}`,
    parseResponse: (data) => data?.response || data?.result?.text || data?.result
  },
  {
    name: 'Ryzen GPT (Fallback)',
    url: 'https://api.ryzendesu.vip/api/ai/chatgpt',
    method: 'GET',
    buildPayload: ({ content, prompt }) => `?text=${encodeURIComponent(content)}&prompt=${encodeURIComponent(prompt)}`,
    parseResponse: (data) => data?.response || data?.result
  },
  {
    name: 'Stacktoy Mistral (Fallback)',
    url: 'https://mistral.stacktoy.workers.dev/',
    method: 'GET',
    buildPayload: ({ content }) => `?apikey=Suhail&text=${encodeURIComponent(content)}`,
    parseResponse: (data) => data?.result
  },
  {
    name: 'GTech Llama (Fallback)',
    url: 'https://llama.gtech-apiz.workers.dev/',
    method: 'GET',
    buildPayload: ({ content }) => `?apikey=Suhail&text=${encodeURIComponent(content)}`,
    parseResponse: (data) => data?.result
  },
  {
    name: 'GTech Mistral (Fallback)',
    url: 'https://mistral.gtech-apiz.workers.dev/',
    method: 'GET',
    buildPayload: ({ content }) => `?apikey=Suhail&text=${encodeURIComponent(content)}`,
    parseResponse: (data) => data?.result
  }
];

async function callProvider(provider, payload) {
  if (!provider.url) throw new Error('Proveedor no configurado');
  
  if (provider.method === 'POST') {
    const response = await axios.post(provider.url, payload, { timeout: 20000 });
    return provider.parseResponse(response.data);
  } else {
    // Para GET, payload es el query string
    const response = await axios.get(`${provider.url}${payload}`, { timeout: 20000 });
    return provider.parseResponse(response.data);
  }
}

/**
 * Get AI response using the first provider that succeeds.
 * @param {Object} params - { content: string, prompt: string, user: string }
 * @returns {Promise<string>} The generated text.
 * @throws {Error} If all providers fail to generate a response.
 */
export async function getAIResponse({ content, prompt, user }) {
  for (const provider of providers) {
    try {
      const payload = provider.buildPayload({ content, prompt, user });
      const result = await callProvider(provider, payload);
      if (typeof result === 'string' && result.trim().length > 0) {
        return result;
      }
    } catch (err) {
      // Log the failure and continue with the next provider.
      console.warn(`AI provider ${provider.name} failed:`, err.message || err);
    }
  }
  throw new Error('All AI providers failed to generate a response');
}
