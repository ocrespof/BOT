// utils/ai.js
import config from '../config.js';
import axios from 'axios';
import https from 'https';
import { isApiOnline, setApiOffline } from './healthChecker.js';

/**
 * Centralized AI client with fallback chain.
 * Timeout-optimized for Termux: aggressive timeouts, no wasted cycles.
 */

const AI_TIMEOUT = 12000;

// Agente HTTPS para ignorar certificados autofirmados (ej. Ryzen)
const httpsAgent = new https.Agent({ rejectUnauthorized: false });

export async function getAIResponse({ text, content, prompt, user, imageBuffer }) {
  const query = text || content;
  if (!query) throw new Error('No se proporcionó texto para la IA.');
  const logic = prompt || 'Eres un asistente inteligente. Responde de forma precisa y concisa.';
  const username = user || 'usuario';

  const totalLength = query.length + logic.length;

  const apis = [
    // 1. Ryzendesu (GPT-4) - GET (Usa agente HTTPS para certificados autofirmados)
    {
      name: 'Ryzen',
      skip: (imageBuffer ? true : false) || totalLength > 4000 || !isApiOnline('ryzen'),
      call: () => axios.get(`https://api.ryzendesu.vip/api/ai/chatgpt?text=${encodeURIComponent(query)}&prompt=${encodeURIComponent(logic)}`, { 
        timeout: AI_TIMEOUT,
        httpsAgent
      }),
      extract: res => res.data?.response
    },
    // 2. Siputzx (Luminai — POST) - POST
    {
      name: 'Siputzx',
      skip: !isApiOnline('siputzx'),
      call: () => {
        const payload = { content: query, user: username, prompt: logic, webSearchMode: false };
        if (imageBuffer) payload.imageBuffer = imageBuffer;
        return axios.post("https://ai.siputzx.my.id", payload, { timeout: AI_TIMEOUT });
      },
      extract: res => res.data?.result
    },
    // 3. AEMT - GET
    {
      name: 'AEMT',
      skip: (imageBuffer ? true : false) || totalLength > 4000 || !isApiOnline('aemt'),
      call: () => axios.get(`https://aemt.me/prompt/gpt?prompt=${encodeURIComponent(logic)}&text=${encodeURIComponent(query)}`, { timeout: AI_TIMEOUT }),
      extract: res => res.data?.result
    },
    // 4. Stellar (own API) - GET
    {
      name: 'Stellar',
      skip: (imageBuffer ? true : false) || totalLength > 4000 || !isApiOnline('stellar'),
      call: () => axios.get(`${config.APIs.stellar.url}/ai/gptprompt?text=${encodeURIComponent(query)}&prompt=${encodeURIComponent(logic)}&key=${config.APIs.stellar.key}`, { timeout: AI_TIMEOUT }),
      extract: res => res.data?.result?.text || res.data?.result || res.data?.results
    }
  ];

  for (const api of apis) {
    if (api.skip) continue;
    try {
      const res = await api.call();
      const response = api.extract(res);
      
      if (response && typeof response === 'string' && response.length > 5) {
        // Filtrar respuestas de error del proveedor (ej: "Error: No WIZ data")
        const lowerResponse = response.toLowerCase().trim();
        if (lowerResponse.startsWith('error:') || lowerResponse.includes('no wiz data') || lowerResponse.includes('error al procesar')) {
          console.warn(`[AI Client] Proveedor ${api.name} retornó un error de texto en su respuesta. Saltando al fallback...`);
          continue;
        }
        return response;
      }
    } catch (err) {
      // Mark as offline if network/timeout error
      const isNetworkError = !err.response || err.response.status >= 500 || err.code === 'ECONNABORTED';
      if (isNetworkError) {
        setApiOffline(api.name);
      }
    }
  }

  throw new Error("No se pudo obtener una respuesta de la IA en ninguno de los proveedores.");
}
