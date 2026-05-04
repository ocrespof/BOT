import { formatTime, getBotCurrency } from '../../utils/tools.js';

export default {
  command: ['weekly', 'semanal'],
  category: 'economia',
  economy: true,
  run: async (client, m, args, usedPrefix) => {
    const monedas = getBotCurrency(client)
    const user = global.db.data.users[m.sender]
    const gap = 604800000
    const now = Date.now()
    user.weeklyStreak ??= 0
    user.lastWeeklyGlobal ??= 0
    user.coins ??= 0
    user.lastweekly ??= 0
    if (now < user.lastweekly) {
      return m.reply(`Ya has reclamado tu recompensa semanal.\nPuedes reclamarlo de nuevo en *${formatTime(user.lastweekly - now)}*`)
    }
    const lost = user.weeklyStreak >= 1 && now - user.lastWeeklyGlobal > gap * 1.5
    if (lost) user.weeklyStreak = 0
    const canClaimWeeklyGlobal = now - user.lastWeeklyGlobal >= gap
    if (canClaimWeeklyGlobal) {
      user.weeklyStreak = Math.min(user.weeklyStreak + 1, 30)
      user.lastWeeklyGlobal = now
    }
    const coins = Math.min(40000 + (user.weeklyStreak - 1) * 5000, 185000)
    user.coins += coins
    user.lastweekly = now + gap
    let nextReward = Math.min(40000 + user.weeklyStreak * 5000, 185000).toLocaleString()
    let msg = `> Semana *${user.weeklyStreak + 1}* *+¥${nextReward}*`
    if (lost) msg += `\n☆ ¡Has perdido tu racha de semanas!`
    await m.reply(`「❁」 Has reclamado tu recompensa semanal de *¥${coins.toLocaleString()} ${monedas}* (Semana *${user.weeklyStreak}*)\n${msg}`)
  }
}
