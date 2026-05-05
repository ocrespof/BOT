import { delay } from "@whiskeysockets/baileys"
import { formatTime, getBotCurrency } from '../../utils/tools.js';

export default {
  command: ['slot'],
  category: 'economia',
  desc: 'Máquina tragamonedas.',
  economy: true,
  run: async (client, m, args, usedPrefix, command) => {
    const currency = getBotCurrency(client)
    const user = global.db.data.users[m.sender]
    user.lastslot ??= 0
    if (!args[0] || isNaN(args[0]) || parseInt(args[0]) <= 0) return m.reply(`Por favor, ingresa la cantidad que deseas apostar.`)
    const apuesta = parseInt(args[0])
    if (Date.now() - user.lastslot < 30000) return m.reply(`Debes esperar *${formatTime(user.lastslot + 30000 - Date.now())}* para usar *${usedPrefix + command}* nuevamente.`)
    if (apuesta < 100) return m.reply(`El mínimo para apostar es de 100 *${currency}*.`)
    if ((user.coins || 0) < apuesta) return m.reply(`Tus *${currency}* no son suficientes para apostar esa cantidad.`)
    const emojis = ['✾', '❃', '❁']
    const getRandomEmojis = () => ({
      x: Array.from({ length: 3 }, () => emojis[Math.floor(Math.random() * emojis.length)]),
      y: Array.from({ length: 3 }, () => emojis[Math.floor(Math.random() * emojis.length)]),
      z: Array.from({ length: 3 }, () => emojis[Math.floor(Math.random() * emojis.length)])
    })
    const initialText = '「✿」| *SLOTS* \n────────\n'
    let { key } = await client.sendMessage(m.chat, { text: initialText }, { quoted: m })
    for (let i = 0; i < 5; i++) {
      const { x, y, z } = getRandomEmojis()
      await client.sendMessage(m.chat, { text: `「✿」| *SLOTS* \n────────\n${x[0]} : ${y[0]} : ${z[0]}\n${x[1]} : ${y[1]} : ${z[1]}\n${x[2]} : ${y[2]} : ${z[2]}\n────────`, edit: key }, { quoted: m })
      await delay(300)
    }
    const { x, y, z } = getRandomEmojis()
    let resultado
    if (x[0] === y[0] && y[0] === z[0]) {
      resultado = `Ganaste! *¥${(apuesta * 2).toLocaleString()} ${currency}*.`
      user.coins = (user.coins || 0) + apuesta
    } else if (x[0] === y[0] || x[0] === z[0] || y[0] === z[0]) {
      resultado = `Casi lo logras. *Toma ¥10 ${currency}* por intentarlo.`
      user.coins = (user.coins || 0) + 10
    } else {
      resultado = `Perdiste *¥${apuesta.toLocaleString()} ${currency}*.`
      user.coins = (user.coins || 0) - apuesta
    }
    user.lastslot = Date.now()
    await client.sendMessage(m.chat, { text: `「✿」| *SLOTS* \n────────\n${x[0]} : ${y[0]} : ${z[0]}\n${x[1]} : ${y[1]} : ${z[1]}\n${x[2]} : ${y[2]} : ${z[2]}\n────────\n${resultado}`, edit: key }, { quoted: m })
  }
}
