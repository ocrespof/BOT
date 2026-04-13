import fetch from 'node-fetch';

export default {
  command: ['devocional', 'devocio'],
  category: 'utils',
  run: async (client, m) => {
    try {
      m.react('⏳');
      const res = await fetch('https://www.bibliaon.com/es/devocional_diario/');
      const html = await res.text();
      
      const titleMatch = html.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
      const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : null;
      
      let devotionalText = '';
      if (titleMatch) {
         const afterTitle = html.substring(titleMatch.index + titleMatch[0].length);
         const rawContent = afterTitle.split(/<h2|<form|<div class="row"/i)[0];
         const paragraphs = rawContent.match(/<p[^>]*>([\s\S]*?)<\/p>/gi) || [];
         devotionalText = paragraphs.map(p => p.replace(/<[^>]+>/g, '').trim()).filter(Boolean).join('\n\n');
      }

      if (title && devotionalText) {
          m.reply(`🙏 *${title}*\n\n${devotionalText}`);
      } else {
          m.reply(`❌ No se pudo obtener el devocional.`);
      }
    } catch (e) {
      m.reply(`❌ Ocurrió un error al obtener el devocional.`);
      console.log(e);
    }
  }
}
