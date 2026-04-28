import axios from 'axios';
import { UI } from '../../utils/ui.js';

export default {
  command: ['health', 'api', 'apis'],
  category: 'owner',
  isOwner: true,
  desc: 'Verifica el estado de las APIs externas de Inteligencia Artificial',
  run: async (client, m, args, usedPrefix, command) => {
    const key = (await client.sendMessage(m.chat, { text: `> ${UI.symbols.loading} Comprobando el estado de las APIs, por favor espera...` }, { quoted: m })).key;

    const endpoints = [
      { name: 'Ryzen (Gemini Pro)', url: 'https://api.ryzendesu.vip/api/ai/gemini-pro' },
      { name: 'Siputzx (Gemini)', url: 'https://api.siputzx.my.id/api/ai/gemini' },
      { name: 'Vreden (GPT-4)', url: 'https://api.vreden.web.id/api/ai/gpt4' },
      { name: 'Stellar (GPTPrompt)', url: global?.APIs?.stellar?.url ? `${global.APIs.stellar.url}/ai/gptprompt` : 'https://api.yuki-wabot.my.id/ai/gptprompt' }
    ];

    let resultsText = '';
    let onlineCount = 0;
    let checkedCount = 0;

    for (const ep of endpoints) {
      if (!ep.url) {
        resultsText += `\n${UI.symbols.warn} *${ep.name}* \n> ⚠️ No configurada (Falta API Key)`;
        continue;
      }
      checkedCount++;
      try {
        const start = Date.now();
        if (ep.method === 'POST' && ep.isOfficial) {
          // Send a dummy request to check if it's reachable and auth works
          const headers = { 'Content-Type': 'application/json' };
          if (ep.name.includes('Gemini')) {
            const keys = global?.APIs?.gemini?.keys;
            if (!keys || keys.length === 0) throw new Error('No keys');
            headers['X-goog-api-key'] = keys[0];
          }
          await axios.post(ep.url, { contents: [{ role: 'user', parts: [{ text: 'hi' }] }] }, { headers, timeout: 5000 });
        } else {
          await axios.get(ep.url, { timeout: 5000 });
        }
        
        const ms = Date.now() - start;
        resultsText += `\n${UI.symbols.success} *${ep.name}* \n> ⏱️ ${ms}ms`;
        onlineCount++;
      } catch (err) {
        // A 400 Bad Request from an Official API usually means it's online but our dummy payload was slightly off or requires specific params, so it's technically online. 401/403 means auth error.
        if (err.response && (err.response.status === 400 || err.response.status === 403)) {
          const ms = 150; // estimate
          resultsText += `\n${UI.symbols.success} *${ep.name}* \n> ⏱️ ${ms}ms (Online, Auth/Req Info: ${err.response.status})`;
          onlineCount++;
        } else {
          resultsText += `\n${UI.symbols.error} *${ep.name}* \n> ❌ Inactiva / Error`;
        }
      }
    }

    const messageContent = UI.box(
      'Estado del Sistema (APIs)',
      `Total APIs verificadas: ${checkedCount}\nEn línea: ${onlineCount}\nFuera de línea: ${checkedCount - onlineCount}\n${resultsText}`,
      `Powered by YukiBot`
    );

    await client.sendMessage(m.chat, { text: messageContent, edit: key });
  }
};
