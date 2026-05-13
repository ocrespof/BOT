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
      // Use the shimmed download function from message.js (handles all message types)
      if (m.quoted && typeof m.quoted.download === 'function') {
        img = await m.quoted.download()
      } else if (typeof m.download === 'function') {
        img = await m.download()
      }
      
      // Fallback: direct download from msg content
      if (!img || !Buffer.isBuffer(img)) {
        const { downloadContentFromMessage } = await import('@whiskeysockets/baileys')
        const msgContent = q.msg || q
        const type = /image/.test(mime) ? 'image' : /video/.test(mime) ? 'video' : 'document'
        const stream = await downloadContentFromMessage(msgContent, type)
        const chunks = []
        for await (const chunk of stream) chunks.push(chunk)
        img = Buffer.concat(chunks)
      }
      
      if (!img || !Buffer.isBuffer(img) || img.length < 1000) 
        return m.reply('❌ No se pudo descargar la imagen. Intenta enviarla de nuevo directamente (no reenviada).')
      
      await client.updateProfilePicture(m.chat, img)
      m.reply('✅ La imagen del grupo se actualizó con éxito.')
    } catch (e) {
      const msg = e.message || ''
      if (msg.includes('not-authorized')) {
        return m.reply('❌ El bot no tiene permisos de administrador para cambiar la portada.')
      }
      if (msg.includes('media-too-large') || msg.includes('too large')) {
        return m.reply('❌ La imagen es demasiado grande. Intenta con una imagen más pequeña.')
      }
      return m.reply(`❌ Error al actualizar la portada.\n[Error: *${msg}*]\n\n_Tip: Envía la imagen directamente (no como archivo/documento)._`)
    }
  },
};
