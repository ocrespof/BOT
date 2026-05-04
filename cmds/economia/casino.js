import { delay } from "@whiskeysockets/baileys"
import { getBotCurrency, formatTime } from '../../utils/tools.js';

export default {
  command: ['apostar', 'casino'],
  category: 'economia',
  desc: 'Apostar en el casino.',
  economy: true,
  run: async (client, m, args, usedPrefix, command) => {
    const user = global.db.data.users[m.sender]
    const currency = getBotCurrency(client)
    const botname = global.db.data.settings[client.user.id.split(':')[0] + '@s.whatsapp.net']?.botname || 'Bot'
    user.lastApuesta ??= 0
    let Aku = Math.floor(Math.random() * 101)
    let Kamu = Math.floor(Math.random() * 101)
    let count = args[0]
    const userName = user.name || m.sender.split('@')[0]
    const tiempoEspera = 30 * 1000
    const ahora = Date.now()
    if (user.lastApuesta && ahora - user.lastApuesta < tiempoEspera) {
      return m.reply(`Debes esperar *${formatTime(user.lastApuesta + tiempoEspera - ahora)}* para usar *${usedPrefix + command}* nuevamente.`)
    }
    user.lastApuesta = ahora
    count = count ? /all/i.test(count) ? user.coins || 0 : parseInt(count) : args[0] ? parseInt(args[0]) : 1
    count = Math.max(1, count)
    if (args.length < 1) return m.reply(`Ingresa la cantidad de *${currency}* que deseas aportar contra *${botname}*\nEjemplo: *${usedPrefix + command} 100*`)
    if ((user.coins || 0) >= count) {
      user.coins -= count
      let resultado = '', ganancia = 0
      if (Aku > Kamu) {
        resultado = `> ${userName}, *Perdiste ¥${count.toLocaleString()} ${currency}*.`
      } else if (Aku < Kamu) {
        ganancia = count * 2
        user.coins += ganancia
        resultado = `> ${userName}, *Ganaste ¥${ganancia.toLocaleString()} ${currency}*.`
      } else {
        ganancia = count
        user.coins += ganancia
        resultado = `> ${userName}, *Ganaste ¥${ganancia.toLocaleString()} ${currency}*.`
      }
      let { key } = await client.sendMessage(m.chat, { text: "🎲 El crupier lanza los dados... ¡Las apuestas están cerradas!" }, { quoted: m })
      await delay(2000)
      await client.sendMessage(m.chat, { text: "Los números están girando... ¡Prepárate para el resultado!", edit: key }, { quoted: m })
      await delay(2000)
      const replyMsg = `\`Veamos qué números tienen!\`\n\n➠ *${botname}* : ${Aku}\n➠ *${userName}* : ${Kamu}\n\n${resultado}`
      await client.sendMessage(m.chat, { text: replyMsg.trim(), edit: key }, { quoted: m })
    } else {
      m.reply(`No tienes *¥${count.toLocaleString()} ${currency}* para apostar!`)
    }
  }
}
