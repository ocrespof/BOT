import { getBotSettings } from '../../utils/tools.js';

export default {
  command: ['bot'],
  category: 'grupo',
  desc: 'Activar/desactivar bot.',
  isAdmin: true,
  run: async (client, m, args) => {
    const chat = global.db.data.chats[m.chat]
    const estado = chat.isBanned ?? false
    const botname = getBotSettings(client)?.namebot || 'Bot'

    if (args[0] === 'off') {
      if (estado) return m.reply(' El *Bot* ya estaba *desactivado* en este grupo.')
      chat.isBanned = true
      return m.reply(` Has *Desactivado* a *${botname}* en este grupo.`)
    }

    if (args[0] === 'on') {
      if (!estado) return m.reply(` *${botname}* ya estaba *activado* en este grupo.`)
      chat.isBanned = false
      return m.reply(` Has *Activado* a *${botname}* en este grupo.`)
    }

    return m.reply(`*✿ Estado de ${botname} (｡•́‿•̀｡)*\n✐ *Actual ›* ${estado ? '✗ Desactivado' : '✓ Activado'}\n\nPuedes cambiarlo con:\n● _Activar ›_ *bot on*\n● _Desactivar ›_ *bot off*`)
  },
};
