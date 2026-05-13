import { getBotSettings } from '../../utils/tools.js';
import axios from 'axios';
import FormData from 'form-data';

function generateUniqueFilename(mime) {
  const ext = mime.split("/")[1] || "bin"
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  let id = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
  return `${id}.${ext}`
}

async function uploadCatbox(buffer, mime) {
  const form = new FormData()
  form.append("reqtype", "fileupload")
  form.append("userhash", "c9bc208e83a7dbc7c7cc68aff")
  form.append("fileToUpload", buffer, { filename: generateUniqueFilename(mime) })
  const res = await axios.post("https://catbox.moe/user/api.php", form, { headers: form.getHeaders(), maxContentLength: Infinity, maxBodyLength: Infinity })
  if (typeof res.data !== "string" || !res.data.startsWith("https://")) {
    throw new Error("Respuesta inválida de Catbox")
  }
  return res.data
}

export default {
  command: ['setbotbanner', 'setmenubanner', 'setbotpic'],
  category: 'owner',
  desc: 'Cambiar la imagen que aparece en el menú (.help).',
  isOwner: true,
  run: async (client, m, args, usedPrefix, command) => {
    const q = m.quoted ? m.quoted : m
    const mime = (q.msg || q).mimetype || q.mediaType || ''
    
    // Check if the user passed a URL directly
    if (args[0] && args[0].startsWith('http')) {
      const botSettings = getBotSettings(client);
      botSettings.icon = args[0];
      return m.reply('✅ La imagen del menú se actualizó con éxito (URL).');
    }

    if (!/image/.test(mime))
      return m.reply('❌ Envía o cita una imagen, o pasa una URL directa para cambiar la portada del menú.')
    
    try {
      await m.reply('⏳ *Subiendo imagen, espera un momento...*');
      let img
      if (m.quoted && typeof m.quoted.download === 'function') {
        img = await m.quoted.download()
      } else if (typeof m.download === 'function') {
        img = await m.download()
      }
      
      if (!img || !Buffer.isBuffer(img)) {
        const { downloadContentFromMessage } = await import('@whiskeysockets/baileys')
        const msgContent = q.msg || q
        const type = 'image'
        const stream = await downloadContentFromMessage(msgContent, type)
        const chunks = []
        for await (const chunk of stream) chunks.push(chunk)
        img = Buffer.concat(chunks)
      }
      
      if (!img || !Buffer.isBuffer(img) || img.length < 1000) 
        return m.reply('❌ No se pudo descargar la imagen. Intenta enviarla de nuevo directamente.')
      
      const url = await uploadCatbox(img, mime);
      
      const botSettings = getBotSettings(client);
      botSettings.icon = url;
      
      m.reply(`✅ La imagen del menú se actualizó con éxito a:\n${url}`);
    } catch (e) {
      return m.reply(`❌ Error al actualizar la portada.\n[Error: *${e.message}*]`)
    }
  },
};
