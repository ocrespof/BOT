import FormData from 'form-data';
import { getBotSettings, getBotId } from '../../utils/tools.js';
import axios from 'axios';

export default {
  command: ['setbanner', 'setbotbanner', 'setmenubanner'],
  category: 'owner',
  desc: 'Cambiar el banner que aparece en el menú.',
  isOwner: true,
  run: async (client, m, args, usedPrefix, command) => {
    const config = getBotSettings(client);
    
    const value = args.join(' ').trim()
    if (!value && !m.quoted && !m.message?.imageMessage && !m.message?.videoMessage)
      return m.reply('✎ Debes enviar o citar una imagen para cambiar el banner del bot.')
      
    if (value.startsWith('http')) {
      config.icon = value;
      return m.reply(`✿ Se ha actualizado el banner de *${config.botname || 'YukiBot'}*!`)
    }
    
    const q = m.quoted ? m.quoted : m.message?.imageMessage ? m : m
    const mime = (q.msg || q).mimetype || q.mediaType || ''
    
    if (!/image\/(png|jpe?g|gif)|video\/mp4/.test(mime))
      return m.reply('✎ Responde a una imagen válida.')
      
    try {
      await m.reply('⏳ *Subiendo imagen, espera un momento...*');
      
      let buffer;
      if (typeof q.download === 'function') {
        buffer = await q.download()
      } else {
        const { downloadContentFromMessage } = await import('@whiskeysockets/baileys')
        const msgContent = q.msg || q
        const type = mime.split('/')[0]
        const stream = await downloadContentFromMessage(msgContent, type)
        const chunks = []
        for await (const chunk of stream) chunks.push(chunk)
        buffer = Buffer.concat(chunks)
      }
      
      if (!buffer) return m.reply('No se pudo descargar la imagen.')
      
      const url = await uploadImage(buffer, mime)
      config.icon = url
      return m.reply(`✅ Se ha actualizado el banner de *${config.botname || 'YukiBot'}*!`)
    } catch (e) {
      return m.reply(`❌ Error al actualizar el banner: ${e.message}`)
    }
  },
};

async function uploadImage(buffer, mime) {
  const body = new FormData()
  body.append('files[]', buffer, `file.${mime.split('/')[1]}`)
  const res = await axios.post('https://uguu.se/upload.php', body, { headers: body.getHeaders() })
  return res.data.files?.[0]?.url
}
