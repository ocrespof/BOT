import { pickRandom, formatTime, getBotCurrency } from '../../utils/tools.js';

export default {
  command: ['mine', 'minar'],
  category: 'economia',
  desc: 'Minar recursos.',
  economy: true,
  run: async (client, m, args, usedPrefix) => {
    const monedas = getBotCurrency(client)
    const user = global.db.data.users[m.sender]
    if ((user.health || 0) < 5) return m.reply(`No tienes suficiente salud para volver a *minar*.\nUsa *"${usedPrefix}heal"* para curarte.`)
    const remaining = (user.lastmine || 0) - Date.now()
    if (remaining > 0) return m.reply(`Debes esperar *${formatTime(remaining)}* para minar de nuevo.`)
    user.lastmine = Date.now() + 10 * 60 * 1000
    let isLegendary = Math.random() < 0.02
    let reward, narration, bonusMsg = ''
    if (isLegendary) {
      reward = Math.floor(Math.random() * (13000 - 11000 + 1)) + 11000
      narration = '¡DESCUBRISTE UN TESORO LEGENDARIO!\n\n'
      bonusMsg = '\nRecompensa ÉPICA obtenida!'
    } else {
      reward = Math.floor(Math.random() * (9500 - 7000 + 1)) + 7000
      narration = `En ${pickRandom(escenarios)}, ${pickRandom(mineria)}`
      if (Math.random() < 0.1) {
        const bonus = Math.floor(Math.random() * (4500 - 2500 + 1)) + 2500
        reward += bonus
        bonusMsg = `\n「✿」 ¡Bonus de minería! Ganaste *${bonus.toLocaleString()}* ${monedas} extra`
      }
    }
    user.coins = (user.coins || 0) + reward
    const salud = Math.floor(Math.random() * (15 - 5 + 1)) + 5
    user.health = (user.health || 100) - salud
    if (user.health < 0) user.health = 0
    let msg = `「✿」 ${narration} *${reward.toLocaleString()} ${monedas}*`
    if (bonusMsg) msg += `\n${bonusMsg}`
    await client.reply(m.chat, msg, m)
  },
}

const escenarios = [
  'una cueva oscura y húmeda', 'la cima de una montaña nevada',
  'un bosque misterioso lleno de raíces', 'un río cristalino y caudaloso',
  'una mina abandonada de carbón', 'las ruinas de un antiguo castillo',
  'una playa desierta con arena dorada', 'un valle escondido entre colinas',
  'un arbusto espinoso al borde del camino', 'un tronco hueco en medio del bosque',
]

const mineria = [
  'encontraste un antiguo cofre con', 'hallaste una bolsa llena de',
  'descubriste un saco de', 'desenterraste monedas antiguas que contienen',
  'rompiste una roca y adentro estaba', 'cavando profundo, hallaste',
  'entre las raíces, encontraste', 'dentro de una caja olvidada, hallaste',
  'bajo unas piedras, descubriste', 'entre los escombros de un lugar viejo, encontraste',
]
