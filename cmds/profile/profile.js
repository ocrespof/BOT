
import moment from 'moment-timezone';
import { resolveLidToRealJid } from "../../core/utils.js"
import { xpRange, getBotCurrency } from '../../utils/tools.js';

export default {
  command: ['profile', 'perfil'],
  category: 'rpg',
  run: async (client, m, args, usedPrefix, command) => {
    const texto = m.mentionedJid
    const who2 = texto.length > 0 ? texto[0] : m.quoted ? m.quoted.sender : m.sender
    const userId = await resolveLidToRealJid(who2, client, m.chat);
    const chat = global.db.data.chats[m.chat] || {}
    const globalUsers = global.db.data.users || {}
    const currency = getBotCurrency(client)
    const user2 = globalUsers[userId] || {}
    if (!user2) return m.reply('El usuario *mencionado* no está *registrado* en el bot')
    const name = user2.name || ''
    const birth = user2.birth || 'Sin especificar'
    const genero = user2.genre || 'Oculto'
    const comandos = user2.usedcommands || '0'
    const pareja = user2.marry ? `${globalUsers[user2.marry]?.name || 'Desconocido'}` : 'Nadie'
    const estadoCivil = genero === 'Mujer' ? 'Casada con' : genero === 'Hombre' ? 'Casado con' : 'Casadx con'
    const desc = user2.description ? `\n${user2.description}` : ''
    const pasatiempo = user2.pasatiempo ? `${user2.pasatiempo}` : 'No definido'
    const exp = user2.exp || 0
    const nivel = user2.level || 0
    const coins = user2.coins || 0
    const banco = user2.bank || 0
    const totalCoins = coins + banco
    const health = user2.health ?? 100
    const favId = chat.users?.[userId]?.favorite
    const favLine = favId && chat.characters?.[favId] ? `\n๑ Claim favorito *${chat.characters[favId].name || '???'}*\n` : ''
    const ownedIDs = Object.entries(chat.characters || {}).filter(([, c]) => c.user === userId).map(([id]) => id)
    const haremCount = ownedIDs.length
    const haremValue = ownedIDs.reduce((acc, id) => {
      const local = chat.characters?.[id] || {}
      const globalRec = global.db.data.characters?.[id] || {}
      const value = (globalRec && typeof globalRec.value === 'number') ? globalRec.value : (local && typeof local.value === 'number') ? local.value : 0
      return acc + value
    }, 0)
    const perfil = await client.profilePictureUrl(userId, 'image').catch((_) => 'https://cdn.yuki-wabot.my.id/files/2PVh.jpeg')
    const users = Object.entries(globalUsers).map(([key, value]) => ({ ...value, jid: key }))
    const sortedLevel = users.sort((a, b) => (b.level || 0) - (a.level || 0))
    try {
      const rank = sortedLevel.findIndex((u) => u.jid === userId) + 1
      const { min, xp } = xpRange(nivel, global.multiplier)
      const progreso = exp - min
      const porcentaje = xp > 0 ? Math.floor((progreso / xp) * 100) : 0
      const titleLine = user2.title ? `\n🎖️ Título › *${user2.title}*` : ''
      const gameWins = user2.gameWins || 0
      const gameLosses = user2.gameLosses || 0
      const achievementCount = (user2.achievements || []).length
      const profileText = `「✿」 *Perfil* ◢ ${name} ◤${desc}${titleLine}

♛ Cumpleaños › *${birth}*
⸙ Pasatiempo › *${pasatiempo}*
⚥ Género › *${genero}*
♡ ${estadoCivil} › *${pareja}*

✿ Nivel › *${nivel}*
Experiencia › *${exp.toLocaleString()}*
➨ Progreso › *${progreso} => ${xp}* _(${porcentaje}%)_
☆ Puesto › *#${rank}*
❤️ Salud › *${health}/100*

🎮 Victorias › *${gameWins}* | Derrotas › *${gameLosses}*
🏅 Logros › *${achievementCount}*

Harem › *${haremCount}*
♤ Valor total › *${haremValue.toLocaleString()}*${favLine}
Coins totales › *¥${totalCoins.toLocaleString()} ${currency}*
❒ Comandos ejecutados › *${comandos.toLocaleString()}*`
      await client.sendMessage(m.chat, { image: { url: perfil }, caption: profileText }, { quoted: m })
    } catch (e) {
      return m.reply(`> An unexpected error occurred while executing command *${usedPrefix + command}*. Please try again or contact support if the issue persists.\n[Error: *${e.message}*]`)
    }
  }
}
