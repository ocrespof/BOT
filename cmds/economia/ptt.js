import { formatTime, getBotCurrency } from '../../utils/tools.js';

export default {
  command: ['ppt'],
  category: 'economia',
  economy: true,
  run: async (client, m, args, usedPrefix, command) => {
    const monedas = getBotCurrency(client)
    const botname = global.db.data.settings[client.user.id.split(':')[0] + '@s.whatsapp.net']?.namebot || 'Bot'
    const user = global.db.data.users[m.sender]
    user.lastppt ??= 0
    const remainingTime = user.lastppt - Date.now()
    if (remainingTime > 0) return m.reply(`Debes esperar *${formatTime(remainingTime)}* antes de jugar nuevamente.`)
    const options = ['piedra', 'papel', 'tijera']
    const userChoice = args[0]?.trim().toLowerCase()
    if (!options.includes(userChoice)) return m.reply(` Usa el comando así:\n› *${usedPrefix}ppt piedra*, *papel* o *tijera*`)
    const botChoice = options[Math.floor(Math.random() * options.length)]
    const win = (u, b) => { if (u === b) return 'tie'; if ((u === 'piedra' && b === 'tijera') || (u === 'papel' && b === 'piedra') || (u === 'tijera' && b === 'papel')) return 'win'; return 'lose' }
    const result = win(userChoice, botChoice)
    const reward = Math.floor(Math.random() * (5500 - 3000 + 1)) + 3000
    const loss = Math.floor(Math.random() * (3000 - 1000 + 1)) + 1000
    const tieReward = Math.floor(Math.random() * (1500 - 800 + 1)) + 800
    if (result === 'win') {
      user.coins = (user.coins || 0) + reward
      await client.sendMessage(m.chat, { text: `Ganaste.\n\n✿ *Tu elección ›* ${userChoice}\n✿ *${botname} eligió ›* ${botChoice}\n✿ *${monedas} ›* ¥${reward.toLocaleString()}` }, { quoted: m })
    } else if (result === 'lose') {
      const total = (user.coins || 0) + (user.bank || 0)
      const actualLoss = Math.min(loss, total)
      if ((user.coins || 0) >= actualLoss) { user.coins -= actualLoss } else { const r = actualLoss - (user.coins || 0); user.coins = 0; user.bank = Math.max(0, (user.bank || 0) - r) }
      await client.sendMessage(m.chat, { text: `Perdiste.\n\n✿ *Tu elección ›* ${userChoice}\n✿ *${botname} eligió ›* ${botChoice}\n✿ *${monedas} ›* -¥${actualLoss.toLocaleString()}` }, { quoted: m })
    } else {
      user.coins = (user.coins || 0) + tieReward
      await client.sendMessage(m.chat, { text: `Empate.\n\n✿ *Tu elección ›* ${userChoice}\n✿ *${botname} eligió ›* ${botChoice}\n✿ *${monedas} ›* +¥${tieReward.toLocaleString()}` }, { quoted: m })
    }
    user.lastppt = Date.now() + 1 * 60 * 1000
  },
}
