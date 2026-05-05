import { formatTime, getBotCurrency } from '../../utils/tools.js';

export default {
  command: ['daily', 'diario'],
  category: 'economia',
  desc: 'Recompensa diaria.',
  economy: true,
  run: async (client, m, args, usedPrefix) => {
    const monedas = getBotCurrency(client)
    const user = global.db.data.users[m.sender]
    const now = Date.now()
    const oneDay = 24 * 60 * 60 * 1000
    const maxStreak = 200
    user.streak ??= 0
    user.lastDailyGlobal ??= 0
    user.coins ??= 0
    user.lastdaily ??= 0
    if (now < user.lastdaily) {
      return m.reply(`Ya has reclamado tu *Daily* de hoy.\nPuedes reclamarlo de nuevo en *${formatTime(user.lastdaily - now)}*`)
    }
    const lost = user.streak >= 1 && now - user.lastDailyGlobal > oneDay * 1.5
    if (lost) user.streak = 0
    const canClaimGlobal = now - user.lastDailyGlobal >= oneDay
    if (canClaimGlobal) {
      user.streak = Math.min(user.streak + 1, maxStreak)
      user.lastDailyGlobal = now
    }
    let recompensa = Math.min(20000 + (user.streak - 1) * 5000, 1015000)
    if (user.title === 'title_tycoon') recompensa = Math.floor(recompensa * 1.20); // Buff: Magnate
    user.coins += recompensa
    user.lastdaily = now + oneDay
    const siguiente = Math.min(20000 + user.streak * 5000, 1015000).toLocaleString()
    let msg = `> Día *${user.streak + 1}* *+¥${siguiente}*`
    if (lost) msg += `\n☆ ¡Has perdido tu racha de días!`
    await m.reply(`「✿」Has reclamado tu recompensa diaria de *¥${recompensa.toLocaleString()} ${monedas}*! (Día *${user.streak}*)\n${msg}`)
  },
}
