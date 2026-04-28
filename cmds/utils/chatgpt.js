import fetch from 'node-fetch'
import axios from 'axios'

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
      return m.reply(`《✧》 Escriba una *petición* para que *ChatGPT* le responda.`)
    }
    const botname = global.db.data.settings[botId]?.botname || 'Bot'
    const username = global.db.data.users[m.sender].name || 'usuario'
    const basePrompt = `Tu nombre es ${botname}, un asistente virtual avanzado y de alta inteligencia diseñado para WhatsApp. Tu versión actual es ${version}, usas el idioma Español. Debes comportarte de forma erudita, precisa y amigable. Llamarás a la persona por su nombre: ${username}. Tienes prohibido decir que fuiste creado por un pasante, eres un sistema experto consolidado.`
    try {
      const { key } = await client.sendMessage(m.chat, { text: `ꕥ *ChatGPT* está procesando tu respuesta...` }, { quoted: m })
      await m.react('🕒')
      const prompt = `${basePrompt}. Responde: ${text}`
      let responseText = null
      
      // Intentar primero con Siputzx (Usa Blackbox AI / Modelos Inteligentes)
      try {
        const res = await axios.post("https://ai.siputzx.my.id", { 
          content: text, 
          user: username, 
          prompt: prompt, 
          webSearchMode: true 
        }, { timeout: 15000 })
        if (res.data && res.data.result) responseText = res.data.result
      } catch (err) { console.error("Error Siputzx:", err.message) }

      // Respaldos públicos en caso de falla
      if (!responseText) {
        const apis = [
          `https://api.ryzendesu.vip/api/ai/gemini-pro?text=${encodeURIComponent(text)}`,
          `https://api.siputzx.my.id/api/ai/gemini?content=${encodeURIComponent(text)}`,
          `${global.APIs.stellar?.url}/ai/gptprompt?text=${encodeURIComponent(text)}&prompt=${encodeURIComponent(basePrompt)}&key=${global.APIs.stellar?.key}`,
          `${global.APIs.delirius?.url}/api/ia/gpt4?query=${encodeURIComponent(text)}`,
          `https://api.siputzx.my.id/api/ai/gpt3?prompt=${encodeURIComponent(basePrompt)}&content=${encodeURIComponent(text)}`
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
          } catch (err) { console.error("Error fallback:", err.message) }
        }
      }
      
      if (!responseText) return client.sendMessage(m.chat, { text: '《✧》 No se pudo obtener una respuesta de la IA. Inténtalo más tarde.', edit: key })
      await client.sendMessage(m.chat, { text: responseText.trim(), edit: key })
      await m.react('✔️')
    } catch (e) {
      await m.reply(`> An unexpected error occurred while executing command *${usedPrefix + command}*. Please try again or contact support if the issue persists.\n> [Error: *${e.message}*]`)
    }
  },
}

async function luminsesi(q, username, logic) {
  const res = await axios.post("https://ai.siputzx.my.id", { content: q, user: username, prompt: logic, webSearchMode: true }, { timeout: 15000 })
  return res.data.result
}
