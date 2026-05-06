import { pickRandom, formatTime, getBotCurrency } from '../../utils/tools.js';

export default {
  command: ['crime', 'crimen'],
  category: 'economia',
  desc: 'Cometer un crimen.',
  economy: true,
  run: async (client, m, args, usedPrefix, command) => {
    const user = global.db.data.users[m.sender]
    const monedas = getBotCurrency(client)
    user.lastcrime ??= 0
    const remaining = user.lastcrime - Date.now()
    if (remaining > 0) return m.reply(`Debes esperar *${formatTime(remaining)}* antes de intentar nuevamente.`)
    let baseChance = 0.4;
    if (user.title === 'title_lucky') baseChance += 0.15; // Buff: Suertudo
    // Apply luck potion buff
    if (user.luckBuff && user.luckBuff.expiresAt > Date.now()) baseChance += user.luckBuff.value;
    const éxito = Math.random() < baseChance;
    let cantidad
    if (éxito) {
      cantidad = Math.floor(Math.random() * (7500 - 5500 + 1)) + 5500
      // Apply fortune buff
      if (user.fortuneBuff && user.fortuneBuff.expiresAt > Date.now()) {
        cantidad = Math.floor(cantidad * (1 + user.fortuneBuff.value));
      }
      user.coins = (user.coins || 0) + cantidad
    } else {
      cantidad = Math.floor(Math.random() * (6000 - 4000 + 1)) + 4000
      const total = (user.coins || 0) + (user.bank || 0)
      if (total >= cantidad) { if (user.coins >= cantidad) { user.coins -= cantidad } else { const r = cantidad - user.coins; user.coins = 0; user.bank -= r } } else { cantidad = total; user.coins = 0; user.bank = 0 }
    }
    user.lastcrime = Date.now() + 7 * 60 * 1000
    const successMessages = [
      `Hackeaste un cajero automático usando un exploit del sistema y retiraste efectivo sin alertas, ganaste *¥${cantidad.toLocaleString()} ${monedas}*!`,
      `Te infiltraste como técnico en una mansión y robaste joyas mientras inspeccionabas la red, ganaste *¥${cantidad.toLocaleString()} ${monedas}*!`,
      `Simulaste una transferencia bancaria falsa y obtuviste fondos antes de que cancelaran la operación, ganaste *¥${cantidad.toLocaleString()} ${monedas}*!`,
      `Interceptaste un paquete de lujo en una recepción corporativa y lo revendiste, ganaste *¥${cantidad.toLocaleString()} ${monedas}*!`,
      `Vaciaste una cartera olvidada en un restaurante sin que nadie lo notara, ganaste *¥${cantidad.toLocaleString()} ${monedas}*!`,
      `Accediste al servidor de una tienda digital y aplicaste descuentos fraudulentos para obtener productos gratis, ganaste *¥${cantidad.toLocaleString()} ${monedas}*!`,
      `Te hiciste pasar por repartidor y sustrajiste un paquete de colección sin levantar sospechas, ganaste *¥${cantidad.toLocaleString()} ${monedas}*!`,
    ]
    const failMessages = [
      `Intentaste vender un reloj falso, pero el comprador notó el engaño y te denunció, perdiste *¥${cantidad.toLocaleString()} ${monedas}*.`,
      `Hackeaste una cuenta bancaria, pero olvidaste ocultar tu IP y fuiste rastreado, perdiste *¥${cantidad.toLocaleString()} ${monedas}*.`,
      `Robaste una mochila en un evento, pero una cámara oculta capturó todo el acto, perdiste *¥${cantidad.toLocaleString()} ${monedas}*.`,
      `Te infiltraste en una tienda de lujo, pero el sistema silencioso activó la alarma, perdiste *¥${cantidad.toLocaleString()} ${monedas}*.`,
      `Simulaste ser técnico en una mansión, pero el dueño te reconoció y llamó a seguridad, perdiste *¥${cantidad.toLocaleString()} ${monedas}*.`,
      `Planeaste un robo en una joyería, pero el guardia nocturno te descubrió, perdiste *¥${cantidad.toLocaleString()} ${monedas}*.`,
    ]
    await client.sendMessage(m.chat, { text: `「✿」 ${éxito ? pickRandom(successMessages) : pickRandom(failMessages)}` }, { quoted: m })
  },
}
