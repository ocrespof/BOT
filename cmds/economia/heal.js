import { getBotCurrency } from '../../utils/tools.js';
import { resolveLidToRealJid } from "../../core/utils.js"

export default {
  command: ['heal', 'curar'],
  category: 'economia',
  economy: true,
  run: async (client, m, args, usedPrefix) => {
    const currency = getBotCurrency(client)
    const db = global.db.data
    const mentioned = m.mentionedJid || []
    const who2 = mentioned[0] || (m.quoted ? m.quoted.sender : null)
    const who = await resolveLidToRealJid(who2, client, m.chat)
    const healer = db.users[m.sender]
    const target = who ? db.users[who] : healer
    if (!target) return m.reply(`El usuario no se encuentra en la base de Datos.`)
    if ((target.health || 100) >= 100) {
      const maximo = who ? `La salud de *${target.name || who.split('@')[0]}* ya está al máximo, Salud actual: ${target.health || 100}` : `Tu salud ya está al máximo, Salud actual: ${target.health || 100}`
      return m.reply(maximo)
    }
    const faltante = 100 - (target.health || 0)
    const bloques = Math.ceil(faltante / 10)
    const costo = bloques * 500
    const totalFondos = (healer.coins || 0) + (healer.bank || 0)
    if (totalFondos < costo) {
      const fondos = who ? `No tienes suficientes ${currency} para curar a *${target.name || who.split('@')[0]}*.\nNecesitas *¥${costo.toLocaleString()} ${currency}* para curar ${faltante} puntos de salud.` : `No tienes suficientes ${currency} para curarte.\nNecesitas *¥${costo.toLocaleString()} ${currency}* para curar ${faltante} puntos de salud.`
      return m.reply(fondos)
    }
    if ((healer.coins || 0) >= costo) {
      healer.coins -= costo
    } else {
      const restante = costo - (healer.coins || 0)
      healer.coins = 0
      healer.bank = Math.max(0, (healer.bank || 0) - restante)
    }
    target.health = 100
    const info = who ? `Has curado a *${target.name || who.split('@')[0]}* hasta el máximo nivel de salud.` : `Te has curado hasta el máximo nivel de salud.`
    m.reply(info)
  },
}
