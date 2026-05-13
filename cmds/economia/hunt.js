import { pickRandom, formatTime, getBotCurrency } from '../../utils/tools.js';

export default {
  command: ['cazar', 'hunt'],
  category: 'economia',
  desc: 'Cazar animales.',
  economy: true,
  run: async (client, m, args, usedPrefix) => {
    const user = global.db.data.users[m.sender]
    const currency = getBotCurrency(client)
    user.lasthunt ??= 0
    user.coins ??= 0
    user.health ??= 100
    if (user.health < 5) return m.reply(`No tienes suficiente salud para volver a *cazar*.\nUsa *"${usedPrefix}heal"* para curarte.`)
    if (Date.now() < user.lasthunt) return m.reply(`Debes esperar *${formatTime(user.lasthunt - Date.now())}* antes de volver a cazar.`)
    const rand = Math.random()
    let cantidad = 0, salud = Math.floor(Math.random() * (15 - 10 + 1)) + 10, message
    if (rand < 0.4) {
      cantidad = Math.floor(Math.random() * (13000 - 10000 + 1)) + 10000
      user.coins += cantidad
      user.health -= salud
      message = pickRandom([
        `¡Con gran valentía, lograste cazar un Oso! Ganaste *¥${cantidad.toLocaleString()} ${currency}*.`,
        `¡Has cazado un Tigre feroz! Tras una persecución electrizante, ganaste *¥${cantidad.toLocaleString()} ${currency}*.`,
        `Lograste cazar un Elefante con astucia y persistencia, ganaste *¥${cantidad.toLocaleString()} ${currency}*.`,
        `¡Has cazado un Panda! La caza fue tranquila, ganaste *¥${cantidad.toLocaleString()} ${currency}*.`,
        `Cazaste un Jabalí tras un rastreo emocionante, ganaste *¥${cantidad.toLocaleString()} ${currency}*.`,
        `Con gran destreza, atrapaste un Cocodrilo, ganaste *¥${cantidad.toLocaleString()} ${currency}*.`,
        `¡Has cazado un Ciervo robusto! Ganaste *¥${cantidad.toLocaleString()} ${currency}*.`,
        `Con paciencia lograste cazar un Zorro plateado, ganaste *¥${cantidad.toLocaleString()} ${currency}*.`,
        `Localizaste un grupo de peces en el río y atrapaste varios, ganaste *¥${cantidad.toLocaleString()} ${currency}*.`,
        `Te internaste en la niebla del bosque y cazaste un jabalí salvaje, ganaste *¥${cantidad.toLocaleString()} ${currency}*.`
      ])
    } else if (rand < 0.7) {
      cantidad = Math.floor(Math.random() * (8000 - 6000 + 1)) + 6000
      const total = (user.coins || 0) + (user.bank || 0)
      if (total >= cantidad) { if (user.coins >= cantidad) { user.coins -= cantidad } else { const r = cantidad - user.coins; user.coins = 0; user.bank -= r } } else { cantidad = total; user.coins = 0; user.bank = 0 }
      user.health -= salud; if (user.health < 0) user.health = 0
      message = pickRandom([
        `Tu presa se escapó y no lograste cazar nada, perdiste *¥${cantidad.toLocaleString()} ${currency}*.`,
        `Tropezaste mientras apuntabas y la presa huyó, perdiste *¥${cantidad.toLocaleString()} ${currency}*.`,
        `Un rugido te distrajo y no lograste dar en el blanco, perdiste *¥${cantidad.toLocaleString()} ${currency}*.`,
        `Tu arco se rompió justo en el momento crucial, perdiste *¥${cantidad.toLocaleString()} ${currency}*.`,
        `Un aguacero repentino arruinó tu ruta de caza, perdiste *¥${cantidad.toLocaleString()} ${currency}*.`,
        `Un jabalí te embistió y tuviste que huir, perdiste *¥${cantidad.toLocaleString()} ${currency}*.`,
        `Un tigre te sorprendió y escapaste con pérdidas, perdiste *¥${cantidad.toLocaleString()} ${currency}*.`
      ])
    } else {
      message = pickRandom([
        `Pasaste la tarde cazando y observando cómo los animales se movían en silencio.`,
        `El bosque estuvo tranquilo y los animales se mostraron esquivos.`,
        `Tu jornada de caza fue serena, los animales se acercaban sin ser atrapados.`,
        `Los animales se mostraron cautelosos, pero la experiencia de caza fue agradable.`,
        `Exploraste nuevas rutas de caza y descubriste huellas frescas.`
      ])
    }
    user.lasthunt = Date.now() + 15 * 60 * 1000
    await client.sendMessage(m.chat, { text: `「✿」 ${message}` }, { quoted: m })
  },
}
