// src/ai/client.js
/**
 * Central AI client with fallback between multiple providers.
 * Includes conversation memory and vision support.
 */
import axios from 'axios';
import { cache } from '../../utils/cache.js';

// Helper to format messages for context
function formatHistory(history) {
  if (!history || history.length === 0) return '';
  return history.map(msg => `${msg.role === 'user' ? 'Usuario' : 'Asistente'}: ${msg.content}`).join('\n') + '\n\n';
}

const providers = [
  {
    name: 'Ryzen (Gemini Pro)',
    url: () => 'https://api.ryzendesu.vip/api/ai/gemini-pro',
    method: 'GET',
    buildPayload: ({ content, prompt, historyStr }) => {
        const fullContent = `${prompt}\n\nHistorial:\n${historyStr}Usuario: ${content}`;
        return `?text=${encodeURIComponent(fullContent)}`;
    },
    parseResponse: (data) => typeof data === 'string' ? data : (data?.response || data?.result || data?.message || data?.data)
  },
  {
    name: 'Siputzx (Gemini)',
    url: () => 'https://api.siputzx.my.id/api/ai/gemini',
    method: 'GET',
    buildPayload: ({ content, prompt, historyStr }) => {
        const fullContent = `${prompt}\n\nHistorial:\n${historyStr}Usuario: ${content}`;
        return `?text=${encodeURIComponent(fullContent)}`;
    },
    parseResponse: (data) => typeof data === 'string' ? data : (data?.data || data?.result || data?.message)
  },
  {
    name: 'Siputzx (GPT-4)',
    url: () => 'https://api.siputzx.my.id/api/ai/gpt4',
    method: 'GET',
    buildPayload: ({ content, prompt, historyStr }) => {
        const fullContent = `${prompt}\n\nHistorial:\n${historyStr}Usuario: ${content}`;
        return `?text=${encodeURIComponent(fullContent)}`;
    },
    parseResponse: (data) => typeof data === 'string' ? data : (data?.data || data?.result || data?.message)
  },
  {
    name: 'Stellar (GPTPrompt)',
    url: () => global?.APIs?.stellar?.url ? `${global.APIs.stellar.url}/ai/gptprompt` : 'https://api.yuki-wabot.my.id/ai/gptprompt',
    method: 'GET',
    buildPayload: ({ content, prompt }) => {
        return `?text=${encodeURIComponent(content)}&prompt=${encodeURIComponent(prompt)}&key=${global?.APIs?.stellar?.key || 'YukiBot-MD'}`;
    },
    parseResponse: (data) => typeof data === 'string' ? data : (data?.result || data?.response || data?.message)
  }
];

const visionProviders = [
  {
    name: 'Delirius (Gemini Vision)',
    url: () => global?.APIs?.delirius?.url ? `${global.APIs.delirius.url}/ia/geminivision` : 'https://api.delirius.store/ia/geminivision',
    method: 'GET',
    buildPayload: ({ prompt, imageUrl }) => `?text=${encodeURIComponent(prompt)}&url=${encodeURIComponent(imageUrl)}`,
    parseResponse: (data) => data?.data || data?.result || data?.message
  }
];

const DEFAULT_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*'
};

function isInvalidResponse(result) {
    if (!result || typeof result !== 'string') return true;
    const lower = result.toLowerCase().trim();
    if (lower.length === 0) return true;
    
    // Prevent HTML challenges (like Cloudflare or FingerprintJS) from being sent as responses
    if (lower.includes('<!doctype html>') || lower.includes('<html') || lower.includes('fingerprintjs')) return true;
    
    const badKeywords = [
        'parametros incompletos',
        'parámetros incompletos',
        'endpoint invalid',
        'api key error',
        'server error',
        'internal server error',
        'key no registrada',
        'invalid key',
        'not found',
        'missing query',
        'apikey invalid'
    ];
    
    for (const keyword of badKeywords) {
        if (lower.includes(keyword)) return true;
    }
    return false;
}

async function callProvider(provider, payload) {
  const targetUrl = typeof provider.url === 'function' ? provider.url() : provider.url;
  if (!targetUrl) throw new Error('Proveedor no configurado');
  
  let headers = { ...DEFAULT_HEADERS };
  if (provider.getHeaders) {
      const customHeaders = provider.getHeaders();
      if (!customHeaders) throw new Error('Credenciales no configuradas para este proveedor');
      headers = { ...headers, ...customHeaders };
  }

  if (provider.method === 'POST') {
    const response = await axios.post(targetUrl, payload, { timeout: 20000, headers });
    return provider.parseResponse(response.data);
  } else {
    const finalUrl = `${targetUrl}${payload}`;
    const response = await axios.get(finalUrl, { timeout: 20000, headers });
    return provider.parseResponse(response.data);
  }
}

/**
 * Get AI text response using the first provider that succeeds.
 */
export async function getAIResponse({ content, prompt, user, memory = true }) {
  const cacheKey = `ai_history_${user}`;
  let history = memory ? (cache.get(cacheKey) || []) : [];
  
  const historyStr = formatHistory(history);

  for (const provider of providers) {
    try {
      const payload = provider.buildPayload({ content, prompt, historyStr, history });
      const result = await callProvider(provider, payload);
      
      if (!isInvalidResponse(result)) {
        if (memory) {
          history.push({ role: 'user', content: content });
          history.push({ role: 'assistant', content: result });
          if (history.length > 10) history = history.slice(history.length - 10);
          cache.set(cacheKey, history, 30 * 60 * 1000); 
        }
        return result.trim();
      } else {
        console.warn(`[AI Text] Proveedor ${provider.name} retornó falso positivo: ${result}`);
      }
    } catch (err) {
      console.warn(`[AI Text] Proveedor ${provider.name} falló:`, err.response?.data || err.message || err);
    }
  }
  throw new Error('Todos los proveedores de Inteligencia Artificial están saturados o no disponibles. Inténtalo más tarde.');
}

/**
 * Get AI vision response using the first provider that succeeds.
 */
export async function getVisionResponse({ prompt, imageUrl }) {
  for (const provider of visionProviders) {
    try {
      const payload = provider.buildPayload({ prompt, imageUrl });
      const result = await callProvider(provider, payload);
      
      if (!isInvalidResponse(result)) {
        return result.trim();
      } else {
        console.warn(`[AI Vision] Proveedor ${provider.name} retornó falso positivo: ${result}`);
      }
    } catch (err) {
      console.warn(`[AI Vision] Proveedor ${provider.name} falló:`, err.response?.data || err.message || err);
    }
  }
  throw new Error('Todos los proveedores de Visión IA están saturados o no disponibles. Inténtalo más tarde.');
}
