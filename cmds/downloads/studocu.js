import fetch from 'node-fetch'

export default {
  command: ['studocu', 'studoc'],
  category: 'downloader',
  run: async (client, m, args, usedPrefix, command) => {
    if (!args[0]) {
      return m.reply('《✧》 Por favor, Ingrese un enlace de Studocu.')
    }
    if (!args[0].match(/studocu\.com/)) {
      return m.reply('《✧》 El enlace es invalido, envía un link de Studocu válido\n\nEjemplo: ' + usedPrefix + command + ' https://www.studocu.com/...')
    }
    
    await m.reply('《✧》 Procesando documento, por favor espere...')
    
    try {
      const data = await getStudocuMedia(args[0])
      if (!data) return m.reply('《✧》 No se pudo obtener el documento. Esto puede deberse a un servidor caído o enlace inválido.')
      
      const caption =
        `ㅤ۟∩　ׅ　★　ׅ　🅢tudocu 🅓ownload　ׄᰙ　\n\n` +
        `𖣣ֶㅤ֯⌗ ☆  ׄ ⬭ *Titulo* › ${data.title || 'Documento Studocu'}\n` +
        `𖣣ֶㅤ֯⌗ ☆  ׄ ⬭ *Enlace* › ${args[0]}`

      await client.sendMessage(m.chat, { document: { url: data.url }, caption, mimetype: 'application/pdf', fileName: `${data.title || 'studocu'}.pdf` }, { quoted: m })
      
    } catch (e) {
      await m.reply(`> An unexpected error occurred while executing command *${usedPrefix + command}*. Please try again or contact support if the issue persists.\n> [Error: *${e.message}*]`)
    }
  }
}

async function getStudocuMedia(url) {
  const customHeaders = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  }

  const apis = [
    { endpoint: `https://api.ryzendesu.vip/api/downloader/studocu?url=${encodeURIComponent(url)}`, extractor: res => {
        if (!res.success && !res.url) return null
        return { title: res.title || res.data?.title || 'Documento', url: res.url || res.data?.url || res.download }
      }
    },
    { endpoint: `${global.APIs.vreden.url}/api/studocu?url=${encodeURIComponent(url)}`, extractor: res => {
        if (!res.status || !res.result?.url) return null
        return { title: res.result.title || null, url: res.result.url }
      }
    },
    { endpoint: `https://api.siputzx.my.id/api/d/studocu?url=${encodeURIComponent(url)}`, extractor: res => {
        if (!res.status || !res.data) return null
        return { title: res.data?.title || null, url: res.data?.url || res.data }
      }
    },
    { endpoint: `https://api.agatz.xyz/api/studocu?url=${encodeURIComponent(url)}`, extractor: res => {
        if (!res.status || !res.data) return null
        return { title: null, url: res.data }
      }
    }
  ]

  for (const { endpoint, extractor } of apis) {
    try {
      const res = await fetch(endpoint, { headers: customHeaders }).then(r => r.json())
      const result = extractor(res)
      if (result && result.url) return result
    } catch {}
    await new Promise(r => setTimeout(r, 500))
  }
  return null
}
