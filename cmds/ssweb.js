import { httpGet, httpPost, httpAxios as axios } from '../../utils/http.js'

export default {
  command: ['ssweb', 'ss'],
  category: ['tools'],
  run: async (client, m, args, usedPrefix, command) => {
    try {
      if (!args[0]) return m.reply(`> 🌐 Por favor, ingresa el enlace (URL) de una página.\n> *Ejemplo:* ${usedPrefix + command} https://google.com`)

      let url = args[0]
      if (!/^https?:\/\//i.test(url)) url = 'https://' + url

      let domain = url
      try {
        domain = new URL(url).hostname
      } catch (e) {
        return m.reply('> ❌ URL inválida. Verifica el enlace e intenta nuevamente.')
      }

      await m.react('🕒')

      const encUrl = encodeURIComponent(url)

      // Lista de APIs de respaldo (fallbacks) ordenadas por calidad y fiabilidad
      const apis = [
        { name: 'Microlink', url: `https://api.microlink.io?url=${encUrl}&screenshot=true&meta=false&embed=screenshot.url` },
        { name: 'MShots', url: `https://s0.wp.com/mshots/v1/${encUrl}?w=1920&h=1080` },
        { name: 'Thum.io', url: `https://image.thum.io/get/fullpage/${url}` }
      ]

      let ss = null
      let usedApi = ''

      for (const api of apis) {
        try {
          const response = await axios.get(api.url, { responseType: 'arraybuffer', timeout: 25000 })
          
          // Verificar que es un buffer válido y mayor a 5KB 
          // (evita imágenes "Generating..." de WordPress y errores)
          if (response.status === 200 && response.data && response.data.length > 5000) {
             ss = Buffer.from(response.data)
             usedApi = api.name
             break // Si la API funcionó, salir del bucle
          }
        } catch (error) {
          console.log(`[ssweb] Falló la API ${api.name} para ${url}: ${error.message}`)
          continue // Si falla, intenta con la siguiente API en la lista
        }
      }

      if (!ss) throw new Error('Todas las APIs fallaron al intentar obtener la captura.')

      const caption = `*📸 CAPTURA WEB*\n\n` +
                      `> *🌐 Dominio:* ${domain}\n` +
                      `> *🔗 URL:* ${url}\n` +
                      `> *⚙️ API Usada:* ${usedApi}\n\n` +
                      `_Generado por YukiBot_`

      await client.sendMessage(m.chat, { image: ss, caption }, { quoted: m })
      await m.react('✔️')
    } catch (error) {
      console.error(error)
      await m.react('✖️')
      return m.reply(`> ❌ Ocurrió un error inesperado al ejecutar el comando.\n> *Detalle:* ${error.message}`)
    }
  }
}