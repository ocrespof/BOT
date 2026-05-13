import { getGroupMeta, msParser, clockStringHuman } from '../../utils/tools.js';

export default {
  command: ['open', 'abrir'],
  category: 'grupo',
  desc: 'Abrir el grupo.',
  isAdmin: true,
  botAdmin: true,
  run: async (client, m, args, usedPrefix, command) => {
    try {
      const timeout = args[0] ? msParser(args[0]) : 0
      if (args[0] && !timeout) {
        return client.reply(m.chat, 'Formato inválido. Usa por ejemplo: 10s, 5m, 2h, 1d', m)
      }
      const groupMetadata = await getGroupMeta(client, m.chat)
      if (groupMetadata.announce === false) {
        return client.reply(m.chat, `El grupo ya está abierto.`, m)
      }
      const applyAction = async () => {
        await client.groupSettingUpdate(m.chat, 'not_announcement')
        return client.reply(m.chat, `✅ El grupo ha sido abierto.`, m)
      }
      if (timeout > 0) {
        await client.reply(m.chat, `El grupo se abrirá en ${clockStringHuman(timeout)}.`, m)
        setTimeout(async () => {
          try {
            const md = await getGroupMeta(client, m.chat)
            if (md.announce === false) return
            await applyAction()
          } catch {}
        }, timeout)
      } else {
        await applyAction()
      }
    } catch (e) {
      return m.reply(`❌ Error al abrir el grupo.\n[Error: *${e.message}*]`)
    }
  },
}