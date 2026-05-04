import { getBotCurrency } from '../../utils/tools.js';

export default {
  command: ['dep', 'deposit', 'd'],
  category: 'economia',
  desc: 'Depositar coins al banco.',
  economy: true,
  run: async (client, m, args, usedPrefix) => {
    const monedas = getBotCurrency(client)
    const user = global.db.data.users[m.sender]
    if (!args[0]) return m.reply(` Ingresa la cantidad de *${monedas}* que quieras *depositar*.`)
    if (args[0].toLowerCase() === 'all') {
      if ((user.coins || 0) <= 0) return m.reply(`No tienes *${monedas}* para depositar en tu *banco*`)
      const count = user.coins
      user.coins = 0
      user.bank = (user.bank || 0) + count
      return m.reply(`Has depositado *¥${count.toLocaleString()} ${monedas}* en tu Banco`)
    }
    const count = parseInt(args[0])
    if (isNaN(count) || count < 1) return m.reply(' Ingresa una cantidad *válida* para depositar')
    if ((user.coins || 0) < count) return m.reply(`No tienes suficientes *${monedas}* para depositar`)
    user.coins -= count
    user.bank = (user.bank || 0) + count
    await m.reply(`Has depositado *¥${count.toLocaleString()} ${monedas}* en tu Banco`)
  },
}
