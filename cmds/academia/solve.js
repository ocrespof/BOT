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
      
      const systemPrompt = `Eres un experto matemático con formación doctoral. Resuelve el problema con rigor académico. Estructura obligatoria: 1) Identificar el tipo de problema y los datos. 2) Plantear la estrategia de resolución. 3) Desarrollar cada paso con justificación algebraica. 4) Verificar el resultado sustituyendo en la ecuación original. 5) Enunciar la respuesta final con notación precisa. No uses emojis. No agregues comentarios motivacionales. Usa negritas solo para el resultado final. Idioma: español.`
      
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
