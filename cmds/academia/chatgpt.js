import { getAIResponse } from '../../src/ai/client.js'

export default {
  command: ['ia', 'chatgpt'],
  category: 'academia',
  isPrivate: true,
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
      return m.reply(`《✧》 Escriba una *petición* para que *ChatGPT* le responda.`)
    }
    const botname = global.db.data.settings[botId]?.botname || 'Bot'
    const username = global.db.data.users[m.sender].name || 'usuario'
    const basePrompt = `Tu nombre es ${botname}, un asistente virtual avanzado y de alta inteligencia diseñado para WhatsApp. Usas el idioma Español. Debes comportarte de forma erudita, precisa y amigable. Llamarás a la persona por su nombre: ${username}. Tienes prohibido decir que fuiste creado por un pasante, eres un sistema experto consolidado.`
    
    let key;
    try {
      const msg = await client.sendMessage(m.chat, { text: `ꕥ *ChatGPT* está procesando tu respuesta...` }, { quoted: m })
      key = msg.key
      await m.react('🕒')
      const prompt = `${basePrompt}. Responde: ${text}`
      
      const responseText = await getAIResponse({ content: text, prompt: basePrompt, user: m.sender })

      await client.sendMessage(m.chat, { text: responseText.trim(), edit: key })
      await m.react('✔️')
    } catch (e) {
      await m.react('❌')
      if (key) {
        await client.sendMessage(m.chat, { text: `> Ha ocurrido un error inesperado al procesar tu solicitud con *ChatGPT*.\n> [Error: ${e.message}]`, edit: key })
      } else {
        await m.reply(`> Ha ocurrido un error inesperado al procesar tu solicitud con *ChatGPT*.\n> [Error: ${e.message}]`)
      }
    }
  },
}
