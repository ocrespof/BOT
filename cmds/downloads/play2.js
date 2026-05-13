import { getMedia } from '../../utils/downloader.js';
import { extractUrl } from '../../utils/extractUrl.js';

export default {
  command: ['play2', 'mp4', 'ytv', 'video'],
  category: 'downloads',
  desc: 'Descarga videos de YouTube. Puedes citar un mensaje con enlace.',
  run: async (client, m, args, usedPrefix, command) => {
    try {
      const text = args.join(' ');
      const url = extractUrl(m, text) || text;
      if (!url) {
        return m.reply(`> 🎬 *Proporciona un enlace o cita un mensaje con un enlace.*\n\n*📌 Ejemplo:* \`${usedPrefix + command} https://youtu.be/xxxx\`\no responde a un mensaje con un enlace.`);
      }

      await m.reply('> ⏳ *Obteniendo el video, por favor espera un momento...*');
      
      const media = await getMedia('youtube_video', url);
      
      if (!media || !media.url) {
        return m.reply('> ❌ *Lo siento, no pude obtener el video en este momento. Verifica el enlace e intenta de nuevo.*');
      }

      const caption = `> 🎬 *Video Descargado*\n\n` +
        (media.title ? `• *Título:* ${media.title}\n` : '') +
        (media.author ? `• *Canal:* ${media.author}\n` : '') +
        (media.duration ? `• *Duración:* ${media.duration}\n` : '');
      
      await client.sendMessage(m.chat, { 
        video: { url: media.url }, 
        caption: caption.trim()
      }, { quoted: m });

    } catch (e) {
      await m.reply(`> ⚠️ *Ocurrió un error inesperado al procesar la solicitud.*\n[Error: *${e.message}*]`);
    }
  }
};
