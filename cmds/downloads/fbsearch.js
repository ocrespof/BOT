import { getMedia } from '../../utils/downloader.js';

// --- Helpers de formato ---
const formatLine = (label, value) => value ? `• *${label}:* ${value}\n` : '';
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export default {
  command: ['fbsearch', 'fbs', 'fbvideo'],
  help: ['fbsearch'],
  category: 'downloads',
  desc: 'Buscar videos y fotos en Facebook por texto.',
  cooldown: 10,
  run: async (client, m, args, usedPrefix, command) => {
    const query = args.join(' ').trim();
    if (!query) {
      return m.reply(`> 🔍 *Escribe qué deseas buscar en Facebook.*\n\n*📌 Ejemplo:* \`${usedPrefix + command} tom y jerry\``);
    }

    await m.reply('> ⏳ *Buscando en Facebook, espera un momento...*');

    try {
      const result = await getMedia('facebook_search', query, { limit: 10 });

      if (!result || (result.stats.videos === 0 && result.stats.photos === 0)) {
        return m.reply('> ❌ *No se encontraron videos ni fotos para esa búsqueda.*');
      }

      const MAX_SEND = 4;

      // --- Enviar Videos ---
      const videosToSend = result.videos.filter(v => v.download_hd || v.download_sd).slice(0, MAX_SEND);
      
      for (let i = 0; i < videosToSend.length; i++) {
        const v = videosToSend[i];
        const dlUrl = v.download_hd || v.download_sd;
        const caption = `✧ *FB Video* ${i + 1}/${videosToSend.length}\n\n` +
          formatLine('Texto', v.text?.slice(0, 200)) +
          formatLine('Calidad', v.download_hd ? 'HD' : 'SD') +
          formatLine('Duración', v.duration ? `${v.duration}s` : null) +
          formatLine('Resolución', (v.width && v.height) ? `${v.width}x${v.height}` : null) +
          formatLine('👍 Likes', v.stats?.likes?.toLocaleString()) +
          formatLine('💬 Comentarios', v.stats?.comments?.toLocaleString()) +
          formatLine('👀 Vistas', v.stats?.views?.toLocaleString());

        try {
          await client.sendMessage(m.chat, {
            video: { url: dlUrl },
            caption: caption.trim(),
            mimetype: 'video/mp4'
          }, { quoted: m });
        } catch (sendErr) {
          // Si falla el video, intentar enviar como link
          await m.reply(`> ⚠️ No se pudo enviar el video ${i + 1}.\n${formatLine('Link directo', dlUrl)}`);
        }
        if (i < videosToSend.length - 1) await sleep(1000);
      }

      // --- Enviar Fotos ---
      const photosToSend = result.photos.filter(p => p.download_url).slice(0, MAX_SEND);

      for (let i = 0; i < photosToSend.length; i++) {
        const p = photosToSend[i];
        const caption = `✧ *FB Foto* ${i + 1}/${photosToSend.length}\n\n` +
          formatLine('Texto', p.text?.slice(0, 200)) +
          formatLine('Resolución', (p.width && p.height) ? `${p.width}x${p.height}` : null) +
          formatLine('👍 Likes', p.stats?.likes?.toLocaleString()) +
          formatLine('💬 Comentarios', p.stats?.comments?.toLocaleString());

        try {
          await client.sendMessage(m.chat, {
            image: { url: p.download_url },
            caption: caption.trim()
          }, { quoted: m });
        } catch {
          await m.reply(`> ⚠️ No se pudo enviar la foto ${i + 1}.`);
        }
        if (i < photosToSend.length - 1) await sleep(800);
      }

      // --- Resumen si no hubo media descargable ---
      if (videosToSend.length === 0 && photosToSend.length === 0 && result.users.length > 0) {
        let userList = '> 👤 *Usuarios encontrados:*\n\n';
        result.users.slice(0, 5).forEach((u, i) => {
          userList += `${i + 1}. *${u.name}*${u.verified ? ' ✓' : ''}\n   ${u.url}\n\n`;
        });
        await m.reply(userList.trim());
      }

    } catch (e) {
      if (e.message.includes('Cookies')) {
        return m.reply('> ⚠️ *Las cookies de Facebook han expirado.* El owner del bot debe actualizarlas.');
      }
      await m.reply(`> ⚠️ *Error al buscar en Facebook.*\n[Error: *${e.message}*]`);
    }
  }
};
