import fetch from 'node-fetch';

export default {
  command: ['versiculo', 'verse', 'vd'],
  category: 'utils',
  run: async (client, m) => {
    try {
      m.react('⏳');
      const res = await fetch('https://www.bible.com/es/verse-of-the-day', { timeout: 15000 });
      const html = await res.text();
      
      const ogDescMatch = html.match(/property="og:description"\s*content="([^"]+)"/i) || html.match(/content="([^"]+)"\s*property="og:description"/i);
      const ogTitleMatch = html.match(/property="og:title"\s*content="([^"]+)"/i) || html.match(/content="([^"]+)"\s*property="og:title"/i);
      const ogImageMatch = html.match(/property="og:image"\s*content="([^"]+)"/i) || html.match(/content="([^"]+)"\s*property="og:image"/i);
      
      const ogDesc = ogDescMatch ? ogDescMatch[1] : null;
      const ogTitle = ogTitleMatch ? ogTitleMatch[1] : null;
      const ogImage = ogImageMatch ? ogImageMatch[1] : null;
      
      if (ogDesc && ogTitle) {
          if (ogImage) {
              await client.sendMessage(m.chat, { image: { url: ogImage }, caption: `📖 *${ogTitle}*\n\n"${ogDesc}"` }, { quoted: m });
          } else {
              m.reply(`📖 *${ogTitle}*\n\n"${ogDesc}"`);
          }
      } else {
          m.reply(`❌ No se pudo obtener el versículo de bible.com`);
      }
    } catch (e) {
      m.reply(`❌ Ocurrió un error al obtener el versículo.`);
      console.log(e);
    }
  }
}
