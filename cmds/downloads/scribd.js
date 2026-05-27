import { getMedia } from '../../utils/downloader.js';
import { extractUrl } from '../../utils/tools.js';

export default {
  command: ['scribd'],
  category: 'downloads',
  desc: 'Descarga documentos desde Scribd. Puedes citar un mensaje con enlace.',
  run: async (client, m, args, usedPrefix, command) => {
    try {
      const text = args.join(' ');
      const url = extractUrl(m, text);
      if (!url) {
        return m.reply(`> 📄 *Proporciona un enlace de Scribd o cita un mensaje con uno.*\n\n*📌 Ejemplo:* \`${usedPrefix + command} https://es.scribd.com/document/xxxx/yyyy\``);
      }
      if (!url.includes('scribd.com')) {
        return m.reply('> ❌ *Ese no parece ser un enlace válido de Scribd.*');
      }

      await m.reply('> ⏳ *Obteniendo documento, por favor espera un momento...*');
      
      const media = await getMedia('scribd', url);
      
      if (!media || !media.url) {
        return m.reply('> ❌ *Lo siento, no pude obtener el documento en este momento. Intenta de nuevo más tarde.*');
      }

      // El extractor suele devolver { title, url }
      const caption = `> 📄 *Documento Descargado*\n\n*Título:* ${media.title || 'Scribd Document'}`;
      
      await client.sendFile(m.chat, media.url, `${media.title || 'Documento_Scribd'}.pdf`, caption, m, false, { asDocument: true });

    } catch (e) {
      await m.reply(`> ⚠️ *Ocurrió un error inesperado al procesar la solicitud.*\n[Error: *${e.message}*]`);
    }
  }
};
