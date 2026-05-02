export default {
  command: ['report', 'reporte', 'sug', 'suggest'],
  category: 'info',
  run: async (client, m, args, usedPrefix, command, text) => {
    const texto = text.trim()
    const now = Date.now()
    const cooldown = global.db.data.users[m.sender].sugCooldown || 0
    const restante = cooldown - now
    if (restante > 0) {
      return m.reply(`Espera *${msToTime(restante)}* para volver a usar este comando.`)
    }
    if (!texto) {
      return m.reply(` Debes *escribir* el *reporte* o *sugerencia*.`)
    }
    if (texto.length < 10) {
      return m.reply(' Tu mensaje es *demasiado corto*. Explica mejor tu reporte/sugerencia (mínimo 10 caracteres)')
    }
    const fecha = new Date()
    const fechaLocal = fecha.toLocaleDateString('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
    const esReporte = ['report', 'reporte'].includes(command)
    const tipo  = esReporte ? '🆁ҽ𝕡σɾƚҽ' : '🆂մց𝕖ɾҽ𝚗cíᥲ'
    const tipo2 = esReporte ? 'Reporte' : 'Sugerencia'
    const user = m.pushName || 'Usuario desconocido'
    const numero = m.sender.split('@')[0]
    const pp = await client.profilePictureUrl(m.sender, 'image').catch(() => 'https://cdn.yuki-wabot.my.id/files/2PVh.jpeg')
    let reportMsg = `🫗۫᷒ᰰ⃘ׅ᷒  ۟　\`${tipo}\`　ׅ　ᩡ\n\n𖹭  ׄ  ְ *Nombre*\n${user}\n\n𖹭  ׄ  ְ *Número*\nwa.me/${numero}\n\n𖹭  ׄ  ְ *Fecha*\n${fechaLocal}\n\n𖹭  ׄ  ְ *Mensaje*\n${texto}\n\n`
    for (const num of global.owner) {
      try {
        await global.client.sendContextInfoIndex(`${num}@s.whatsapp.net`, reportMsg, {}, null, false, null, { banner: pp, title: tipo2, body: '✧ Antento Staff, mejoren.', redes: global.db.data.settings[client.user.id.split(':')[0] + "@s.whatsapp.net"].link })
      } catch {}
    }
    global.db.data.users[m.sender].sugCooldown = now + 24 * 60 * 60000
    m.reply(` Gracias por tu *${esReporte ? 'reporte' : 'sugerencia'}*\n\nTu mensaje fue enviado correctamente a los moderadores`)
  },
}

const msToTime = (duration) => {
  const seconds = Math.floor((duration / 1000) % 60)
  const minutes = Math.floor((duration / (1000 * 60)) % 60)
  const hours = Math.floor((duration / (1000 * 60 * 60)) % 24)
  const days = Math.floor(duration / (1000 * 60 * 60 * 24))
  const s = seconds.toString().padStart(2, '0')
  const m = minutes.toString().padStart(2, '0')
  const h = hours.toString().padStart(2, '0')
  const d = days.toString()
  const parts = []
  if (days > 0) parts.push(`${d} día${d > 1 ? 's' : ''}`)
  if (hours > 0) parts.push(`${h} hora${h > 1 ? 's' : ''}`)
  if (minutes > 0) parts.push(`${m} minuto${m > 1 ? 's' : ''}`)
  parts.push(`${s} segundo${s > 1 ? 's' : ''}`)
  return parts.join(', ')
}
