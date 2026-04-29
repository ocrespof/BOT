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
        const caption = `« 𝐅𝐁 𝐃𝐎𝐖𝐍𝐋𝐎𝐀𝐃 \n\nTítulo: ${data.title || 'Video de Facebook'}\nDuración: ${data.duration || 'N/A'}`
        if (data.type === 'video') await client.sendMessage(m.chat, { video: { url: data.url }, caption, mimetype: 'video/mp4', fileName: 'fb.mp4' }, { quoted: m })
        else if (data.type === 'image') await client.sendMessage(m.chat, { image: { url: data.url }, caption }, { quoted: m })
        else throw new Error('Contenido no soportado.')
      } 
      else if (['ig', 'instagram'].includes(cmd)) {
        if (!text.match(/instagram\.com\/(p|reel|share|tv|stories)\//)) return m.reply(' El enlace no parece *válido*. Asegúrate de que sea de *Instagram*.')
        const data = await getMedia('instagram', text)
        if (!data || !data.urls || !data.urls.length) return m.reply(' No se pudo obtener el contenido.')
        const caption = `« 𝐈𝐆 𝐃𝐎𝐖𝐍𝐋𝐎𝐀𝐃 \n\nAutor: ${data.title || 'Usuario de Instagram'}`
        
        if (data.isCarousel || data.urls.length > 1) {
          const medias = data.urls.map(u => ({ type: u.type, data: { url: u.url }, caption }));
          await client.sendAlbumMessage(m.chat, medias, { quoted: m });
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
          const caption = `« 𝐓𝐈𝐊𝐓𝐎𝐊 𝐃𝐎𝐖𝐍𝐋𝐎𝐀𝐃 \n\nTítulo: ${title || 'Video'}\nAutor: ${author?.nickname || 'Desconocido'}\nLikes: ${(stats?.likes || 0).toLocaleString()}`
          if (type === 'image') {
            if (dl.length === 1) await client.sendMessage(m.chat, { image: { url: dl[0] }, caption }, { quoted: m })
            else {
              const medias = dl.map(url => ({ type: 'image', data: { url }, caption }))
              await client.sendAlbumMessage(m.chat, medias, { quoted: m })
            }
            try {
              const audioRes = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(text)}&hd=1`).then(r => r.json())
              if (audioRes?.data?.play) await client.sendMessage(m.chat, { audio: { url: audioRes.data.play }, mimetype: 'audio/mp4', fileName: 'tiktok_audio.mp4' }, { quoted: m })
            } catch (err) {
              console.error("[TikTok Audio Fallback Error]:", err.message)
            }
          } else {
            await client.sendMessage(m.chat, { video: { url: Array.isArray(dl) ? dl[0] : dl }, caption }, { quoted: m })
          }
        } else {
          const validResults = json.data?.filter(v => v.dl)
          if (!validResults || validResults.length < 2) return m.reply(' Se requieren al menos 2 resultados válidos con contenido.')
          const medias = validResults.filter(v => typeof v.dl === 'string' && v.dl.startsWith('http')).map(v => {
            const caption = `« 𝐓𝐈𝐊𝐓𝐎𝐊 𝐃𝐎𝐖𝐍𝐋𝐎𝐀𝐃 \n\nTítulo: ${v.title || 'Video'}\nAutor: ${v.author?.nickname || 'Desconocido'}`
            return { type: 'video', data: { url: v.dl }, caption }
          }).slice(0, 10)
          await client.sendAlbumMessage(m.chat, medias, { quoted: m })
        }
      }
      else if (['pinterest', 'pin'].includes(cmd)) {
        const isUrl = /^https?:\/\//.test(text)
        if (isUrl) {
          const data = await getMedia('pinterest', text, { isUrl: true })
          if (!data) return m.reply('No se pudo obtener el contenido.')
          const caption = `« 𝐏𝐈𝐍 𝐃𝐎𝐖𝐍𝐋𝐎𝐀𝐃 \n\nTítulo: ${data.title || 'Pinterest'}\nAutor: ${data.author || 'N/A'}`
          if (data.type === 'video') await client.sendMessage(m.chat, { video: { url: data.url }, caption, mimetype: 'video/mp4', fileName: 'pin.mp4' }, { quoted: m })
          else if (data.type === 'image') await client.sendMessage(m.chat, { image: { url: data.url }, caption }, { quoted: m })
          else throw new Error('Contenido no soportado.')
        } else {
          const results = await getMedia('pinterest', text, { isUrl: false })
          if (!results || results.length === 0) return m.reply(` No se encontraron resultados para *${text}*.`)
          const medias = results.slice(0, 10).map(r => ({ type: r.type === 'video' ? 'video' : 'image', data: { url: r.image }, caption: `« 𝐏𝐈𝐍 𝐒𝐄𝐀𝐑𝐂𝐇 \n\nTítulo: ${r.title || 'Pinterest'}\nAutor: ${r.name || 'N/A'}` }))
          await client.sendAlbumMessage(m.chat, medias, { quoted: m })
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
