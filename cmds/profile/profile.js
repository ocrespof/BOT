
import moment from 'moment-timezone';
import { resolveLidToRealJid } from "../../core/utils.js"
import { xpRange, getBotCurrency } from '../../utils/tools.js';
import { TITLE_NAMES } from '../economia/shopData.js';

export default {
  command: ['profile', 'perfil'],
  category: 'profile',
  desc: 'Muestra tu perfil completo.',
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

    const perfil = await client.profilePictureUrl(userId, 'image').catch((_) => 'https://cdn.yuki-wabot.my.id/files/2PVh.jpeg')
    const users = Object.entries(globalUsers).map(([key, value]) => ({ ...value, jid: key }))
    const sortedLevel = users.sort((a, b) => (b.level || 0) - (a.level || 0))
    try {
      const rank = sortedLevel.findIndex((u) => u.jid === userId) + 1
      const { min, xp } = xpRange(nivel, global.multiplier)
      const progreso = exp - min
      const porcentaje = xp > 0 ? Math.floor((progreso / xp) * 100) : 0
      const gameWins = user2.gameWins || 0;
      const gameLosses = user2.gameLosses || 0;
      const achievementCount = (user2.achievements || []).length;

      // Lógica de Buffs Activos basada en el título
      let activeBuff = "Ninguno";
      if (user2.title === 'title_legend') activeBuff = "+15% Monedas en Trabajo";
      else if (user2.title === 'title_shadow') activeBuff = "Inmunidad al Robo";
      else if (user2.title === 'title_star') activeBuff = "+15% XP en Juegos";
      else if (user2.title === 'title_neko') activeBuff = "+10 Salud al Pescar";
      else if (user2.title === 'title_fire') activeBuff = "+20% Monedas en Mazmorra";
      else if (user2.title === 'title_lucky') activeBuff = "+15% Éxito en Crimen";
      else if (user2.title === 'title_fisher') activeBuff = "+20% Monedas en Pesca";
      else if (user2.title === 'title_miner') activeBuff = "+20% Monedas en Minería";
      else if (user2.title === 'title_tycoon') activeBuff = "+20% Monedas en Cobros";

      const profileText = `╭━━━「 *PERFIL DE USUARIO* 」━━━╮
┃ 👤 *Nombre:* ${name}
┃ 🎂 *Cumpleaños:* ${birth}
┃ 🎭 *Pasatiempo:* ${pasatiempo}
┃ 👫 *Estado Civil:* ${estadoCivil} ${pareja}
╰━━━━━━━━━━━━━━━━━━━━━━━━╯

╭━━━「 *ESTADÍSTICAS* 」━━━━━━╮
┃ 📊 *Nivel:* ${nivel}  |  *Rango:* #${rank}
┃ ✨ *Experiencia:* ${exp.toLocaleString()}
┃ 📈 *Progreso:* ${progreso} / ${xp} (${porcentaje}%)
┃ ❤️ *Salud:* ${health} / 100
┃ 💰 *Capital Total:* ¥${totalCoins.toLocaleString()} ${currency}
┃ 🕹️ *Juegos (V/D):* ${gameWins} / ${gameLosses}
┃ 🏆 *Logros:* ${achievementCount}
┃ ⚙️ *Comandos Usados:* ${comandos.toLocaleString()}
╰━━━━━━━━━━━━━━━━━━━━━━━━╯

╭━━━「 *HABILIDADES PASIVAS* 」━━╮
┃ 🎖️ *Título:* ${user2.title ? (TITLE_NAMES[user2.title] || user2.title) : 'Ninguno'}
┃ 🪄 *Efecto Activo:* ${activeBuff}
╰━━━━━━━━━━━━━━━━━━━━━━━━╯`
      await client.sendMessage(m.chat, { image: { url: perfil }, caption: profileText }, { quoted: m })
    } catch (e) {
      return m.reply(`> An unexpected error occurred while executing command *${usedPrefix + command}*. Please try again or contact support if the issue persists.\n[Error: *${e.message}*]`)
    }
  }
}
