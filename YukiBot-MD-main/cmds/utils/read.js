import { downloadContentFromMessage, extractMessageContent } from '@whiskeysockets/baileys'

export default {
  command: ['readviewonce', 'read', 'readvo'],
  category: 'tools',
  run: async (client, m, args, usedPrefix, command, text) => {
    const quoted = m.quoted
    if (!quoted) return m.reply( '《✧》 Por favor, responde a un mensaje "ViewOnce" para ver su contenido.')
    try {
      await m.react('🕒')
      const content = extractMessageContent(quoted.message || quoted)
      if (!content) return m.reply('《✧》 No se pudo extraer el contenido.')
      const messageType = Object.keys(content)[0]
      const mediaMessage = content[messageType]
      const stream = await downloadContentFromMessage(
        mediaMessage,
        messageType.replace('Message', '').toLowerCase()
      )
      if (!stream) return m.reply('《✧》 No se pudo descargar el contenido.')
      const chunks = []
      for await (const chunk of stream) {
        chunks.push(chunk)
      }
      const buffer = Buffer.concat(chunks)
      if (/video/i.test(messageType)) {
        await client.sendMessage(m.chat, { video: buffer, caption: mediaMessage.caption || '', mimetype: 'video/mp4' }, { quoted: m })
      } else if (/image/i.test(messageType)) {
        await client.sendMessage(m.chat, { image: buffer, caption: mediaMessage.caption || '' }, { quoted: m })
      } else if (/audio/i.test(messageType)) {
        await client.sendMessage(m.chat, { audio: buffer, mimetype: 'audio/ogg; codecs=opus', ptt: mediaMessage.ptt || false }, { quoted: m })
      }
      await m.react('✔️')
    } catch (e) {
      await m.react('✖️')
      await m.reply(`> Ocurrió un error al procesar el archivo o la descarga falló por el peso.\n> [Error: *${e.message}*]`)
    }
  }
}