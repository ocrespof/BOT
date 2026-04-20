import { downloadContentFromMessage } from '@whiskeysockets/baileys'
import axios from 'axios'
import FormData from 'form-data'

export default {
  command: ['shazam', 'music'],
  category: 'utils',
  run: async (client, m, args, usedPrefix, command) => {
    const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage
    const mediaMessage = quoted?.audioMessage || quoted?.videoMessage
    if (!mediaMessage) return m.reply('《✧》 Por favor, responde a un *audio* o un *video corto* del que quieras reconocer la música.')
    
    try {
      await m.react('🕒')
      const type = quoted?.audioMessage ? 'audio' : 'video'
      const stream = await downloadContentFromMessage(mediaMessage, type)
      let buffer = Buffer.from([])
      for await(const chunk of stream) buffer = Buffer.concat([buffer, chunk])
      
      const form = new FormData()
      form.append('file', buffer, 'shazam.mp3')
      
      const apis = [
        `https://api.vreden.my.id/api/shazam`,
        `https://api.kirbotz.my.id/api/tools/shazam`
      ]
      
      let resData = null;
      for (const url of apis) {
         try {
             const send = await axios.post(url, form, { headers: form.getHeaders(), timeout: 15000 })
             if (send.data?.result || send.data?.metadata) { resData = send.data; break; }
         } catch(e) {}
      }

      if (!resData || !resData.result) return m.reply('《✧》 Traté de escuchar pero mi motor de reconocimiento no detectó ninguna canción en ese audio. 😔')
      
      const data = resData.result
      const texto = `ㅤ۟∩　ׅ　★　ׅ　🅢hazam 🅡ecognition　ׄᰙ　\n\n` +
      `𖣣ֶㅤ֯⌗ ☆  ׄ ⬭ *Canción* › ${data.title}\n` +
      `𖣣ֶㅤ֯⌗ ☆  ׄ ⬭ *Artista* › ${data.artists || 'Desconocido'}\n` +
      `𖣣ֶㅤ֯⌗ ☆  ׄ ⬭ *Álbum* › ${data.album || 'Desconocido'}\n` +
      `𖣣ֶㅤ֯⌗ ☆  ׄ ⬭ *Lanzamiento* › ${data.release_date || 'Desconocido'}`
      
      await client.reply(m.chat, texto, m)
      await m.react('✔️')
    } catch (e) {
      m.react('❌')
      await m.reply(`> An error occurred: *${e.message}*`)
    }
  }
}
