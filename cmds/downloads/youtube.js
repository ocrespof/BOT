import { getMedia } from './downloader.js';
import { extractUrl } from '../../utils/tools.js';
import yts from 'yt-search';
import { getBuffer } from '../../core/message.js';
import axios from 'axios';

export default {
  help: ['play', 'play2', 'ytsearch'],
  command: ['play', 'p', 'mp3', 'p3', 'ytaudio', 'play2', 'mp4', 'ytv', 'video', 'ytsearch', 'search', 'yts'],
  category: 'downloads',
  heavy: true,
  desc: 'Comando unificado de YouTube (buscar, descargar audio o video). Puedes citar un mensaje con enlace.',
  run: async (client, m, args, usedPrefix, command) => {
    const cmd = command.toLowerCase();
    const text = args.join(' ').trim();

    if (['ytsearch', 'search', 'yts'].includes(cmd)) {
      if (!text) return m.reply(`> 🔎 *Ingrese un término de búsqueda.*`);
      try {
        const ress = await yts(text);
        const armar = ress.all;
        if (!armar?.length) return m.reply('No se encontraron resultados.');
        const Ibuff = await getBuffer(armar[0].image);
        let teks2 = armar.map((v) => {
          switch (v.type) {
            case 'video':
              return `➩ *Título ›* *${v.title}* \n*Duración ›* ${v.timestamp}\n*Subido ›* ${v.ago}\n✿ *Vistas ›* ${v.views}\n❒ *Url ›* ${v.url}`.trim();
            case 'channel':
              return `Canal › *${v.name}*\n❒ Url › ${v.url}\nSubscriptores › ${v.subCountLabel} (${v.subCount})\n✿ Videos totales › ${v.videoCount}`.trim();
          }
        }).filter((v) => v).join('\n\n╾۪〬─ ┄۫╌ ׄ┄┈۪ ─〬 ׅ┄╌ ۫┈ ─ׄ─۪〬 ┈ ┄۫╌ ┈┄۪ ─ׄ〬╼\n\n');
        await client.sendMessage(m.chat, { image: Ibuff, caption: teks2 }, { quoted: m });
      } catch (e) {
        m.reply(`> Error al buscar en YouTube.\n[Causa: *${e.message}*]`);
      }
      return;
    }

    // Comandos de descarga (play / play2)
    let url = extractUrl(m, text);
    if (!url && text) {
      const search = await yts(text);
      if (search && search.videos.length > 0) {
        url = search.videos[0].url;
      }
    }
    if (!url) {
      const exCmd = ['play', 'mp3', 'p3', 'ytaudio'].includes(cmd) ? 'audio' : 'video';
      return m.reply(`> 🎵 *Proporciona un enlace, cita un mensaje o escribe una búsqueda para ${exCmd}.*\n\n*📌 Ejemplo:* \`${usedPrefix + command} alan walker\` o \`${usedPrefix + command} https://youtu.be/xxxx\``);
    }

    if (['play', 'mp3', 'p3', 'ytaudio'].includes(cmd)) {
      try {
        await m.reply('> ⏳ *Obteniendo el audio, por favor espera un momento...*');
        const media = await getMedia('youtube_audio', url);
        if (!media || !media.url) {
          return m.reply('> ❌ *Lo siento, no pude obtener el audio en este momento. Intenta de nuevo.*');
        }

        let audioBuffer;
        try {
          const res = await axios.get(media.url, {
            responseType: 'arraybuffer',
            timeout: 60000,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': '*/*'
            }
          });
          audioBuffer = Buffer.from(res.data);
        } catch {
          audioBuffer = { url: media.url };
        }

        await client.sendMessage(m.chat, { 
          audio: audioBuffer, 
          mimetype: 'audio/mpeg',
          fileName: `${media.title || 'audio'}.mp3`,
          ptt: false
        }, { quoted: m });
      } catch (e) {
        await m.reply(`> ⚠️ *Ocurrió un error al procesar el audio.*\n[Causa: *${e.message}*]`);
      }
    } else if (['play2', 'mp4', 'ytv', 'video'].includes(cmd)) {
      try {
        await m.reply('> ⏳ *Obteniendo el video, por favor espera un momento...*');
        const media = await getMedia('youtube_video', url);
        if (!media || !media.url) {
          return m.reply('> ❌ *Lo siento, no pude obtener el video en este momento. Intenta de nuevo.*');
        }
        const caption = `> 🎬 *Video Descargado*\n\n` +
          (media.title ? `• *Título:* ${media.title}\n` : '') +
          (media.author ? `• *Canal:* ${media.author}\n` : '') +
          (media.duration ? `• *Duración:* ${media.duration}\n` : '');

        let videoBuffer;
        try {
          const res = await axios.get(media.url, {
            responseType: 'arraybuffer',
            timeout: 60000,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': '*/*'
            }
          });
          videoBuffer = Buffer.from(res.data);
        } catch {
          videoBuffer = { url: media.url };
        }

        await client.sendMessage(m.chat, { 
          video: videoBuffer, 
          caption: caption.trim(),
          fileName: `${media.title || 'video'}.mp4`,
          mimetype: 'video/mp4'
        }, { quoted: m });
      } catch (e) {
        await m.reply(`> ⚠️ *Ocurrió un error al procesar el video.*\n[Causa: *${e.message}*]`);
      }
    }
  }
};
