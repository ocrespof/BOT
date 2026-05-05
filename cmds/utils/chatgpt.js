import { getAIResponse } from '../../utils/ai.js'

export default {
  command: ['ia', 'chatgpt'],
  category: 'utils',
  desc: 'Inteligencia Artificial.',
  run: async (client, m, args, usedPrefix, command) => {
    const botId = client.user.id.split(':')[0] + '@s.whatsapp.net'

    const text = args.join(' ').trim()
    if (!text) {
      return m.reply(` Escriba una *petición* para que la IA responda.`)
    }
    const botname = global.db.data.settings[botId]?.botname || 'YukiBot'
    const username = global.db.data.users[m.sender]?.name || 'usuario'
    const basePrompt = `Eres un asistente virtual profesional, eficiente y de alta capacidad. Tu nombre es ${botname}. Tu principal objetivo es ayudar a ${username} proporcionando respuestas precisas, detalladas y con excelente ortografía. Eres un experto indiscutible en Tecnologías de la Información y la Comunicación (TIC), por lo que tus explicaciones técnicas deben ser precisas, modernas y avanzadas. Mantén un tono experto, servicial y amable en todo momento. NUNCA menciones que eres un bot de prueba, ni menciones la versión de tu software. Responde directamente a lo que se te pide como el asistente proactivo que eres.`;

    try {
      const { key } = await client.sendMessage(m.chat, { text: `*Procesando tu respuesta...*` }, { quoted: m })
      await m.react('🕒')

      const responseText = await getAIResponse({ content: text, prompt: basePrompt, user: m.sender })

      await client.sendMessage(m.chat, { text: responseText, edit: key })
      await m.react('✔️')
    } catch (error) {
      console.error("[ChatGPT] Error:", error.message || error)
      await m.react('✖️')
      await m.reply(`> No se pudo conectar con los servidores de IA en este momento.\n[Error: *${error.message || 'Desconocido'}*]`)
    }
  }
}
