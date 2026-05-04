import { getBotCurrency } from '../../utils/tools.js';

export default {
  command: ['rt', 'roulette'],
  category: 'economia',
  desc: 'Ruleta de apuestas.',
  economy: true,
  run: async (client, m, args, usedPrefix) => {
    const currency = getBotCurrency(client)
    const user = global.db.data.users[m.sender]
    if (args.length < 2) return m.reply(` Debes ingresar una cantidad de ${currency} y apostar a un color.`)
    let amount, color
    if (!isNaN(parseInt(args[0]))) { amount = parseInt(args[0]); color = args[1].toLowerCase() }
    else if (!isNaN(parseInt(args[1]))) { color = args[0].toLowerCase(); amount = parseInt(args[1]) }
    else return m.reply(` Formato inválido. Ejemplo: *rt 2000 black* o *rt black 2000*`)
    const validColors = ['red', 'black', 'green']
    if (isNaN(amount) || amount < 200) return m.reply(` La cantidad mínima de ${currency} a apostar es 200.`)
    if (!validColors.includes(color)) return m.reply(` Por favor, elige un color válido: red, black, green.`)
    if ((user.coins || 0) < amount) return m.reply(` No tienes suficientes *${currency}* para hacer esta apuesta.`)
    const resultColor = validColors[Math.floor(Math.random() * validColors.length)]
    if (resultColor === color) {
      const reward = amount * (resultColor === 'green' ? 14 : 2)
      user.coins = (user.coins || 0) + reward
      await client.sendMessage(m.chat, { text: `「✿」 La ruleta salió en *${resultColor}* y has ganado *¥${reward.toLocaleString()} ${currency}*.`, mentions: [m.sender] }, { quoted: m })
    } else {
      user.coins = (user.coins || 0) - amount
      await client.sendMessage(m.chat, { text: `「✿」 La ruleta salió en *${resultColor}* y has perdido *¥${amount.toLocaleString()} ${currency}*.`, mentions: [m.sender] }, { quoted: m })
    }
  },
}
