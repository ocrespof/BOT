import { getBotCurrency } from '../../utils/tools.js';

export default {
  command: ['balance', 'bal', 'saldo', 'coins', 'money'],
  category: 'economia',
  desc: 'Ver tu saldo.',
  economy: true,
  run: async (client, m, args, usedPrefix) => {
    const monedas = getBotCurrency(client)
    const user = global.db.data.users[m.sender]
    const coins = user.coins || 0
    const bank = user.bank || 0
    const total = coins + bank
    const health = user.health ?? 100
    const name = user.name || m.sender.split('@')[0]
    await client.sendMessage(m.chat, {
      text: `「✿」 *Balance de ${name}*\n\n🪙 Cartera › *¥${coins.toLocaleString()} ${monedas}*\n🏦 Banco › *¥${bank.toLocaleString()} ${monedas}*\n💰 Total › *¥${total.toLocaleString()} ${monedas}*\n❤️ Salud › *${health}/100*`
    }, { quoted: m })
  },
}
