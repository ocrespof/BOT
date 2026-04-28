import { httpGet, httpPost, httpAxios as axios } from '../../utils/http.js'

export default {
  command: ['ssweb', 'ss'],
  category: ['tools'],
  run: async (client, m, args, usedPrefix, command) => {
    try {
      if (!args[0]) return m.reply(' Por favor, ingresa el enlace (URL) de una página.')
      
      let url = args[0]
      if (!url.startsWith('http')) url = 'https://' + url
      
      await m.react('🕒')
      const ss = await (await fetch(`https://image.thum.io/get/fullpage/${url}`, { timeout: 30000 })).buffer()
      
      if (!ss) throw new Error('No se pudo obtener la captura de pantalla.')
      
      await client.sendMessage(m.chat, { image: ss, caption: `*🌐 URL:* ${url}` }, { quoted: m })
      await m.react('✔️')
    } catch (error) {
      console.error(error)
      await m.react('✖️')
      return m.reply(`> Ocurrió un error inesperado al ejecutar el comando *${usedPrefix + command}*.\n[Error: *${error.message}*]`)
    }
  }
}