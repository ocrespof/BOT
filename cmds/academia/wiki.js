import { httpGet, httpPost, httpAxios as axios } from '../../utils/http.js';

export default {
  command: ['wiki', 'wikipedia'],
  category: 'academia',
  run: async (client, m, args, usedPrefix, command, text) => {
    if (!text) return m.reply(` Escribe qué deseas buscar.\n*Ejemplo:* ${usedPrefix + command} Segunda Guerra Mundial`);
    try {
      m.react('⏳');
      const api = `https://es.wikipedia.org/w/api.php?format=json&action=query&prop=extracts&exintro&explaintext&redirects=1&titles=${encodeURIComponent(text)}`;
      const req = await fetch(api);
      const res = await req.json();
      const pages = res.query.pages;
      const pageId = Object.keys(pages)[0];
      if (pageId === '-1') return m.reply(` No se encontró ningún artículo para: *${text}*`);
      const extract = pages[pageId].extract;
      const title = pages[pageId].title;
      const responseText = `*📚 WIKIPEDIA: ${title}*\n\n${extract}`;
      await client.sendMessage(m.chat, { text: responseText }, { quoted: m });
      m.react('✅');
    } catch (e) {
      m.react('❌');
      m.reply(' Error al comunicarse con Wikipedia.');
    }
  }
};
