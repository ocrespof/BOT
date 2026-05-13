import { getAIResponse } from '../../utils/ai.js'

export default {
  command: ['resumir', 'res', 'resumen'],
  category: 'academia',
  desc: 'Resumir textos largos.',
  run: async (client, m, args, usedPrefix, command) => {
    const text = args.join(' ').trim()
    if (!text) return m.reply(` Escribe o pega el texto que deseas resumir.\n*Ejemplo:* ${usedPrefix + command} La mitocondria es...`)
    
    try {
      const { key } = await client.sendMessage(m.chat, { text: `*IA* está leyendo tu texto para resumirlo...` }, { quoted: m })
      await m.react('🕒')
      const logic = "Eres un asistente académico de alto rendimiento. Analiza el texto proporcionado y extrae las ideas principales con precisión quirúrgica. Estructura: 1) Tesis o idea central (1 oración). 2) Ideas secundarias (3-5 viñetas concisas). 3) Datos clave o cifras mencionadas. Elimina información redundante o decorativa. No uses emojis. No agregues opiniones. Devuelve solo el resumen estructurado.";
      
      const responseText = await getAIResponse({ content: text, prompt: logic, user: m.sender })
      
      if (!responseText) return client.reply(m.chat, ' No se ha podido generar el resumen en este momento.')
      
      await client.sendMessage(m.chat, { text: `*📝 RESUMEN ESTUDIANTIL*\n\n${responseText.trim()}`, edit: key })
      await m.react('✔️')
    } catch (e) {
      await m.react('❌')
      m.reply(` Error al comunicarse con el motor de Inteligencia Artificial:\n${e.message}`)
    }
  }
}
