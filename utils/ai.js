// utils/ai.js
import config from '../config.js';
import axios from 'axios';

/**
 * Centralized AI client with fallback chain.
 * Timeout-optimized for Termux: aggressive timeouts, no wasted cycles.
 */

const AI_TIMEOUT = 12000;

export async function getAIResponse({ text, content, prompt, user }) {
  const query = text || content;
  if (!query) throw new Error('No se proporcionó texto para la IA.');
  const logic = prompt || 'Eres un asistente inteligente. Responde de forma precisa y concisa.';
  const username = user || 'usuario';

  const apis = [
    // 1. Ryzendesu (GPT-4)
    {
      name: 'Ryzen',
      call: () => axios.get(`https://api.ryzendesu.vip/api/ai/chatgpt?text=${encodeURIComponent(query)}&prompt=${encodeURIComponent(logic)}`, { timeout: AI_TIMEOUT }),
      extract: res => res.data?.response
    },
    // 2. Siputzx (Luminai — POST)
    {
      name: 'Siputzx',
      call: () => axios.post("https://ai.siputzx.my.id", { content: query, user: username, prompt: logic, webSearchMode: false }, { timeout: AI_TIMEOUT }),
      extract: res => res.data?.result
    },
    // 3. AEMT
    {
      name: 'AEMT',
      call: () => axios.get(`https://aemt.me/prompt/gpt?prompt=${encodeURIComponent(logic)}&text=${encodeURIComponent(query)}`, { timeout: AI_TIMEOUT }),
      extract: res => res.data?.result
    },
    // 4. Stellar (own API)
    {
      name: 'Stellar',
      call: () => axios.get(`${config.APIs.stellar.url}/ai/gptprompt?text=${encodeURIComponent(query)}&prompt=${encodeURIComponent(logic)}&key=${config.APIs.stellar.key}`, { timeout: AI_TIMEOUT }),
      extract: res => res.data?.result?.text || res.data?.result || res.data?.results
    }
  ];

  for (const api of apis) {
    try {
      const res = await api.call();
      const response = api.extract(res);
      if (response && typeof response === 'string' && response.length > 5) return response;
    } catch {}
  }

  throw new Error("No se pudo obtener una respuesta de la IA en ninguno de los proveedores.");
}
