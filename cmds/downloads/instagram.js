import fetch from 'node-fetch'

export default {
  command: ['instagram', 'ig'],
  category: 'downloader',
  run: async (client, m, args, usedPrefix, command) => {
    if (!args[0]) {
      return m.reply('《✧》 Por favor, ingrese un enlace de Instagram.')
    }
    if (!args[0].match(/instagram\.com\/(p|reel|share|tv|stories)\//)) {
      return m.reply('《✧》 El enlace no parece *válido*. Asegúrate de que sea de *Instagram*.')
    }
    try {
      const data = await getInstagramMedia(args[0])
      if (!data) return m.reply('《✧》 No se pudo obtener el contenido.')
      const caption =
        `ㅤ۟∩　ׅ　★ ໌　ׅ　🅘𝖦 🅓ownload　ׄᰙ\n\n` +
        `${data.title ? `𖣣ֶㅤ֯⌗ ❀  ⬭ *Usuario* › ${data.title}\n` : ''}` +
        `${data.caption ? `𖣣ֶㅤ֯⌗ ❀  ⬭ *Descripción* › ${data.caption}\n` : ''}` +
        `${data.like ? `𖣣ֶㅤ֯⌗ ❀  ⬭ *Likes* › ${data.like}\n` : ''}` +
        `${data.comment ? `𖣣ֶㅤ֯⌗ ❀  ⬭ *Comentarios* › ${data.comment}\n` : ''}` +
        `${data.views ? `𖣣ֶㅤ֯⌗ ❀  ⬭ *Vistas* › ${data.views}\n` : ''}` +
        `${data.duration ? `𖣣ֶㅤ֯⌗ ❀  ⬭ *Duración* › ${data.duration}\n` : ''}` +
        `${data.resolution ? `𖣣ֶㅤ֯⌗ ❀  ⬭ *Resolución* › ${data.resolution}\n` : ''}` +
        `${data.format ? `𖣣ֶㅤ֯⌗ ❀  ⬭ *Formato* › ${data.format}\n` : ''}` +
        `𖣣ֶㅤ֯⌗ ❀  ⬭ *Enlace* › ${args[0]}`
      if (data.type === 'video') {
        await client.sendMessage(m.chat, { video: { url: data.url }, caption, mimetype: 'video/mp4', fileName: 'ig.mp4' }, { quoted: m })
      } else if (data.type === 'image') {
        await client.sendMessage(m.chat, { image: { url: data.url }, caption }, { quoted: m })
      } else {
        throw new Error('Contenido no soportado.')
      }
    } catch (e) {
      await m.reply(`> An unexpected error occurred while executing command *${usedPrefix + command}*. Please try again or contact support if the issue persists.\n> [Error: *${e.message}*]`)
    }
  }
}

async function getInstagramMedia(url) {
  const apis = [
    { endpoint: `${global.APIs.stellar.url}/dl/instagram?url=${encodeURIComponent(url)}&key=${global.APIs.stellar.key}`, extractor: res => {
        if (!res.status || !Array.isArray(res.data) || !res.data.length) return null
        const media = res.data[0]
        if (!media?.url) return null
        return { type: media.tipo === 'video' ? 'video' : 'image', title: null, caption: null, resolution: null, format: media.tipo === 'video' ? 'mp4' : 'jpg', url: media.url }
      }
    },
    { endpoint: `${global.APIs.stellar.url}/dl/instagramv2?url=${encodeURIComponent(url)}&key=${global.APIs.stellar.key}`, extractor: res => {
        if (!res.status || !res.data?.url) return null
        const mediaUrl = res.data.mediaUrls?.[0] || res.data.url
        if (!mediaUrl) return null
        return { type: res.data.type === 'video' ? 'video' : 'image', title: res.data.username || null, caption: res.data.caption || null, resolution: null, format: res.data.type === 'video' ? 'mp4' : 'jpg', url: mediaUrl, thumbnail: res.data.thumbnail || null, duration: res.data.videoMeta?.duration ? `${Math.round(res.data.videoMeta.duration)}s` : null }
      }
    },
    { endpoint: `${global.APIs.nekolabs.url}/downloader/instagram?url=${encodeURIComponent(url)}`, extractor: res => {
        if (!res.success || !res.result?.downloadUrl?.length) return null
        const mediaUrl = res.result.downloadUrl[0]
        if (!mediaUrl) return null
        return { type: res.result.metadata?.isVideo ? 'video' : 'image', title: res.result.metadata?.username || null, caption: res.result.metadata?.caption || null, like: res.result.metadata?.like || null, comment: res.result.metadata?.comment || null, resolution: null, format: res.result.metadata?.isVideo ? 'mp4' : 'jpg', url: mediaUrl }
      }
    },
    { endpoint: `${global.APIs.delirius.url}/download/instagram?url=${encodeURIComponent(url)}`, extractor: res => {
        if (!res.status || !Array.isArray(res.data) || !res.data.length) return null
        const media = res.data[0]
        if (!media?.url) return null
        return { type: media.type === 'video' ? 'video' : 'image', title: null, caption: null, resolution: null, format: media.type === 'video' ? 'mp4' : 'jpg', url: media.url }
      }
    },
    { endpoint: `${global.APIs.ootaizumi.url}/downloader/instagram/v2?url=${encodeURIComponent(url)}`, extractor: res => {
        if (!res.status || !res.result?.url?.length) return null
        const media = res.result.url[0]
        if (!media?.url) return null
        return { type: media.type === 'mp4' ? 'video' : 'image', title: res.result.meta?.username || null, caption: res.result.meta?.title || null, like: res.result.meta?.like_count || null, comment: res.result.meta?.comment_count || null, resolution: null, format: media.ext || null, url: media.url, thumbnail: res.result.thumb || null }
      }
    },
    { endpoint: `${global.APIs.ootaizumi.url}/downloader/instagram/v1?url=${encodeURIComponent(url)}`, extractor: res => {
        if (!res.status || !res.result?.media?.length) return null
        const media = res.result.media[0]
        if (!media?.url) return null
        return { type: media.isVideo ? 'video' : 'image', title: res.result.metadata?.author || null, caption: null, like: res.result.metadata?.like || null, views: res.result.metadata?.views || null, duration: res.result.metadata?.duration ? `${Math.round(res.result.metadata.duration)}s` : null, resolution: null, format: media.isVideo ? 'mp4' : 'jpg', url: media.url, thumbnail: res.result.ppc || null }
      }
    }
  ]

  for (const { endpoint, extractor } of apis) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 10000)
      const res = await fetch(endpoint, { signal: controller.signal }).then(r => r.json())
      clearTimeout(timeout)
      const result = extractor(res)
      if (result) return result
    } catch {}
    await new Promise(r => setTimeout(r, 500))
  }
  return null
}
