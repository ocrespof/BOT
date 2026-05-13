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
      return m.reply('《✧》 Te faltó la imagen para cambiar el perfil del grupo.')
      
    try {
      let img;
      if (typeof q.download === 'function') {
        img = await q.download()
      } else {
        const { downloadContentFromMessage } = await import('@whiskeysockets/baileys')
        const msgContent = q.msg || q
        const stream = await downloadContentFromMessage(msgContent, 'image')
        const chunks = []
        for await (const chunk of stream) chunks.push(chunk)
        img = Buffer.concat(chunks)
      }
      
      if (!img) return m.reply('《✧》 No se pudo descargar la imagen.')
      
      await client.updateProfilePicture(m.chat, img)
      m.reply('✿ La imagen del grupo se actualizó con éxito.')
    } catch (e) {
      if (e.message.includes('No image processing library available')) {
         return m.reply('❌ *ERROR CRÍTICO:* Falta la librería para procesar imágenes.\nPor favor apaga el bot y ejecuta en la terminal:\n\n`npm install jimp@0.16.1`')
      }
      if (e.message.includes('not-authorized')) {
        return m.reply('❌ El bot no tiene permisos de administrador reales para cambiar la portada (aunque WhatsApp diga que sí).')
      }
      return m.reply(`> An unexpected error occurred while executing command *${usedPrefix + command}*. Please try again or contact support if the issue persists.\n> [Error: *${e.message}*]`)
    }
  },
};
