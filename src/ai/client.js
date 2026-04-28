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
    name: 'Stellar (GPTPrompt)',
    url: () => global?.APIs?.stellar?.url ? `${global.APIs.stellar.url}/ai/gptprompt` : 'https://api.yuki-wabot.my.id/ai/gptprompt',
    method: 'GET',
    buildPayload: ({ content, prompt }) => `?text=${encodeURIComponent(content)}&prompt=${encodeURIComponent(prompt)}&key=${global?.APIs?.stellar?.key || 'YukiBot-MD'}`,
    parseResponse: (data) => data?.result || data?.response || data?.message
  },
  {
    name: 'Sylphy (Gemini)',
    url: () => global?.APIs?.sylphy?.url ? `${global.APIs.sylphy.url}/ai/gemini` : 'https://api.sylphy.co.id/ai/gemini',
    method: 'GET',
    buildPayload: ({ content, prompt }) => `?q=${encodeURIComponent(content)}&prompt=${encodeURIComponent(prompt)}&api_key=${global?.APIs?.sylphy?.key || 'Admin'}`,
    parseResponse: (data) => data?.result || data?.data || data?.message || data?.answer
  },
  {
    name: 'GiftedTech (Gemini Pro)',
    url: () => 'https://api.giftedtech.my.id/api/ai/geminiaipro',
    method: 'GET',
    buildPayload: ({ content, prompt, historyStr }) => `?apikey=gifted&q=${encodeURIComponent(prompt + '\n\n' + historyStr + 'Usuario: ' + content)}`,
    parseResponse: (data) => data?.result || data?.data || data?.message
  },
  {
    name: 'Vapis (Gemini)',
    url: () => 'https://vapis.my.id/api/gemini',
    method: 'GET',
    buildPayload: ({ content, prompt, historyStr }) => `?q=${encodeURIComponent(prompt + '\n\n' + historyStr + 'Usuario: ' + content)}`,
    parseResponse: (data) => data?.data?.result || data?.data || data?.result || data?.message
  },
  {
    name: 'Siputzx (Gemini Pro)',
    url: () => 'https://api.siputzx.my.id/api/ai/gemini-pro',
    method: 'GET',
    buildPayload: ({ content, prompt, historyStr }) => `?content=${encodeURIComponent(prompt + '\n\n' + historyStr + 'Usuario: ' + content)}`,
    parseResponse: (data) => data?.data || data?.result || data?.message
  },
  {
    name: 'Ryzen (Gemini)',
    url: () => 'https://api.ryzendesu.vip/api/ai/gemini',
    method: 'GET',
    buildPayload: ({ content, prompt, historyStr }) => `?text=${encodeURIComponent(historyStr + 'Usuario: ' + content)}&prompt=${encodeURIComponent(prompt)}`,
    parseResponse: (data) => data?.response || data?.result || data?.message
  },
  {
    name: 'Paxsenix (GPT-4o)',
    url: () => 'https://api.paxsenix.biz.id/ai/gpt4o',
    method: 'GET',
    buildPayload: ({ content, prompt, historyStr }) => `?text=${encodeURIComponent(prompt + '\n\n' + historyStr + 'Usuario: ' + content)}`,
    parseResponse: (data) => data?.result || data?.message || data?.data
  },
  {
    name: 'ZellAPI (Chatbot)',
    url: () => 'https://zellapi.autos/ai/chatbot',
    method: 'GET',
    buildPayload: ({ content, prompt, historyStr }) => `?text=${encodeURIComponent(prompt + '\n\n' + historyStr + 'Usuario: ' + content)}`,
    parseResponse: (data) => data?.result || data?.message || data?.data
  },
  {
    name: 'Lance Frank (GPT)',
    url: () => 'https://lance-frank-asta.onrender.com/api/gpt',
    method: 'GET',
    buildPayload: ({ content, prompt, historyStr }) => `?q=${encodeURIComponent(prompt + '\n\n' + historyStr + 'Usuario: ' + content)}`,
    parseResponse: (data) => data?.result || data?.message || data?.data || data?.reply
  },
  {
    name: 'LetMeGPT',
    url: () => 'https://letmegpt.com/api',
    method: 'GET',
    buildPayload: ({ content, prompt, historyStr }) => `?q=${encodeURIComponent(prompt + '\n\n' + historyStr + 'Usuario: ' + content)}`,
    parseResponse: (data) => data?.result || data?.message || data?.data
  },
  {
    name: 'Delirius (ChatGPT)',
    url: () => global?.APIs?.delirius?.url ? `${global.APIs.delirius.url}/ia/chatgpt` : 'https://api.delirius.store/ia/chatgpt',
    method: 'GET',
    buildPayload: ({ content, prompt, historyStr }) => `?q=${encodeURIComponent(prompt + '\n\n' + historyStr + 'Usuario: ' + content)}`,
    parseResponse: (data) => data?.data || data?.result || data?.message
  }
];

const visionProviders = [
  {
    name: 'Delirius (Gemini Vision)',
    url: () => global?.APIs?.delirius?.url ? `${global.APIs.delirius.url}/ia/geminivision` : 'https://api.delirius.store/ia/geminivision',
    method: 'GET',
    buildPayload: ({ prompt, imageUrl }) => `?text=${encodeURIComponent(prompt)}&url=${encodeURIComponent(imageUrl)}`,
    parseResponse: (data) => data?.data || data?.result || data?.message
  },
  {
    name: 'GiftedTech (Gemini Vision)',
    url: () => 'https://api.giftedtech.my.id/api/ai/geminiaipro',
    method: 'GET',
    // Using the same endpoint but passing image as query might work on giftedtech, though dedicated vision endpoints are better.
    buildPayload: ({ prompt, imageUrl }) => `?apikey=gifted&q=${encodeURIComponent(prompt + ' [Imagen: ' + imageUrl + ']')}`,
    parseResponse: (data) => data?.result || data?.data || data?.message
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
export async function getAIResponse({ content, prompt, user }) {
  const cacheKey = `ai_history_${user}`;
  let history = cache.get(cacheKey) || [];
  
  const historyStr = formatHistory(history);

  for (const provider of providers) {
    try {
      const payload = provider.buildPayload({ content, prompt, historyStr, history });
      const result = await callProvider(provider, payload);
      
      if (!isInvalidResponse(result)) {
        history.push({ role: 'user', content: content });
        history.push({ role: 'assistant', content: result });
        if (history.length > 10) history = history.slice(history.length - 10);
        cache.set(cacheKey, history, 30 * 60 * 1000); 
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
