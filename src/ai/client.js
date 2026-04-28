// src/ai/client.js
/**
 * Central AI client with fallback between multiple providers.
 * Includes conversation memory and vision support.
 */
import axios from 'axios';
import { cache } from '../../utils/cache.js';

// Helper to format messages for context (for non-official APIs)
function formatHistory(history) {
  if (!history || history.length === 0) return '';
  return history.map(msg => `${msg.role === 'user' ? 'Usuario' : 'Asistente'}: ${msg.content}`).join('\n') + '\n\n';
}

// Key rotation for official Gemini
function getGeminiKey() {
  const keys = global?.APIs?.gemini?.keys;
  if (!keys || keys.length === 0) return null;
  // Simple random rotation
  return keys[Math.floor(Math.random() * keys.length)];
}

const providers = [
  {
    name: 'Official Gemini 1.5 Flash',
    url: () => {
      const key = getGeminiKey();
      return key ? `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}` : null;
    },
    method: 'POST',
    isOfficial: true,
    buildPayload: ({ content, prompt, history }) => {
        // Build the official Google payload
        const contents = [];
        // Add system instruction as the first user message or handle via prompt
        if (history.length === 0) {
            contents.push({ role: 'user', parts: [{ text: `${prompt}\n\n${content}` }] });
        } else {
            // Reconstruct history
            let hasPrompt = false;
            for (const h of history) {
                let textContent = h.content;
                if (!hasPrompt && h.role === 'user') {
                    textContent = `${prompt}\n\n${textContent}`;
                    hasPrompt = true;
                }
                contents.push({
                    role: h.role === 'user' ? 'user' : 'model',
                    parts: [{ text: textContent }]
                });
            }
            contents.push({ role: 'user', parts: [{ text: content }] });
        }
        return { contents };
    },
    parseResponse: (data) => data?.candidates?.[0]?.content?.parts?.[0]?.text
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
  },
  {
    name: 'Lurick (ChatGPT)',
    url: () => 'https://api.lurick.my.id/api/ai/chatgpt',
    method: 'GET',
    buildPayload: ({ content, prompt, historyStr }) => {
        const fullContent = `${prompt}\n\nHistorial de la conversación:\n${historyStr}Usuario: ${content}`;
        return `?q=${encodeURIComponent(fullContent)}`;
    },
    parseResponse: (data) => data?.result || data?.data || data?.message
  }
];

const visionProviders = [
  {
    name: 'Official Gemini Vision',
    url: () => {
      const key = getGeminiKey();
      return key ? `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}` : null;
    },
    method: 'POST',
    isOfficial: true,
    buildPayload: async ({ prompt, imageUrl }) => {
        try {
            const imgRes = await axios.get(imageUrl, { responseType: 'arraybuffer', timeout: 15000 });
            const base64 = Buffer.from(imgRes.data, 'binary').toString('base64');
            const mimeType = imageUrl.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
            return {
                contents: [{
                    role: "user",
                    parts: [
                        { text: prompt },
                        { inline_data: { mime_type: mimeType, data: base64 } }
                    ]
                }]
            };
        } catch (e) {
            throw new Error('Failed to fetch image for Official Gemini Vision');
        }
    },
    parseResponse: (data) => data?.candidates?.[0]?.content?.parts?.[0]?.text
  },
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

async function callProvider(provider, payload) {
  const targetUrl = typeof provider.url === 'function' ? provider.url() : provider.url;
  if (!targetUrl) throw new Error('Proveedor no configurado');
  
  const headers = { ...DEFAULT_HEADERS };
  if (provider.isOfficial) {
      headers['Content-Type'] = 'application/json';
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
export async function getAIResponse({ content, prompt, user }) {
  const cacheKey = `ai_history_${user}`;
  let history = cache.get(cacheKey) || [];
  
  const historyStr = formatHistory(history);

  for (const provider of providers) {
    try {
      const payload = await provider.buildPayload({ content, prompt, historyStr, history });
      const result = await callProvider(provider, payload);
      
      if (typeof result === 'string' && result.trim().length > 0) {
        history.push({ role: 'user', content: content });
        history.push({ role: 'assistant', content: result });
        if (history.length > 10) history = history.slice(history.length - 10);
        cache.set(cacheKey, history, 30 * 60 * 1000); 
        return result;
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
      const payload = await provider.buildPayload({ prompt, imageUrl });
      const result = await callProvider(provider, payload);
      
      if (typeof result === 'string' && result.trim().length > 0) {
        return result;
      }
    } catch (err) {
      console.warn(`[AI Vision] Proveedor ${provider.name} falló:`, err.response?.data || err.message || err);
    }
  }
  throw new Error('Todos los proveedores de Visión IA están saturados o no disponibles. Inténtalo más tarde.');
}
