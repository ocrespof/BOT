import { getMedia } from '../../utils/downloader.js';

export default {
  command: ['play', 'p', 'mp3', 'p3', 'ytaudio'],
  category: 'downloads',
  desc: 'Descarga audios de YouTube a partir de enlaces.',
  run: async (client, m, args, usedPrefix, command) => {
    try {
      const url = args.join(' ');
      if (!url) {
        return m.reply(`> 🎵 *Por favor, proporciona un enlace o término de búsqueda.*\n\n*📌 Ejemplo:* \`${usedPrefix + command} https://youtu.be/xxxx\``);
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
                title: "YouTube Audio",
                body: "Descargado vía YukiBot MD",
                thumbnailUrl: "https://i.io/qpPn1K7.gif",
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
