import { pickRandom, formatTime, getBotCurrency } from '../../utils/tools.js';

export default {
  command: ['adventure', 'aventura'],
  category: 'economia',
  economy: true,
  run: async (client, m, args, usedPrefix) => {
    const user = global.db.data.users[m.sender]
    const currency = getBotCurrency(client)
    user.lastadventure ??= 0
    user.coins ??= 0
    user.health ??= 100
    if (user.health < 5) return m.reply(`No tienes suficiente salud para volver a *aventurarte*.\nUsa *"${usedPrefix}heal"* para curarte.`)
    const remainingTime = user.lastadventure - Date.now()
    if (remainingTime > 0) return m.reply(`Debes esperar *${formatTime(remainingTime)}* antes de volver a aventurarte.`)
    const rand = Math.random()
    let cantidad = 0, salud = Math.floor(Math.random() * (20 - 10 + 1)) + 10, message
    if (rand < 0.4) {
      cantidad = Math.floor(Math.random() * (18000 - 14000 + 1)) + 14000
      user.coins += cantidad; user.health -= salud
      message = pickRandom([
        `Derrotaste a un ogro emboscado entre los árboles de Drakonia, ganaste *¥${cantidad.toLocaleString()} ${currency}*.`,
        `Te conviertes en campeón del torneo de gladiadores de Valoria, ganaste *¥${cantidad.toLocaleString()} ${currency}*.`,
        `Rescatas un libro mágico del altar de los Susurros, ganaste *¥${cantidad.toLocaleString()} ${currency}*.`,
        `Liberas a aldeanos atrapados en las minas de Ulderan tras vencer a los trolls, ganaste *¥${cantidad.toLocaleString()} ${currency}*.`,
        `Derrotas a un dragón joven en los acantilados de Flamear, ganaste *¥${cantidad.toLocaleString()} ${currency}*.`,
        `Encuentras un relicario sagrado en las ruinas de Iskaria y lo proteges de saqueadores, ganaste *¥${cantidad.toLocaleString()} ${currency}*.`,
        `Triunfas en el duelo contra el caballero corrupto de Invalion, ganaste *¥${cantidad.toLocaleString()} ${currency}*.`,
        `Conquistas la fortaleza maldita de las Sombras Rojas sin sufrir bajas, ganaste *¥${cantidad.toLocaleString()} ${currency}*.`,
        `Te infiltras en el templo del Vacío y recuperas el cristal del equilibrio, ganaste *¥${cantidad.toLocaleString()} ${currency}*.`,
        `Resuelves el acertijo de la cripta eterna y obtienes un tesoro legendario, ganaste *¥${cantidad.toLocaleString()} ${currency}*.`
      ])
    } else if (rand < 0.7) {
      cantidad = Math.floor(Math.random() * (11000 - 9000 + 1)) + 9000
      const total = (user.coins || 0) + (user.bank || 0)
      if (total >= cantidad) { if (user.coins >= cantidad) { user.coins -= cantidad } else { const r = cantidad - user.coins; user.coins = 0; user.bank -= r } } else { cantidad = total; user.coins = 0; user.bank = 0 }
      user.health -= salud; if (user.health < 0) user.health = 0
      message = pickRandom([
        `El hechicero oscuro te lanzó una maldición y huyes perdiendo *¥${cantidad.toLocaleString()} ${currency}*.`,
        `Te extravías en la jungla de Zarkelia y unos bandidos te asaltan, pierdes *¥${cantidad.toLocaleString()} ${currency}*.`,
        `Un basilisco te embiste y escapas herido sin botín, pierdes *¥${cantidad.toLocaleString()} ${currency}*.`,
        `Fracasa tu incursión a la torre de hielo cuando caes en una trampa mágica, pierdes *¥${cantidad.toLocaleString()} ${currency}*.`,
        `Pierdes orientación entre los portales del bosque espejo y terminas sin recompensa, pierdes *¥${cantidad.toLocaleString()} ${currency}*.`,
        `Un grupo de trolls te embosca y te quitan tus pertenencias, pierdes *¥${cantidad.toLocaleString()} ${currency}*.`,
        `El dragón anciano te derrota y te obliga a huir, pierdes *¥${cantidad.toLocaleString()} ${currency}*.`
      ])
    } else {
      message = pickRandom([
        `Exploras ruinas antiguas y aprendes secretos ocultos.`,
        `Sigues la pista de un espectro pero desaparece entre la niebla.`,
        `Acompañas a una princesa por los desiertos de Thaloria sin contratiempos.`,
        `Recorres un bosque encantado y descubres nuevas rutas.`,
        `Visitas una aldea remota y escuchas relatos de viejas batallas.`
      ])
    }
    user.lastadventure = Date.now() + 20 * 60 * 1000
    await client.sendMessage(m.chat, { text: `「✿」 ${message}` }, { quoted: m })
  },
}
