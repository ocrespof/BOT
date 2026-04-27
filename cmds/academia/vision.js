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
      
      const apis = [
        `https://api.siputzx.my.id/api/ai/gemini-image?prompt=${encodeURIComponent(prompt)}&url=${encodeURIComponent(imageUrl)}`,
        `${global.APIs.delirius.url}/ia/geminivision?text=${encodeURIComponent(prompt)}&url=${encodeURIComponent(imageUrl)}`,
        `${global.APIs.vreden.url}/api/v1/ai/gemini-image?prompt=${encodeURIComponent(prompt)}&url=${encodeURIComponent(imageUrl)}`
      ];

      let responseText = null;
      for (const endpoint of apis) {
        try {
          const res = await axios.get(endpoint, { timeout: 25000 });
          if (res.data?.status && res.data?.data) {
            responseText = res.data.data;
            break;
          } else if (res.data?.data) {
            responseText = res.data.data;
            break;
          } else if (res.data?.result) {
            responseText = res.data.result;
            break;
          } else if (res.data?.message) {
             responseText = res.data.message;
             break;
          }
        } catch (e) {
          continue;
        }
      }
      
      if (!responseText) {
          await m.react('✖️')
          return client.sendMessage(m.chat, { text: '《✧》 La Inteligencia Artificial no pudo analizar la imagen. Todos los servidores de visión parecen estar saturados momentáneamente.', edit: key })
      }
      
      await client.sendMessage(m.chat, { text: `┌───「 👁️ *VISIÓN IA* 👁️ 」───┐\n│ ❖ ${responseText.trim().replace(/\n/g, '\n│ ')}\n└─────────────────────────┘`, edit: key })
      await m.react('✔️')
    } catch (e) {
      await m.react('❌')
      await m.reply(`> No se pudo analizar contundentemente la estructura visual. Es posible que los servidores estén offiline.\n> [Error: ${e.message}]`)
    }
  }
}
