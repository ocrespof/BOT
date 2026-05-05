import { formatTime, getBotCurrency } from '../../utils/tools.js';
import { resolveLidToRealJid } from "../../core/utils.js"

export default {
  command: ['robar', 'steal', 'rob'],
  category: 'economia',
  desc: 'Robar coins a otro.',
  economy: true,
  run: async (client, m, args, usedPrefix, command) => {
    const db = global.db.data
    const currency = getBotCurrency(client)
    const user = db.users[m.sender]
    user.coins ??= 0
    user.laststeal ??= 0
    if (Date.now() < user.laststeal) return client.reply(m.chat, `Debes esperar *${formatTime(user.laststeal - Date.now())}* para usar *${usedPrefix + command}* de nuevo.`, m)
    const mentioned = m.mentionedJid || []
    const who2 = mentioned[0] || (m.quoted ? m.quoted.sender : null)
    const who = await resolveLidToRealJid(who2, client, m.chat)
    if (!who) return client.reply(m.chat, `Debes mencionar a alguien para intentar robarle.`, m)
    if (!(who in db.users)) return client.reply(m.chat, `El usuario no se encuentra en mi base de datos.`, m)
    // Check shield and Shadow title immunity
    const targetUser = db.users[who]
    if (targetUser.title === 'title_shadow') return client.reply(m.chat, `Ese usuario tiene el título *🌑 Sombra* equipado. Es inmune a los robos.`, m)
    if (targetUser.shield && targetUser.shield.expiresAt > Date.now()) return client.reply(m.chat, `Ese usuario tiene un *🛡️ Escudo Anti-Robo* activo. No puedes robarle.`, m)
    const name = targetUser.name || who.split('@')[0]
    const lastCmd = db.chats[m.chat]?.users?.[who]?.lastCmd || 0
    const tiempoInactivo = Date.now() - lastCmd
    if (tiempoInactivo < 3600000) return client.reply(m.chat, `Solo puedes robarle *${currency}* a un usuario si estuvo más de 1 hora inactivo.`, m)
    const chance = Math.random()
    if (chance < 0.3) {
      let loss = Math.floor(Math.random() * (5000 - 2000 + 1)) + 2000
      const total = (user.coins || 0) + (user.bank || 0)
      if (total >= loss) { if (user.coins >= loss) { user.coins -= loss } else { const r = loss - user.coins; user.coins = 0; user.bank = Math.max(0, (user.bank || 0) - r) } } else { loss = total; user.coins = 0; user.bank = 0 }
      user.laststeal = Date.now() + 3600000
      return client.reply(m.chat, `El robo salió mal y perdiste *¥${loss.toLocaleString()} ${currency}*.`, m)
    }
    const rob = Math.floor(Math.random() * (8000 - 4000 + 1)) + 4000
    if ((targetUser.coins || 0) < rob) return client.reply(m.chat, `*${name}* no tiene suficientes *${currency}* fuera del banco como para que valga la pena intentar robar.`, m, { mentions: [who] })
    user.coins += rob
    targetUser.coins -= rob
    user.laststeal = Date.now() + 3600000
    client.reply(m.chat, `Le robaste *¥${rob.toLocaleString()} ${currency}* a *${name}*`, m, { mentions: [who] })
  }
}
