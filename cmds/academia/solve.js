import { getAIResponse } from '../../utils/ai.js'

export default {
  command: ['solve', 'solucionar', 'resolver'],
  category: 'academia',
  desc: 'Resuelve ecuaciones.',
  run: async (client, m, args, usedPrefix, command) => {
    const text = args.join(' ').trim()
    if (!text) {
      return m.reply(` Por favor, ingresa el problema matemático que deseas resolver.\n*Ejemplo:* ${usedPrefix + command} 2x + 5 = 15`)
    }

    try {
      await m.react('🕒')
      const { key } = await client.sendMessage(m.chat, { text: `*Procesando solución paso a paso...*` }, { quoted: m })
      
      const botname = global.db?.data?.settings?.[client.user.id]?.botname || 'YukiBot'
      const username = global.db?.data?.users?.[m.sender]?.name || 'Usuario'
      
      const systemPrompt = `Eres un Profesor de Matemáticas experto, paciente y didáctico. Tu nombre es ${botname}. Tu objetivo es resolver problemas matemáticos de forma clara, explicando cada paso detalladamente para que el estudiante ${username} aprenda el proceso. Usa un lenguaje amable y académico. Responde en Español y usa negritas para resaltar resultados y pasos importantes.`
      
      const responseText = await getAIResponse({ content: text, prompt: systemPrompt, user: m.sender, memory: false })

      await client.sendMessage(m.chat, { text: responseText, edit: key })
      await m.react('✔️')
      
    } catch (error) {
      console.error("[Solve] Error:", error.message || error)
      await m.react('✖️')
      await m.reply(`> Ocurrió un error al intentar resolver el problema.\n[Error: *${error.message || 'Desconocido'}*]`)
    }
  }
}
