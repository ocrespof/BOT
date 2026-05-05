import { formatTime, getBotCurrency } from '../../utils/tools.js';

export default {
  command: ['infoeconomy', 'cooldowns', 'economyinfo', 'einfo'],
  category: 'economia',
  desc: 'Info de la economía del grupo.',
  economy: true,
  run: async (client, m, args, usedPrefix) => {
    const user = global.db.data.users[m.sender]
    const currency = getBotCurrency(client)
    const now = Date.now()
    const oneDay = 24 * 60 * 60 * 1000
    const cooldowns = {
      crime: Math.max(0, (user.lastcrime || 0) - now),
      mine: Math.max(0, (user.lastmine || 0) - now),
      ritual: Math.max(0, (user.lastinvoke || 0) - now),
      work: Math.max(0, (user.lastwork || 0) - now),
      slut: Math.max(0, (user.lastslut || 0) - now),
      steal: Math.max(0, (user.laststeal || 0) - now),
      daily: Math.max(0, (user.lastdaily || 0) - now),
      weekly: Math.max(0, (user.lastweekly || 0) - now),
      monthly: Math.max(0, (user.lastmonthly || 0) - now)
    }
    const coins = user.coins || 0
    const name = user.name || m.sender.split('@')[0]
    const mensaje = `✿ Usuario \`<${name}>\`

Work *${formatTime(cooldowns.work)}*
Slut *${formatTime(cooldowns.slut)}*
Crime *${formatTime(cooldowns.crime)}*
Mine *${formatTime(cooldowns.mine)}*
Ritual *${formatTime(cooldowns.ritual)}*
Steal *${formatTime(cooldowns.steal)}*
Daily *${formatTime(cooldowns.daily)}*
Weekly *${formatTime(cooldowns.weekly)}*
Monthly *${formatTime(cooldowns.monthly)}*

Coins totales ¥${coins.toLocaleString()} ${currency}`
    await client.sendMessage(m.chat, { text: mensaje }, { quoted: m })
  }
}
