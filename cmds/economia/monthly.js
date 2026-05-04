import { formatTime, getBotCurrency } from '../../utils/tools.js';

export default {
  command: ['monthly', 'mensual'],
  category: 'economia',
  desc: 'Recompensa mensual.',
  economy: true,
  run: async (client, m, args, usedPrefix) => {
    const monedas = getBotCurrency(client)
    const user = global.db.data.users[m.sender]
    const gap = 2592000000
    const now = Date.now()
    user.monthlyStreak ??= 0
    user.lastMonthlyGlobal ??= 0
    user.coins ??= 0
    user.lastmonthly ??= 0
    if (now < user.lastmonthly) {
      return m.reply(`Ya has reclamado tu recompensa mensual.\nPuedes reclamarlo de nuevo en *${formatTime(user.lastmonthly - now)}*`)
    }
    const lost = user.monthlyStreak >= 1 && now - user.lastMonthlyGlobal > gap * 1.5
    if (lost) user.monthlyStreak = 0
    const canClaimGlobal = now - user.lastMonthlyGlobal >= gap
    if (canClaimGlobal) {
      user.monthlyStreak = Math.min(user.monthlyStreak + 1, 8)
      user.lastMonthlyGlobal = now
    }
    const coins = Math.min(60000 + (user.monthlyStreak - 1) * 5000, 95000)
    user.coins += coins
    user.lastmonthly = now + gap
    let next = Math.min(60000 + user.monthlyStreak * 5000, 95000).toLocaleString()
    let msg = `> Mes *${user.monthlyStreak + 1}* *+${next}*`
    if (lost) msg += `\n☆ ¡Has perdido tu racha de meses!`
    await m.reply(`「❁」 Has reclamado tu recompensa mensual de *+${coins.toLocaleString()} ${monedas}* (Mes *${user.monthlyStreak}*)\n${msg}`)
  }
}
