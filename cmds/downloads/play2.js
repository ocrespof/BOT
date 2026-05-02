import { getMedia } from '../../utils/downloader.js';

export default {
  command: ['play2', 'mp4', 'ytv', 'video'],
  category: 'downloads',
  desc: 'Descarga videos de YouTube a partir de enlaces.',
  run: async (client, m, args, usedPrefix, command) => {
    try {
      const url = args.join(' ');
      if (!url) {
        return m.reply(`> 🎬 *Por favor, proporciona un enlace o término de búsqueda.*\n\n*📌 Ejemplo:* \`${usedPrefix + command} https://youtu.be/xxxx\``);
      }

      await m.reply('> ⏳ *Obteniendo el video, por favor espera un momento...*');
      
      const media = await getMedia('youtube_video', url);
      
      if (!media || !media.url) {
        return m.reply('> ❌ *Lo siento, no pude obtener el video en este momento. Verifica el enlace e intenta de nuevo.*');
      }

      const caption = `> 🎬 *Video Descargado*\n\n*API Usada:* ${media.api || 'Desconocido'}`;
      
      await client.sendMessage(m.chat, { 
        video: { url: media.url }, 
        caption: caption
      }, { quoted: m });

    } catch (e) {
      await m.reply(`> ⚠️ *Ocurrió un error inesperado al procesar la solicitud.*\n[Error: *${e.message}*]`);
    }
  }
};
