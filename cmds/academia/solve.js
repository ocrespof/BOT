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
      
      let responseText = null
      
      // Intentar primero con Siputzx (Usa Blackbox AI / Modelos Inteligentes)
      try {
        const res = await axios.post("https://ai.siputzx.my.id", { 
          content: text, 
          user: username, 
          prompt: systemPrompt, 
          webSearchMode: true 
        }, { timeout: 20000 })
        if (res.data && res.data.result) responseText = res.data.result
      } catch (err) { console.error("Error Siputzx Solve:", err.message) }

      // Respaldos públicos en caso de falla
      if (!responseText) {
        const apis = [
          `https://api.ryzendesu.vip/api/ai/gemini-pro?text=${encodeURIComponent(text)}`,
          `https://api.siputzx.my.id/api/ai/gemini?content=${encodeURIComponent(text)}`,
          `${global.APIs.stellar?.url}/ai/gptprompt?text=${encodeURIComponent(text)}&prompt=${encodeURIComponent(systemPrompt)}&key=${global.APIs.stellar?.key}`,
          `${global.APIs.delirius?.url}/api/ia/gpt4?query=${encodeURIComponent(text)}`,
          `https://api.siputzx.my.id/api/ai/gpt3?prompt=${encodeURIComponent(systemPrompt)}&content=${encodeURIComponent(text)}`
        ]
        
        for (const url of apis) {
          if (!url || url.includes('undefined')) continue
          try {
            const controller = new AbortController()
            const timeout = setTimeout(() => controller.abort(), 15000)
            const res = await fetch(url, { signal: controller.signal })
            const json = await res.json()
            clearTimeout(timeout)
            
            if (json?.result?.text) { responseText = json.result.text; break }
            if (json?.result) { responseText = json.result; break }
            if (json?.results) { responseText = json.results; break }
            if (json?.data) { responseText = json.data; break }
          } catch (e) { console.error("Error fallback Solve:", e.message) }
        }
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
