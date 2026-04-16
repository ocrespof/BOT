import { downloadContentFromMessage } from '@whiskeysockets/baileys'
import axios from 'axios'
import FormData from 'form-data'

export default {
  command: ['vision', 'vis'],
  category: 'academia',
  run: async (client, m, args, usedPrefix, command) => {
    const text = args.join(' ').trim()
    if (!text) return m.reply(`《✧》 Envía una pregunta junto con una imagen (respondiendo o adjuntando). Ej: *${usedPrefix + command} ¿Qué especie animal es esta?*`)
    const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage
    const imageMessage = quoted?.imageMessage || m.message?.imageMessage
    if (!imageMessage) return m.reply('《✧》 Por favor, responde o adjunta una *imagen* con tu pregunta.')
    
    try {
      await m.react('🕒')
      const stream = await downloadContentFromMessage(imageMessage, 'image')
      let buffer = Buffer.from([])
      for await(const chunk of stream) buffer = Buffer.concat([buffer, chunk])
      
      const form = new FormData()
      form.append('reqtype', 'fileupload')
      form.append('fileToUpload', buffer, 'image.jpg')
      const catbox = await axios.post('https://catbox.moe/user/api.php', form, { headers: form.getHeaders() })
      const imageUrl = catbox.data

      const prompt = `Actúa como un experto analista. Tu tarea primordial es evaluar la imagen y responder detalladamente y de buena manera a la petición que se te haga.\nPetición: ${text}`
      const urlApi = `https://api.siputzx.my.id/api/ai/gemini-image?prompt=${encodeURIComponent(prompt)}&url=${encodeURIComponent(imageUrl)}`
      const res = await axios.get(urlApi)
      
      if (!res.data.status || !res.data.data) return client.reply(m.chat, '《✧》 El servidor no pudo analizar visualmente la imagen proporcionada.', m)
      await client.reply(m.chat, res.data.data.trim(), m)
      await m.react('✔️')
    } catch (e) {
      m.react('❌')
      await m.reply(`> An unexpected error occurred while executing command *${usedPrefix + command}*. Please try again or contact support if the issue persists.\n> [Error: ${e.message}]`)
    }
  }
}
