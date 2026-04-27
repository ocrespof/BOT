import axios from 'axios';
import { UI } from '../../utils/ui.js';

export default {
  command: ['health', 'api', 'apis'],
  category: 'owner',
  isOwner: true,
  isPrivate: true,
  desc: 'Verifica el estado de las APIs externas (IA, Downloaders, etc.)',
  run: async (client, m, args, usedPrefix, command) => {
    const key = (await client.sendMessage(m.chat, { text: `> ${UI.symbols.loading} Comprobando el estado de las APIs, por favor espera...` }, { quoted: m })).key;

    const endpoints = [
      { name: 'Siputzx AI', url: 'https://ai.siputzx.my.id' },
      { name: 'Ryzen API', url: 'https://api.ryzendesu.vip' },
      { name: 'Stellar API', url: global?.APIs?.stellar?.url || 'https://api.stellar.my.id' }, // Default domain if not configured
      { name: 'Stacktoy AI', url: 'https://mistral.stacktoy.workers.dev' },
      { name: 'GTech Llama', url: 'https://llama.gtech-apiz.workers.dev' },
      { name: 'Delirius API', url: global?.APIs?.delirius?.url || 'https://deliriusapi-official.vercel.app' },
      { name: 'Vreden API', url: global?.APIs?.vreden?.url || 'https://api.vreden.my.id' }
    ];

    let resultsText = '';
    let onlineCount = 0;

    for (const ep of endpoints) {
      if (!ep.url) continue;
      try {
        const start = Date.now();
        await axios.get(ep.url, { timeout: 5000 });
        const ms = Date.now() - start;
        resultsText += `\n${UI.symbols.success} *${ep.name}* \n> ⏱️ ${ms}ms`;
        onlineCount++;
      } catch (err) {
        resultsText += `\n${UI.symbols.error} *${ep.name}* \n> ❌ Inactiva / Error`;
      }
    }

    const messageContent = UI.box(
      'Estado del Sistema (APIs)',
      `Total APIs revisadas: ${endpoints.length}\nEn línea: ${onlineCount}\nFuera de línea: ${endpoints.length - onlineCount}\n${resultsText}`,
      `Powered by YukiBot`
    );

    await client.sendMessage(m.chat, { text: messageContent, edit: key });
  }
};
