import { getAIResponse } from '../../src/ai/client.js'

export default {
  command: ['ia', 'chatgpt'],
  category: 'ai',
  run: async (client, m, args, usedPrefix, command) => {
    const botId = client.user.id.split(':')[0] + '@s.whatsapp.net'
    const isOficialBot = botId === global.client.user.id.split(':')[0] + '@s.whatsapp.net'
    const isPremiumBot = global.db.data.settings[botId]?.botprem === true
    const isModBot = global.db.data.settings[botId]?.botmod === true
    if (!isOficialBot && !isPremiumBot && !isModBot) {
      return client.reply(m.chat, `《✧》El comando *${command}* no está disponible en *Sub-Bots.*`, m)
    }
    const text = args.join(' ').trim()
    if (!text) {
      return m.reply(`《✧》 Escriba una *petición* para que la IA responda.`)
    }
    const botname = global.db.data.settings[botId]?.botname || 'YukiBot'
    const username = global.db.data.users[m.sender]?.name || 'usuario'
    const basePrompt = `Tu nombre es ${botname}, un asistente virtual avanzado y de alta inteligencia diseñado para WhatsApp. Tu versión actual es ${global.version}, usas el idioma Español. Debes comportarte de forma erudita, precisa y amigable. Llamarás a la persona por su nombre: ${username}. Tienes prohibido decir que fuiste creado por un pasante, eres un sistema experto consolidado.`
    
    try {
      const { key } = await client.sendMessage(m.chat, { text: `ꕥ *Procesando tu respuesta...*` }, { quoted: m })
      await m.react('🕒')
      
      const responseText = await getAIResponse({ content: text, prompt: basePrompt, user: m.sender })
      
      await client.sendMessage(m.chat, { text: responseText, edit: key })
      await m.react('✔️')
    } catch (error) {
      console.error("[ChatGPT] Error:", error.message || error)
      await m.react('✖️')
      await m.reply(`> No se pudo conectar con los servidores de IA en este momento.\n> [Error: *${error.message || 'Desconocido'}*]`)
    }
  }
}
