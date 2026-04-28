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
    name: 'Siputzx (Blackbox)',
    url: () => global?.APIs?.siputzx?.url ? `${global.APIs.siputzx.url}/api/ai/blackboxai` : 'https://api.siputzx.my.id/api/ai/blackboxai',
    method: 'GET',
    buildPayload: ({ content, prompt, historyStr }) => {
        const fullContent = `${prompt}\n\nHistorial de la conversación:\n${historyStr}Usuario: ${content}`;
        return `?content=${encodeURIComponent(fullContent)}`;
    },
    parseResponse: (data) => data?.data || data?.result || data?.message
  },
  {
    name: 'Vreden (ChatGPT)',
    url: () => global?.APIs?.vreden?.url ? `${global.APIs.vreden.url}/api/ai/chatgpt` : 'https://api.vreden.web.id/api/ai/chatgpt',
    method: 'GET',
    buildPayload: ({ content, prompt, historyStr }) => {
        const fullContent = `${prompt}\n\nHistorial de la conversación:\n${historyStr}Usuario: ${content}`;
        return `?q=${encodeURIComponent(fullContent)}`;
    },
    parseResponse: (data) => data?.result || data?.data?.message || data?.data || data?.message
  },
  {
    name: 'Stellar (Gemini)',
    url: () => global?.APIs?.stellar?.url ? `${global.APIs.stellar.url}/ai/gemini` : 'https://api.yuki-wabot.my.id/ai/gemini',
    method: 'GET',
    buildPayload: ({ content, prompt, historyStr }) => {
        const fullContent = `${prompt}\n\nHistorial de la conversación:\n${historyStr}Usuario: ${content}`;
        return `?text=${encodeURIComponent(fullContent)}&key=${global?.APIs?.stellar?.key || 'YukiBot-MD'}`;
    },
    parseResponse: (data) => data?.result || data?.response || data?.message
  },
  {
    name: 'Delirius (ChatGPT)',
    url: () => global?.APIs?.delirius?.url ? `${global.APIs.delirius.url}/ia/chatgpt` : 'https://api.delirius.store/ia/chatgpt',
    method: 'GET',
    buildPayload: ({ content, prompt, historyStr }) => {
        const fullContent = `${prompt}\n\nHistorial de la conversación:\n${historyStr}Usuario: ${content}`;
        return `?q=${encodeURIComponent(fullContent)}`;
    },
    parseResponse: (data) => data?.data || data?.result || data?.message
  },
  {
    name: 'Ryzen (ChatGPT)',
    url: () => 'https://api.ryzendesu.vip/api/ai/chatgpt',
    method: 'GET',
    buildPayload: ({ content, prompt, historyStr }) => {
        const fullContent = `Historial:\n${historyStr}Usuario: ${content}`;
        return `?text=${encodeURIComponent(fullContent)}&prompt=${encodeURIComponent(prompt)}`;
    },
    parseResponse: (data) => data?.response || data?.result || data?.message
  }
];

const visionProviders = [
  {
    name: 'Siputzx (Gemini Vision)',
    url: () => global?.APIs?.siputzx?.url ? `${global.APIs.siputzx.url}/api/ai/gemini-image` : 'https://api.siputzx.my.id/api/ai/gemini-image',
    method: 'GET',
    buildPayload: ({ prompt, imageUrl }) => `?prompt=${encodeURIComponent(prompt)}&url=${encodeURIComponent(imageUrl)}`,
    parseResponse: (data) => data?.data || data?.result || data?.message
  },
  {
    name: 'Vreden (Gemini Image)',
    url: () => global?.APIs?.vreden?.url ? `${global.APIs.vreden.url}/api/v1/ai/gemini-image` : 'https://api.vreden.web.id/api/v1/ai/gemini-image',
    method: 'GET',
    buildPayload: ({ prompt, imageUrl }) => `?prompt=${encodeURIComponent(prompt)}&url=${encodeURIComponent(imageUrl)}`,
    parseResponse: (data) => data?.data || data?.result || data?.message
  },
  {
    name: 'Delirius (Gemini Vision)',
    url: () => global?.APIs?.delirius?.url ? `${global.APIs.delirius.url}/ia/geminivision` : 'https://api.delirius.store/ia/geminivision',
    method: 'GET',
    buildPayload: ({ prompt, imageUrl }) => `?text=${encodeURIComponent(prompt)}&url=${encodeURIComponent(imageUrl)}`,
    parseResponse: (data) => data?.data || data?.result || data?.message
  }
];

async function callProvider(provider, payload) {
  const targetUrl = typeof provider.url === 'function' ? provider.url() : provider.url;
  if (!targetUrl) throw new Error('Proveedor no configurado');
  
  if (provider.method === 'POST') {
    const response = await axios.post(targetUrl, payload, { timeout: 20000 });
    return provider.parseResponse(response.data);
  } else {
    const finalUrl = `${targetUrl}${payload}`;
    const response = await axios.get(finalUrl, { timeout: 20000 });
    return provider.parseResponse(response.data);
  }
}

/**
 * Get AI text response using the first provider that succeeds.
 * @param {Object} params - { content: string, prompt: string, user: string }
 * @returns {Promise<string>} The generated text.
 */
export async function getAIResponse({ content, prompt, user }) {
  const cacheKey = `ai_history_${user}`;
  let history = cache.get(cacheKey) || [];
  
  const historyStr = formatHistory(history);

  for (const provider of providers) {
    try {
      const payload = provider.buildPayload({ content, prompt, historyStr });
      const result = await callProvider(provider, payload);
      
      if (typeof result === 'string' && result.trim().length > 0) {
        history.push({ role: 'user', content: content });
        history.push({ role: 'assistant', content: result });
        // Keep only last 10 messages to avoid token bloat
        if (history.length > 10) history = history.slice(history.length - 10);
        cache.set(cacheKey, history, 30 * 60 * 1000); // 30 minutes ttl
        return result;
      }
    } catch (err) {
      console.warn(`[AI Text] Proveedor ${provider.name} falló:`, err.message || err);
    }
  }
  throw new Error('Todos los proveedores de Inteligencia Artificial están saturados o no disponibles. Inténtalo más tarde.');
}

/**
 * Get AI vision response using the first provider that succeeds.
 * @param {Object} params - { prompt: string, imageUrl: string }
 * @returns {Promise<string>} The analysis text.
 */
export async function getVisionResponse({ prompt, imageUrl }) {
  for (const provider of visionProviders) {
    try {
      const payload = provider.buildPayload({ prompt, imageUrl });
      const result = await callProvider(provider, payload);
      
      if (typeof result === 'string' && result.trim().length > 0) {
        return result;
      }
    } catch (err) {
      console.warn(`[AI Vision] Proveedor ${provider.name} falló:`, err.message || err);
    }
  }
  throw new Error('Todos los proveedores de Visión IA están saturados o no disponibles. Inténtalo más tarde.');
}
