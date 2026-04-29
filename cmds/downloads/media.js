import { getMedia, isImageUrl } from '../../utils/downloader.js'

export default {
  command: ['fb', 'facebook', 'ig', 'instagram', 'tiktok', 'tt', 'tiktoksearch', 'ttsearch', 'tts', 'pinterest', 'pin', 'studocu', 'studoc'],
  category: 'downloader',
  cooldown: 5,
  desc: 'Descarga contenido de múltiples plataformas (FB, IG, TikTok, Pinterest, Studocu)',
  run: async (client, m, args, usedPrefix, command) => {
    if (!args[0]) {
      return m.reply(` Por favor, ingresa un enlace o término de búsqueda para ${command}.`)
    }
    const text = args.join(' ')
    const cmd = command.toLowerCase()

    try {
      if (['fb', 'facebook'].includes(cmd)) {
        if (!text.match(/facebook\.com|fb\.watch|video\.fb\.com/)) return m.reply(' El enlace es invalido, envía un link de Facebook válido')
        const data = await getMedia('facebook', text)
        if (!data) return m.reply(' No se pudo obtener el contenido.')
        const caption = `« 𝐅𝐁 𝐃𝐎𝐖𝐍𝐋𝐎𝐀𝐃 \n\nTítulo: ${data.title || 'Contenido de Facebook'}`
        
        if (data.isCarousel || (data.urls && data.urls.length > 1)) {
          const maxMedia = data.urls.slice(0, 10);
          for (let i = 0; i < maxMedia.length; i++) {
             const mData = maxMedia[i];
             const textCap = `« 𝐅𝐁 𝐃𝐎𝐖𝐍𝐋𝐎𝐀𝐃 ${i + 1}/${maxMedia.length} »\n\nTítulo: ${data.title || 'Facebook'}`;
             if (mData.type === 'video') await client.sendMessage(m.chat, { video: { url: mData.url }, caption: textCap }, { quoted: m });
             else await client.sendMessage(m.chat, { image: { url: mData.url }, caption: textCap }, { quoted: m });
             await new Promise(r => setTimeout(r, 800));
          }
        } else {
          if (data.type === 'video' || data.url.includes('.mp4')) await client.sendMessage(m.chat, { video: { url: data.url }, caption, mimetype: 'video/mp4', fileName: 'fb.mp4' }, { quoted: m })
          else if (data.type === 'image' || data.url.includes('.jpg')) await client.sendMessage(m.chat, { image: { url: data.url }, caption }, { quoted: m })
          else throw new Error('Contenido no soportado.')
        }
      } 
      else if (['ig', 'instagram'].includes(cmd)) {
        if (!text.match(/instagram\.com\/(p|reel|share|tv|stories)\//)) return m.reply(' El enlace no parece *válido*. Asegúrate de que sea de *Instagram*.')
        const data = await getMedia('instagram', text)
        if (!data || !data.urls || !data.urls.length) return m.reply(' No se pudo obtener el contenido.')
        const caption = `« 𝐈𝐆 𝐃𝐎𝐖𝐍𝐋𝐎𝐀𝐃 \n\nAutor: ${data.title || 'Usuario de Instagram'}`
        
        if (data.isCarousel || data.urls.length > 1) {
          const maxMedia = data.urls.slice(0, 10);
          for (let i = 0; i < maxMedia.length; i++) {
             const u = maxMedia[i];
             const textCap = `« 𝐈𝐆 𝐃𝐎𝐖𝐍𝐋𝐎𝐀𝐃 ${i + 1}/${maxMedia.length} »\n\nAutor: ${data.title || 'Usuario de Instagram'}`;
             if (u.type === 'video') await client.sendMessage(m.chat, { video: { url: u.url }, caption: textCap }, { quoted: m });
             else await client.sendMessage(m.chat, { image: { url: u.url }, caption: textCap }, { quoted: m });
             await new Promise(r => setTimeout(r, 800));
          }
        } else {
          const media = data.urls[0];
          if (media.type === 'video') await client.sendMessage(m.chat, { video: { url: media.url }, caption, mimetype: 'video/mp4', fileName: 'ig.mp4' }, { quoted: m })
          else if (media.type === 'image') await client.sendMessage(m.chat, { image: { url: media.url }, caption }, { quoted: m })
        }
      } 
      else if (['tiktok', 'tt', 'tiktoksearch', 'ttsearch', 'tts'].includes(cmd)) {
        const isUrl = /(?:https:?\/{2})?(?:w{3}|vm|vt|t)?\.?tiktok.com\/([^\s&]+)/gi.test(text)
        const json = await getMedia('tiktok', text, { isUrl })
        if (!json || !json.status) return m.reply(' No se encontró contenido válido en TikTok.')
        if (isUrl) {
          const { title, duration, dl, author, stats, created_at, type } = json.data
          if (!dl || (Array.isArray(dl) && dl.length === 0)) return m.reply(' Enlace inválido o sin contenido descargable.')
          const caption = `ㅤ۟∩　ׅ　★ ໌　ׅ　🅣𝗂𝗄𝖳𝗈𝗄 🅓ownload　ׄᰙ\n\n` +
            `𖣣ֶㅤ֯⌗ ✎  ׄ ⬭ *Título:* ${title || 'Sin título'}\n` +
            `𖣣ֶㅤ֯⌗ ꕥ  ׄ ⬭ *Autor:* ${author?.nickname || author?.unique_id || 'Desconocido'}\n` +
            `𖣣ֶㅤ֯⌗ ⴵ  ׄ ⬭ *Duración:* ${duration || 'N/A'}\n` +
            `𖣣ֶㅤ֯⌗ ❖  ׄ ⬭ *Likes:* ${(stats?.likes || 0).toLocaleString()}\n` +
            `𖣣ֶㅤ֯⌗ ❀  ׄ ⬭ *Comentarios:* ${(stats?.comments || 0).toLocaleString()}\n` +
            `𖣣ֶㅤ֯⌗ ✿  ׄ ⬭ *Vistas:* ${(stats?.views || stats?.plays || 0).toLocaleString()}\n` +
            `𖣣ֶㅤ֯⌗ ☆  ׄ ⬭ *Compartidos:* ${(stats?.shares || 0).toLocaleString()}\n` +
            `𖣣ֶㅤ֯⌗ ☁︎  ׄ ⬭ *Fecha:* ${created_at || 'N/A'}`;
            
          if (type === 'image' || (Array.isArray(dl) && dl.length > 1 && typeof dl[0] === 'string' && dl[0].includes('.jpeg'))) {
            if (Array.isArray(dl) && dl.length === 1) await client.sendMessage(m.chat, { image: { url: dl[0] }, caption }, { quoted: m })
            else {
              const maxMedia = Array.isArray(dl) ? dl.slice(0, 10) : [dl];
              for (let i = 0; i < maxMedia.length; i++) {
                 const textCap = `ㅤ۟∩　ׅ　★ ໌　ׅ　🅣𝗂𝗄𝖳𝗈𝗄 🅓ownload ${i + 1}/${maxMedia.length}　ׄᰙ\n\n` +
                    `𖣣ֶㅤ֯⌗ ✎  ׄ ⬭ *Título:* ${title || 'Sin título'}\n` +
                    `𖣣ֶㅤ֯⌗ ꕥ  ׄ ⬭ *Autor:* ${author?.nickname || 'Desconocido'}`;
                 await client.sendMessage(m.chat, { image: { url: maxMedia[i] }, caption: textCap }, { quoted: m });
                 await new Promise(r => setTimeout(r, 800));
              }
            }
            try {
              const audioRes = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(text)}&hd=1`).then(r => r.json())
              if (audioRes?.data?.play) await client.sendMessage(m.chat, { audio: { url: audioRes.data.play }, mimetype: 'audio/mp4', fileName: 'tiktok_audio.mp4' }, { quoted: m })
            } catch (err) {
              console.error("[TikTok Audio Fallback Error]:", err.message)
            }
          } else {
            const videoUrl = Array.isArray(dl) ? dl[0] : dl;
            await client.sendMessage(m.chat, { video: { url: videoUrl }, caption }, { quoted: m })
          }
        } else {
          const validResults = json.data?.filter(v => v.dl && typeof v.dl === 'string' && v.dl.startsWith('http'))
          if (!validResults || validResults.length === 0) return m.reply(' No se encontraron resultados válidos.')
          
          const maxResults = validResults.slice(0, 4);
          for (let i = 0; i < maxResults.length; i++) {
             const v = maxResults[i];
             const caption = `ㅤ۟∩　ׅ　★ ໌　ׅ　🅣𝗂𝗄𝖳𝗈𝗄 🅢earch ${i + 1}/${maxResults.length}　ׄᰙ\n\n` +
                `𖣣ֶㅤ֯⌗ ✎  ׄ ⬭ *Título:* ${v.title || 'Sin título'}\n` +
                `𖣣ֶㅤ֯⌗ ꕥ  ׄ ⬭ *Autor:* ${v.author?.nickname || 'Desconocido'} ${v.author?.unique_id ? `@${v.author.unique_id}` : ''}\n` +
                `𖣣ֶㅤ֯⌗ ⴵ  ׄ ⬭ *Duración:* ${v.duration || 'N/A'}\n` +
                `𖣣ֶㅤ֯⌗ ❖  ׄ ⬭ *Likes:* ${(v.stats?.likes || 0).toLocaleString()}\n` +
                `𖣣ֶㅤ֯⌗ ❀  ׄ ⬭ *Comentarios:* ${(v.stats?.comments || 0).toLocaleString()}\n` +
                `𖣣ֶㅤ֯⌗ ✿  ׄ ⬭ *Vistas:* ${(v.stats?.views || 0).toLocaleString()}\n` +
                `𖣣ֶㅤ֯⌗ ☆  ׄ ⬭ *Compartidos:* ${(v.stats?.shares || 0).toLocaleString()}\n` +
                `𖣣ֶㅤ֯⌗ ❒  ׄ ⬭ *Audio:* ${v.music?.title || `Original sound - ${v.author?.unique_id || 'unknown'}`}`;
             await client.sendMessage(m.chat, { video: { url: v.dl }, caption }, { quoted: m });
             await new Promise(r => setTimeout(r, 800));
          }
        }
      }
      else if (['pinterest', 'pin'].includes(cmd)) {
        const isUrl = /^https?:\/\//.test(text)
        if (isUrl) {
          const data = await getMedia('pinterest', text, { isUrl: true })
          if (!data) return m.reply('No se pudo obtener el contenido.')
          const caption = `ㅤ۟∩　ׅ　★　ׅ　🅟𝖨𝖭 🅓ownload　ׄᰙ　\n\n` + 
              `${data.title ? `𖣣ֶㅤ֯⌗ ☆  ⬭ *Título* › ${data.title}\n` : ''}` + 
              `${data.description ? `𖣣ֶㅤ֯⌗ ☆  ⬭ *Descripción* › ${data.description}\n` : ''}` + 
              `${data.author || data.name ? `𖣣ֶㅤ֯⌗ ☆  ⬭ *Autor* › ${data.author || data.name}\n` : ''}` + 
              `${data.username ? `𖣣ֶㅤ֯⌗ ☆  ⬭ *Usuario* › ${data.username}\n` : ''}` + 
              `${data.followers ? `𖣣ֶㅤ֯⌗ ☆  ⬭ *Seguidores* › ${data.followers}\n` : ''}` + 
              `${data.uploadDate ? `𖣣ֶㅤ֯⌗ ☆  ⬭ *Fecha* › ${data.uploadDate}\n` : ''}` + 
              `${data.likes ? `𖣣ֶㅤ֯⌗ ☆  ⬭ *Likes* › ${data.likes}\n` : ''}` + 
              `${data.comments ? `𖣣ֶㅤ֯⌗ ☆  ⬭ *Comentarios* › ${data.comments}\n` : ''}` + 
              `${data.views ? `𖣣ֶㅤ֯⌗ ☆  ⬭ *Vistas* › ${data.views}\n` : ''}` + 
              `${data.saved ? `𖣣ֶㅤ֯⌗ ☆  ⬭ *Guardados* › ${data.saved}\n` : ''}` + 
              `${data.format ? `𖣣ֶㅤ֯⌗ ☆  ⬭ *Formato* › ${data.format}\n` : ''}` + 
              `𖣣ֶㅤ֯⌗ ☆  ⬭ *Enlace* › ${text}`;
          if (data.type === 'video') await client.sendMessage(m.chat, { video: { url: data.url }, caption, mimetype: 'video/mp4', fileName: 'pin.mp4' }, { quoted: m })
          else if (data.type === 'image') await client.sendMessage(m.chat, { image: { url: data.url }, caption }, { quoted: m })
          else throw new Error('Contenido no soportado.')
        } else {
          const results = await getMedia('pinterest', text, { isUrl: false })
          const normalizedResults = results.map(r => {
            let imgUrl = typeof r.image === 'string' ? r.image : (r.image?.url || r.url || r);
            return { ...r, image: typeof imgUrl === 'string' ? imgUrl : null };
          });
          const validResults = normalizedResults.filter(r => r.image && r.image.startsWith('http'));
          if (!validResults || validResults.length === 0) {
             console.error("[Pinterest Debug] Resultados inválidos:", results.slice(0, 2));
             return m.reply(` No se encontraron imágenes válidas para *${text}*.`)
          }
          
          // Enviar hasta 4 resultados para evitar spam
          const maxResults = validResults.slice(0, 4);
          for (let i = 0; i < maxResults.length; i++) {
             const r = maxResults[i];
             const caption = `ㅤ۟∩　ׅ　★　ׅ　🅟𝖨𝖭 🅢earch ${i + 1}/${maxResults.length}　ׄᰙ　\n\n` + 
                 `${r.title ? `𖣣ֶㅤ֯⌗ ☆  ⬭ *Título* › ${r.title}\n` : ''}` + 
                 `${r.description ? `𖣣ֶㅤ֯⌗ ☆  ⬭ *Descripción* › ${r.description}\n` : ''}` + 
                 `${r.name ? `𖣣ֶㅤ֯⌗ ☆  ⬭ *Autor* › ${r.name}\n` : ''}` + 
                 `${r.username ? `𖣣ֶㅤ֯⌗ ☆  ⬭ *Usuario* › ${r.username}\n` : ''}` + 
                 `${r.followers ? `𖣣ֶㅤ֯⌗ ☆  ⬭ *Seguidores* › ${r.followers}\n` : ''}` + 
                 `${r.likes ? `𖣣ֶㅤ֯⌗ ☆  ⬭ *Likes* › ${r.likes}\n` : ''}` + 
                 `${r.created_at ? `𖣣ֶㅤ֯⌗ ☆  ⬭ *Fecha* › ${r.created_at}` : ''}`;
             if (r.type === 'video') {
                 await client.sendMessage(m.chat, { video: { url: r.image }, caption }, { quoted: m });
             } else {
                 await client.sendMessage(m.chat, { image: { url: r.image }, caption }, { quoted: m });
             }
             await new Promise(resolve => setTimeout(resolve, 800)); // Pequeño delay
          }
        }
      }
      else if (['studocu', 'studoc'].includes(cmd)) {
        if (!text.match(/studocu\.com/)) return m.reply(' El enlace es invalido, envía un link de Studocu válido\n\nEjemplo: ' + usedPrefix + command + ' https://www.studocu.com/...')
        await m.reply(' Procesando documento, por favor espere...')
        const data = await getMedia('studocu', text)
        if (!data) return m.reply(' No se pudo obtener el documento. Esto puede deberse a un servidor caído o enlace inválido.')
        const caption = `« 𝐒𝐓𝐔𝐃𝐎𝐂𝐔 𝐃𝐎𝐖𝐍𝐋𝐎𝐀𝐃 \n\nTítulo: ${data.title || 'Documento Studocu'}`
        await client.sendMessage(m.chat, { document: { url: data.url }, caption, mimetype: 'application/pdf', fileName: `${data.title || 'studocu'}.pdf` }, { quoted: m })
      }

    } catch (e) {
      await m.reply(`> An unexpected error occurred while executing command *${usedPrefix + command}*. Please try again or contact support if the issue persists.\n[Error: *${e.message}*]`)
    }
  }
}
