import { pickRandom, formatTime, getBotCurrency } from '../../utils/tools.js';

export default {
  command: ['pescar', 'fish'],
  category: 'economia',
  desc: 'Pescar recursos.',
  economy: true,
  run: async (client, m, args, usedPrefix) => {
    const user = global.db.data.users[m.sender]
    const currency = getBotCurrency(client)
    user.lastfish ??= 0
    const remaining = user.lastfish - Date.now()
    if (remaining > 0) return m.reply(`Debes esperar *${formatTime(remaining)}* antes de volver a pescar.`)
    const rand = Math.random()
    let cantidad, message
    if (rand < 0.4) {
      let cantidad = Math.floor(Math.random() * (8000 - 6000 + 1)) + 6000
      if (user.title === 'title_fisher') cantidad = Math.floor(cantidad * 1.20); // Buff: Pescador
      user.coins = (user.coins || 0) + cantidad
      
      let buffMessage = '';
      if (user.title === 'title_neko') {
        user.health = Math.min(100, (user.health || 100) + 10);
        buffMessage = '\n_(🐱 +10 Salud)_';
      }
      message = pickRandom([
        `¡Has pescado un Salmón! Ganaste *¥${cantidad.toLocaleString()} ${currency}*!`,
        `¡Has pescado una Trucha! Ganaste *¥${cantidad.toLocaleString()} ${currency}*!`,
        `¡Has capturado un Tiburón! Ganaste *¥${cantidad.toLocaleString()} ${currency}*!`,
        `¡Has pescado una Ballena! Ganaste *¥${cantidad.toLocaleString()} ${currency}*!`,
        `¡Has capturado un Pez Payaso! Ganaste *¥${cantidad.toLocaleString()} ${currency}*!`,
        `¡Has atrapado una Anguila Dorada! Ganaste *¥${cantidad.toLocaleString()} ${currency}*!`,
        `¡Has pescado un Mero Gigante! Ganaste *¥${cantidad.toLocaleString()} ${currency}*!`,
        `¡Has capturado un Pulpo azul! Ganaste *¥${cantidad.toLocaleString()} ${currency}*!`,
        `¡Sacaste una Carpa Real! Ganaste *¥${cantidad.toLocaleString()} ${currency}*!`,
        `¡Has conseguido un Pez Dragón! Ganaste *¥${cantidad.toLocaleString()} ${currency}*!`
      ]) + buffMessage;
    } else if (rand < 0.7) {
      cantidad = Math.floor(Math.random() * (6500 - 5000 + 1)) + 5000
      const total = (user.coins || 0) + (user.bank || 0)
      if (total >= cantidad) { if (user.coins >= cantidad) { user.coins -= cantidad } else { const r = cantidad - user.coins; user.coins = 0; user.bank -= r } } else { cantidad = total; user.coins = 0; user.bank = 0 }
      message = pickRandom([
        `El anzuelo se enredó y perdiste parte de tu equipo, perdiste *¥${cantidad.toLocaleString()} ${currency}*.`,
        `Una corriente fuerte arrastró tu caña, perdiste *¥${cantidad.toLocaleString()} ${currency}*.`,
        `Un pez grande rompió tu línea y dañó tu aparejo, perdiste *¥${cantidad.toLocaleString()} ${currency}*.`,
        `Tu bote se golpeó contra las rocas y tuviste que reparar, perdiste *¥${cantidad.toLocaleString()} ${currency}*.`,
        `El pez escapó y arruinó tu red, perdiste *¥${cantidad.toLocaleString()} ${currency}*.`,
        `El pez mordió el anzuelo pero se soltó y dañó tu carrete, perdiste *¥${cantidad.toLocaleString()} ${currency}*.`,
        `Tu cubeta se volcó y los peces atrapados se perdieron, perdiste *¥${cantidad.toLocaleString()} ${currency}*.`
      ])
    } else {
      message = pickRandom([
        `Pasaste la tarde pescando y observando cómo los peces nadaban cerca.`,
        `El agua estuvo tranquila y los peces se acercaban sin morder el anzuelo.`,
        `Tu jornada de pesca fue serena, los peces nadaban alrededor sin ser atrapados.`,
        `Los peces se mostraron esquivos, pero la experiencia de pesca fue agradable.`,
        `El río estuvo lleno de peces curiosos que se acercaban sin ser capturados.`
      ])
    }
    user.lastfish = Date.now() + 8 * 60 * 1000
    await client.sendMessage(m.chat, { text: `「✿」 ${message}` }, { quoted: m })
  },
}
