import { getBotCurrency } from '../../utils/tools.js';
import { resolveLidToRealJid } from "../../core/utils.js"

export default {
  command: ['givecoins', 'pay', 'coinsgive'],
  category: 'economia',
  economy: true,
  group: true,
  run: async (client, m, args, usedPrefix, command) => {
    const db = global.db.data
    const monedas = getBotCurrency(client)
    const mentioned = m.mentionedJid || []
    const who2 = m.quoted ? m.quoted.sender : mentioned[0] || (args[1] ? (args[1].replace(/[@ .+-]/g, '') + '@s.whatsapp.net') : '')
    if (!who2) return m.reply(`Debes mencionar a quien quieras transferir *${monedas}*.\nEjemplo *${usedPrefix + command} 25000 @mencion*`)
    const who = await resolveLidToRealJid(who2, client, m.chat)
    const senderData = db.users[m.sender]
    const targetData = db.users[who]
    if (!targetData) return m.reply(`El usuario mencionado no está registrado en el bot.`)
    const cantidadInput = args[0]?.toLowerCase()
    let cantidad = cantidadInput === 'all' ? (senderData.bank || 0) : parseInt(cantidadInput)
    if (!cantidadInput || isNaN(cantidad) || cantidad <= 0) return m.reply(`Ingresa una cantidad válida de *${monedas}* para transferir.`)
    if (typeof senderData.bank !== 'number') senderData.bank = 0
    if (senderData.bank < cantidad) return m.reply(`No tienes suficientes *${monedas}* en el banco para transferir.\nTu saldo actual: *¥${senderData.bank.toLocaleString()} ${monedas}*`)
    senderData.bank -= cantidad
    if (typeof targetData.bank !== 'number') targetData.bank = 0
    targetData.bank += cantidad
    let name = targetData.name || who.split('@')[0]
    await client.sendMessage(m.chat, { text: `Transferiste *¥${cantidad.toLocaleString()} ${monedas}* a *${name}*\nAhora tienes *¥${senderData.bank.toLocaleString()} ${monedas}* en tu banco.`, mentions: [who] }, { quoted: m })
  }
}
