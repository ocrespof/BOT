import { getBotCurrency } from '../../utils/tools.js';

export default {
  command: ['economyboard', 'eboard', 'baltop'],
  category: 'economia',
  desc: 'Ranking de riqueza.',
  economy: true,
  run: async (client, m, args, usedPrefix, command) => {
    const monedas = getBotCurrency(client)
    try {
      const users = Object.entries(global.db.data.users || {}).filter(([_, data]) => {
        const total = (data.coins || 0) + (data.bank || 0)
        return total >= 1000
      }).map(([key, data]) => {
        const name = data.name || 'Usuario'
        return { ...data, jid: key, name }
      })
      if (users.length === 0) return m.reply(`No hay usuarios con más de 1,000 ${monedas}.`)
      const sorted = users.sort((a, b) => (b.coins || 0) + (b.bank || 0) - ((a.coins || 0) + (a.bank || 0)))
      const page = parseInt(args[0]) || 1
      const pageSize = 10
      const totalPages = Math.ceil(sorted.length / pageSize)
      if (isNaN(page) || page < 1 || page > totalPages) return m.reply(` La página *${page}* no existe. Hay *${totalPages}* páginas.`)
      const start = (page - 1) * pageSize
      let text = `*✩ EconomyBoard (✿◡‿◡)*\n\n`
      text += sorted.slice(start, start + pageSize).map(({ name, coins, bank }, i) => {
        const total = (coins || 0) + (bank || 0)
        return `✩ ${start + i + 1} › *${name}*\n     Total → *¥${total.toLocaleString()} ${monedas}*`
      }).join('\n')
      text += `\n\n⌦ Página *${page}* de *${totalPages}*`
      if (page < totalPages) text += `\nPara ver la siguiente página › *${usedPrefix + command} ${page + 1}*`
      await client.sendMessage(m.chat, { text }, { quoted: m })
    } catch (e) {
      await m.reply(`> An unexpected error occurred while executing command *${usedPrefix + command}*. Please try again or contact support if the issue persists.\n[Error: *${e.message}*]`)
    }
  }
}
