import { getBotCurrency } from '../../utils/tools.js';

export default {
  command: ['cf', 'flip', 'coinflip'],
  category: 'economia',
  desc: 'Lanzar una moneda.',
  economy: true,
  run: async (client, m, args, usedPrefix, command) => {
    const user = global.db.data.users[m.sender]
    const monedas = getBotCurrency(client)
    let cantidad, eleccion
    const a0 = parseFloat(args[0]), a1 = parseFloat(args[1])
    if (!isNaN(a0)) { cantidad = a0; eleccion = (args[1] || '').toLowerCase() }
    else if (!isNaN(a1)) { cantidad = a1; eleccion = (args[0] || '').toLowerCase() }
    else return m.reply(`Cantidad inválida, ingresa un número válido.\nEjemplo *${usedPrefix + command} 200 cara* o *${usedPrefix + command} cruz 200*`)
    if (Math.abs(cantidad) < 100) return m.reply(`La cantidad mínima para apostar es *100 ${monedas}*.`)
    if (!['cara', 'cruz'].includes(eleccion)) return m.reply(`Elección inválida. Solo se admite *cara* o *cruz*.\nEjemplo *${usedPrefix + command} 200 cara*`)
    if (cantidad > (user.coins || 0)) return m.reply(`No tienes suficientes *${monedas}* fuera del banco para apostar, tienes *¥${(user.coins || 0).toLocaleString()} ${monedas}*.`)
    const resultado = Math.random() < 0.5 ? 'cara' : 'cruz'
    const acierto = resultado === eleccion
    const cambio = acierto ? cantidad : -cantidad
    user.coins = (user.coins || 0) + cambio
    if (user.coins < 0) user.coins = 0
    const cap = t => t.charAt(0).toUpperCase() + t.slice(1)
    await client.sendMessage(m.chat, { text: `「✿」La moneda ha caído en *${cap(resultado)}* y has ${acierto ? 'ganado' : 'perdido'} *¥${Math.abs(cambio).toLocaleString()} ${monedas}*!\nTu elección fue *${cap(eleccion)}*` }, { quoted: m })
  },
}
