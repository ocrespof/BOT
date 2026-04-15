import fetch from 'node-fetch'
import axios from 'axios'

export default {
  command: ['solve', 'solucionar', 'math'],
  category: 'academia',
  run: async (client, m, args, usedPrefix, command) => {
    const text = args.join(' ').trim()
    if (!text) {
      return m.reply(`《✧》 Por favor, ingresa el problema matemático que deseas resolver.\n*Ejemplo:* ${usedPrefix + command} 2x + 5 = 15`)
    }

    try {
      await m.react('🕒')
      const { key } = await client.sendMessage(m.chat, { text: `ꕥ *Procesando solución paso a paso...*` }, { quoted: m })
      
      const botname = global.db?.data?.settings?.[client.user.id]?.botname || 'YukiBot'
      const username = global.db?.data?.users?.[m.sender]?.name || 'Usuario'
      
      const systemPrompt = `Eres un Profesor de Matemáticas experto, paciente y didáctico. Tu nombre es ${botname}. Tu objetivo es resolver problemas matemáticos de forma clara, explicando cada paso detalladamente para que el estudiante ${username} aprenda el proceso. Usa un lenguaje amable y académico. Responde en Español y usa negritas para resaltar resultados y pasos importantes.`
      
      // APIs de Alta Calidad (Nivel Inteligente)
      const apis = [
        // 1. Google Gemini (Vía Stellar - Muy preciso)
        `${global.APIs.stellar.url}/ai/gemini?text=${encodeURIComponent(text)}&prompt=${encodeURIComponent(systemPrompt)}&key=${global.APIs.stellar.key}`,
        // 2. GPT (Vía Stellar)
        `${global.APIs.stellar.url}/ai/gptprompt?text=${encodeURIComponent(text)}&prompt=${encodeURIComponent(systemPrompt)}&key=${global.APIs.stellar.key}`
      ]
      
      let responseText = null

      // Intentar primero con las APIs rápidas y avanzadas
      for (const url of apis) {
        try {
          const controller = new AbortController()
          const timeout = setTimeout(() => controller.abort(), 15000)
          const res = await fetch(url, { signal: controller.signal })
          const json = await res.json()
          clearTimeout(timeout)
          
          if (json?.response) { responseText = json.response; break }
          if (json?.result) { responseText = json.result; break }
        } catch (e) {}
      }

      // 3. Fallback: Siputzx (Blackbox AI)
      if (!responseText) {
        try {
          const res = await axios.post("https://ai.siputzx.my.id", { 
            content: text, 
            user: username, 
            prompt: systemPrompt, 
            webSearchMode: false 
          }, { timeout: 20000 })
          responseText = res.data?.result
        } catch (err) {}
      }

      if (!responseText) {
        await m.react('✖️')
        return client.sendMessage(m.chat, { text: '《✧》 No se pudo obtener una solución en este momento. Inténtalo más tarde.', edit: key })
      }

      await client.sendMessage(m.chat, { text: responseText.trim(), edit: key })
      await m.react('✔️')
      
    } catch (e) {
      console.error(e)
      await m.react('✖️')
      await m.reply(`> Ocurrió un error al intentar resolver el problema.\n> [Error: *${e.message}*]`)
    }
  }
}
