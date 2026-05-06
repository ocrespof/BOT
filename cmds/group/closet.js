import { getGroupMeta, msParser, clockString } from '../../utils/tools.js';

export default {
  command: ['closet', 'close', 'cerrar'],
  category: 'grupo',
  desc: 'Cerrar el grupo.',
  isAdmin: true,
  botAdmin: true,
  run: async (client, m, args, usedPrefix, command) => {
    try {
      const timeout = args[0] ? msParser(args[0]) : 0
      if (args[0] && !timeout) {
        return client.reply(m.chat, 'Formato inválido. Usa por ejemplo: 10s, 5m, 2h, 1d', m)
      }
      const groupMetadata = await getGroupMeta(client, m.chat)
      if (groupMetadata.announce === true) {
        return client.reply(m.chat, `El grupo ya está cerrado.`, m)
      }
      const applyAction = async () => {
        await client.groupSettingUpdate(m.chat, 'announcement')
        return client.reply(m.chat, `✅ El grupo ha sido cerrado.`, m)
      }
      if (timeout > 0) {
        await client.reply(m.chat, `El grupo se cerrará en ${clockString(timeout)}.`, m)
        setTimeout(async () => {
          try {
            const md = await getGroupMeta(client, m.chat)
            if (md.announce === true) return
            await applyAction()
          } catch {}
        }, timeout)
      } else {
        await applyAction()
      }
    } catch (e) {
      return m.reply(`❌ Error al cerrar el grupo.\n[Error: *${e.message}*]`)
    }
  },
}