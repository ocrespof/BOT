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
  return keys[Math.floor(Math.random() * keys.length)];
}

const providers = [
  {
    name: 'Official Gemini 1.5 Flash',
    url: () => 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
    method: 'POST',
    isOfficial: true,
    getHeaders: () => {
      const key = getGeminiKey();
      if (!key) return null;
      return { 'Content-Type': 'application/json', 'X-goog-api-key': key };
    },
    buildPayload: ({ content, prompt, history }) => {
        const contents = [];
        // Optional: you can use system_instruction in Gemini API natively, but injecting it into the first message is safer for compatibility.
        if (history.length === 0) {
            contents.push({ role: 'user', parts: [{ text: `${prompt}\n\n${content}` }] });
        } else {
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
    name: 'NVIDIA NIM (LLaMA/Mistral)',
    url: () => global?.APIs?.nvidia?.key ? 'https://integrate.api.nvidia.com/v1/chat/completions' : null,
    method: 'POST',
    isOfficial: true,
    getHeaders: () => ({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${global.APIs.nvidia.key}`
    }),
    buildPayload: ({ content, prompt, history }) => {
      const messages = [{ role: 'system', content: prompt }];
      for (const h of history) {
        messages.push({ role: h.role, content: h.content });
      }
      messages.push({ role: 'user', content: content });
      return {
        model: "meta/llama3-70b-instruct", // Default NVIDIA API model
        messages: messages,
        temperature: 0.7,
        max_tokens: 1024
      };
    },
    parseResponse: (data) => data?.choices?.[0]?.message?.content
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
    url: () => 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
    method: 'POST',
    isOfficial: true,
    getHeaders: () => {
      const key = getGeminiKey();
      if (!key) return null;
      return { 'Content-Type': 'application/json', 'X-goog-api-key': key };
    },
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

function isInvalidResponse(result) {
    if (!result || typeof result !== 'string') return true;
    const lower = result.toLowerCase().trim();
    if (lower.length === 0) return true;
    
    // Falsos positivos devueltos por APIs caídas (Ryzen, Delirius, etc)
    const badKeywords = [
        'parametros incompletos',
        'parámetros incompletos',
        'endpoint invalid',
        'api key error',
        'server error',
        'internal server error'
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
      const payload = await provider.buildPayload({ content, prompt, historyStr, history });
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
      const payload = await provider.buildPayload({ prompt, imageUrl });
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
