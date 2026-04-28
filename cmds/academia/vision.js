import { downloadContentFromMessage } from '@whiskeysockets/baileys'
import axios from 'axios'
import FormData from 'form-data'
import { getVisionResponse } from '../../src/ai/client.js'

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
      const { key } = await client.sendMessage(m.chat, { text: `ꕥ *Enviando imagen al servidor analítico...*` }, { quoted: m })
      
      const stream = await downloadContentFromMessage(imageMessage, 'image')
      let buffer = Buffer.from([])
      for await(const chunk of stream) buffer = Buffer.concat([buffer, chunk])
      
      const form = new FormData()
      form.append('reqtype', 'fileupload')
      form.append('fileToUpload', buffer, 'image.jpg')
      
      let imageUrl;
      try {
          const catbox = await axios.post('https://catbox.moe/user/api.php', form, { headers: form.getHeaders(), timeout: 20000 })
          imageUrl = catbox.data
      } catch (uploadError) {
          await m.react('✖️')
          return client.sendMessage(m.chat, { text: `> ⚠️ **Error de red:** No se pudo subir la imagen temporalmente para ser analizada por la IA. Inténtalo más tarde.`, edit: key })
      }

      const prompt = `Actúa como un experto analista de imágenes. Tu tarea primordial es evaluar la imagen provista y responder estrictamente a la petición de manera informativa y clara.\nPetición: ${text}`
      await client.sendMessage(m.chat, { text: `ꕥ *Analizando visualmente la imagen...*` }, { edit: key })
      
      let responseText = null;
      try {
        responseText = await getVisionResponse({ prompt, imageUrl });
      } catch (err) {
        await m.react('✖️')
        return client.sendMessage(m.chat, { text: `《✧》 ${err.message}`, edit: key })
      }
      
      await client.sendMessage(m.chat, { text: `┌───「 👁️ *VISIÓN IA* 👁️ 」───┐\n│ ❖ ${responseText.trim().replace(/\n/g, '\n│ ')}\n└─────────────────────────┘`, edit: key })
      await m.react('✔️')
    } catch (e) {
      await m.react('❌')
      await m.reply(`> No se pudo analizar contundentemente la estructura visual. Es posible que los servidores estén offline.\n> [Error: ${e.message}]`)
    }
  }
}
