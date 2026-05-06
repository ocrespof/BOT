import { httpGet, httpPost, httpAxios as axios } from '../../utils/http.js';
import { translate } from '../../utils/translate.js';

export default {
  command: ['frase', 'motivacion'],
  category: 'academia',
  desc: 'Frase motivacional.',
  run: async (client, m, args, usedPrefix, command) => {
    try {
      m.react('💡');
      const res = await fetch('https://zenquotes.io/api/random');
      const json = await res.json();
      
      if (!json || !json[0] || !json[0].q) throw new Error("API err");
      
      const enQuote = json[0].q;
      const author = json[0].a;
      
      const translatedText = await translate(enQuote, 'es', 'en');
      
      const finalMsg = `*🎓 FRASE DEL DÍA*\n\n"${translatedText}"\n\n— _${author}_`;
      
      await client.sendMessage(m.chat, { text: finalMsg }, { quoted: m });
      m.react('✅');
    } catch (e) {
      m.react('❌');
      m.reply(` Ups, no pude traer una frase en este momento.`);
    }
  }
}
