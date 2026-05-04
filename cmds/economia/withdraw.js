import { getBotCurrency } from '../../utils/tools.js';

export default {
  command: ['withdraw', 'with', 'retirar'],
  category: 'economia',
  economy: true,
  run: async (client, m, args, usedPrefix, command) => {
    const monedas = getBotCurrency(client)
    const user = global.db.data.users[m.sender]
    if (!args[0]) return m.reply(` Ingresa la cantidad de *${monedas}* que quieras retirar.`)
    if (args[0].toLowerCase() === 'all') {
      if ((user.bank || 0) <= 0) return m.reply(`No tienes suficientes *${monedas}* en tu Banco para poder retirar.`)
      const amount = user.bank
      user.bank = 0
      user.coins = (user.coins || 0) + amount
      return m.reply(`Has retirado *¥${amount.toLocaleString()} ${monedas}* del banco, ahora podras usarlo pero tambien podran robartelo.`)
    }
    const count = parseInt(args[0])
    if (isNaN(count) || count < 1) return m.reply(` Debes retirar una cantidad válida.\n > Ejemplo 1 *${usedPrefix + command} ¥25000*\nEjemplo 2 *${usedPrefix + command} all*`)
    if ((user.bank || 0) < count) return m.reply(` No tienes suficientes *${monedas}* en tu banco para retirar esa cantidad.\nSolo tienes *¥${(user.bank || 0).toLocaleString()} ${monedas}* en tu cuenta.`)
    user.bank -= count
    user.coins = (user.coins || 0) + count
    await m.reply(`Has retirado *¥${count.toLocaleString()} ${monedas}* del banco, ahora podras usarlo pero tambien podran robartelo.`)
  },
}
