export default {
  command: [
    'alerts', 'alertas',
    'antilink', 'antienlaces', 'antilinks',
    'adminonly', 'onlyadmin'
  ],
  category: 'grupo',
  isAdmin: true,
  run: async (client, m, args, usedPrefix, command) => {
    const chatData = global.db.data.chats[m.chat]
    const stateArg = args[0]?.toLowerCase()
    const validStates = ['on', 'off', 'enable', 'disable']
    const mapTerms = {
      antilinks: 'antilinks',
      antienlaces: 'antilinks',
      antilink: 'antilinks',
      alerts: 'alerts',
      alertas: 'alerts',
      adminonly: 'adminonly',
      onlyadmin: 'adminonly'
    }
    const featureNames = {
      antilinks: 'el *AntiEnlace*',
      alerts: 'las *Alertas*',
      adminonly: 'el modo *Solo Admin*'
    }
    const featureTitles = {
      antilinks: 'AntiEnlace',
      alerts: 'Alertas',
      adminonly: 'AdminOnly'
    }
    const normalizedKey = mapTerms[command] || command
    const current = chatData[normalizedKey] === true
    const estado = current ? '✓ Activado' : '✗ Desactivado'
    const nombreBonito = featureNames[normalizedKey] || `la función *${normalizedKey}*`
    const titulo = featureTitles[normalizedKey] || normalizedKey
    if (!stateArg) {
      return client.reply(m.chat, `*✩ ${titulo} (✿❛◡❛)*\n\nUn administrador puede activar o desactivar ${nombreBonito} utilizando:\n\n● _Habilitar ›_ *${usedPrefix + normalizedKey} enable*\n● _Deshabilitar ›_ *${usedPrefix + normalizedKey} disable*\n\n❒ *Estado actual ›* ${estado}`, m)
    }
    if (!validStates.includes(stateArg)) {
      return m.reply(`Estado no válido. Usa *on*, *off*, *enable* o *disable*\n\nEjemplo:\n${usedPrefix}${normalizedKey} enable`)
    }
    const enabled = ['on', 'enable'].includes(stateArg)
    if (chatData[normalizedKey] === enabled) {
      return m.reply(`*${titulo}* ya estaba *${enabled ? 'activado' : 'desactivado'}*.`)
    }
    chatData[normalizedKey] = enabled
    return m.reply(`Has *${enabled ? 'activado' : 'desactivado'}* ${nombreBonito}.`)
  }
};