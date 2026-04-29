// utils/ai.js
import config from '../config.js';
import axios from 'axios';

/**
 * Centralized AI client with fallback support.
 * Ported and improved from YukiBot-MD-main.
 */

export async function getAIResponse({ text, content, prompt, user }) {
  const query = text || content;
  const logic = prompt || 'Eres un asistente inteligente.';
  const username = user || 'usuario';

  // 1. Try Ryzendesu VIP (GPT-4 / Advanced)
  try {
    const res = await axios.get(`https://api.ryzendesu.vip/api/ai/chatgpt?text=${encodeURIComponent(query)}&prompt=${encodeURIComponent(logic)}`, { timeout: 12000 });
    if (res.data?.response) return res.data.response;
  } catch (err) {}

  // 2. Try Luminsesi (Siputzx)
  try {
    const res = await axios.post("https://ai.siputzx.my.id", { 
      content: query, 
      user: username, 
      prompt: logic, 
      webSearchMode: false 
    }, { timeout: 10000 });
    if (res.data?.result) return res.data.result;
  } catch (err) {}

  // 3. Try Fallback APIs (AEMT, Stellar, Sylphy)
  const apis = [
    {
      url: `https://aemt.me/prompt/gpt?prompt=${encodeURIComponent(logic)}&text=${encodeURIComponent(query)}`,
      extractor: json => json.result
    },
    { 
      url: `${config.APIs.stellar.url}/ai/gptprompt?text=${encodeURIComponent(query)}&prompt=${encodeURIComponent(logic)}&key=${config.APIs.stellar.key}`,
      extractor: json => json.result?.text || json.result || json.results
    },
    {
      url: `${config.APIs.sylphy.url}/ai/gemini?q=${encodeURIComponent(query)}&prompt=${encodeURIComponent(logic)}&api_key=${config.APIs.sylphy.key}`,
      extractor: json => json.result?.text || json.result
    }
  ];

  for (const api of apis) {
    try {
      const res = await fetch(api.url);
      const json = await res.json();
      const response = api.extractor(json);
      if (response) return response;
    } catch (err) {
      // console.error(`AI: Fallback error for ${api.url}`, err.message);
    }
  }

  throw new Error("No se pudo obtener una respuesta de la IA en ninguno de los proveedores.");
}
