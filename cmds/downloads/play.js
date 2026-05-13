import { getMedia } from '../../utils/downloader.js';
import { extractUrl } from '../../utils/extractUrl.js';

export default {
  command: ['play', 'mp3', 'p3', 'ytaudio'],
  category: 'downloads',
  desc: 'Descarga audios de YouTube. Puedes citar un mensaje con enlace.',
  run: async (client, m, args, usedPrefix, command) => {
    try {
      const text = args.join(' ');
      const url = extractUrl(m, text) || text;
      if (!url) {
        return m.reply(`> 🎵 *Proporciona un enlace o cita un mensaje con un enlace.*\n\n*📌 Ejemplo:* \`${usedPrefix + command} https://youtu.be/xxxx\`\no responde a un mensaje con un enlace.`);
      }

      await m.reply('> ⏳ *Obteniendo el audio, por favor espera un momento...*');
      
      const media = await getMedia('youtube_audio', url);
      
      if (!media || !media.url) {
        return m.reply('> ❌ *Lo siento, no pude obtener el audio en este momento. Verifica el enlace e intenta de nuevo.*');
      }

      await client.sendMessage(m.chat, { 
        audio: { url: media.url }, 
        mimetype: 'audio/mpeg',
        contextInfo: {
            externalAdReply: {
                title: media.title || "YouTube Audio",
                body: media.author || "Descargado vía YukiBot MD",
                thumbnailUrl: media.thumbnail || "https://i.io/qpPn1K7.gif",
                sourceUrl: url,
                mediaType: 1,
                renderLargerThumbnail: true
            }
        }
      }, { quoted: m });

    } catch (e) {
      await m.reply(`> ⚠️ *Ocurrió un error inesperado al procesar la solicitud.*\n[Error: *${e.message}*]`);
    }
  }
};
