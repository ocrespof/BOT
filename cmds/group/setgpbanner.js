import { downloadMediaMessage } from '@whiskeysockets/baileys';

export default {
  command: ['setgpbanner', 'setgppic', 'setgpfoto'],
  category: 'grupo',
  desc: 'Cambiar portada del grupo.',
  isAdmin: true,
  botAdmin: true,
  run: async (client, m, args, usedPrefix, command) => {
    const q = m.quoted ? m.quoted : m
    const mime = (q.msg || q).mimetype || q.mediaType || ''
    if (!/image/.test(mime))
      return m.reply('❌ Envía o cita una imagen para cambiar la portada del grupo.')
    try {
      let img
      // Intentar múltiples métodos de descarga
      if (typeof q.download === 'function') {
        img = await q.download()
      }
      if (!img || !Buffer.isBuffer(img)) {
        img = await downloadMediaMessage(q, 'buffer', {})
      }
      if (!img || !Buffer.isBuffer(img)) return m.reply('❌ No se pudo descargar la imagen. Intenta enviarla de nuevo.')
      
      await client.updateProfilePicture(m.chat, img)
      m.reply('✅ La imagen del grupo se actualizó con éxito.')
    } catch (e) {
      return m.reply(`❌ Error al actualizar la portada.\n[Error: *${e.message}*]`)
    }
  },
};
