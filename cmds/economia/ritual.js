import { pickRandom, formatTime, getBotCurrency } from '../../utils/tools.js';

export default {
  command: ['ritual', 'invoke'],
  category: 'economia',
  economy: true,
  run: async (client, m, args, usedPrefix) => {
    const monedas = getBotCurrency(client)
    const user = global.db.data.users[m.sender]
    const remaining = (user.lastinvoke || 0) - Date.now()
    if (remaining > 0) return m.reply(`Debes esperar *${formatTime(remaining)}* para invocar otro ritual.`)
    user.lastinvoke = Date.now() + 12 * 60 * 1000
    const roll = Math.random()
    let reward = 0, narration = '', bonusMsg = ''
    if (roll < 0.05) {
      reward = Math.floor(Math.random() * (13000 - 11000 + 1)) + 11000
      narration = pickRandom(legendaryInvocations)
      bonusMsg = '\nRecompensa LEGENDARIA obtenida!'
    } else {
      reward = Math.floor(Math.random() * (11000 - 8000 + 1)) + 8000
      narration = pickRandom(normalInvocations)
      if (Math.random() < 0.15) {
        const bonus = Math.floor(Math.random() * (4500 - 2500 + 1)) + 2500
        reward += bonus
        bonusMsg = `\n「✿」 ¡Energía extra! Ganaste *${bonus.toLocaleString()}* ${monedas} adicionales`
      }
    }
    user.coins = (user.coins || 0) + reward
    let msg = `「✿」 ${narration}\nGanaste *${reward.toLocaleString()} ${monedas}*`
    if (bonusMsg) msg += `\n${bonusMsg}`
    await client.reply(m.chat, msg, m)
  },
}

const normalInvocations = [
  'Tu ritual abre un portal y caen riquezas ardientes del vacío',
  'Las velas se consumen y revelan un cofre lleno de monedas antiguas',
  'El círculo de invocación brilla y aparecen gemas relucientes',
  'Un espíritu menor te entrega un saco de oro como ofrenda',
  'Los cánticos atraen un espectro que deja riquezas a tus pies',
  'La luna ilumina tu altar y revela un tesoro escondido',
  'Un demonio amistoso surge y te paga por tu invocación',
  'El humo del incienso se transforma en monedas brillantes',
  'Los símbolos arcanos vibran y materializan riquezas inesperadas',
  'Un guardián espiritual aparece y te recompensa por tu fe'
]

const legendaryInvocations = [
  '¡Has invocado un espíritu ancestral que te entrega un tesoro legendario!',
  'Un dragón cósmico emerge del ritual y te concede riquezas infinitas',
  'Los dioses antiguos responden y derraman oro celestial sobre ti',
  'Un ángel guardián desciende y coloca un cofre sagrado en tus manos',
  'El portal dimensional se abre y un tesoro prohibido cae ante ti',
  'La tierra tiembla y un espíritu titánico te entrega riquezas ocultas',
  'Un fénix resucitado deja joyas ardientes como recompensa',
  'Los astros se alinean y un tesoro cósmico aparece en tu altar'
]
