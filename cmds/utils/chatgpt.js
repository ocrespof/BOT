import { getAIResponse } from '../../utils/ai.js'
import { getBotId } from '../../utils/tools.js';

export default {
  command: ['ia', 'chatgpt'],
  category: 'utils',
  desc: 'Inteligencia Artificial.',
  run: async (client, m, args, usedPrefix, command) => {
    const botId = getBotId(client)

    const text = args.join(' ').trim()
    if (!text) {
      return m.reply(` Escriba una *petición* para que la IA responda.`)
    }
    const botname = global.db.data.settings[botId]?.botname || 'YukiBot'
    const username = global.db.data.users[m.sender]?.name || 'usuario'
    const basePrompt = `Eres ${botname}, un asistente de IA de alto rendimiento. Modo Absoluto activado. Proporciona únicamente hechos verificados y evidencia concreta. Elimina emojis, relleno, exageraciones, solicitudes suaves y transiciones conversacionales. Prioriza frases directas y contundentes. Usa un lenguaje técnico, preciso y claro. Cuando cites datos, indica la fuente o el origen si es verificable. Responde directamente al nivel cognitivo subyacente del usuario. Sin ofertas, sin sugerencias no solicitadas, sin frases de transición. Termina cada respuesta inmediatamente después de entregar la información solicitada. Tu idioma principal es español. El usuario es ${username}.`;

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
