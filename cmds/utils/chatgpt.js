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
    const basePrompt = `Tu nombre es ${botname}, un asistente virtual avanzado y de alta inteligencia diseñado para WhatsApp. Usas el idioma Español. Debes comportarte de forma erudita, precisa y amigable. Llamarás a la persona por su nombre: ${username}. Tienes prohibido decir que fuiste creado por un pasante, eres un sistema experto consolidado.`
    try {
      const { key } = await client.sendMessage(m.chat, { text: `ꕥ *ChatGPT* está procesando tu respuesta...` }, { quoted: m })
      await m.react('🕒')
      const prompt = `${basePrompt}. Responde: ${text}`
      // Secuencia de APIs avanzadas
      const apis = [
        // 1. Google Gemini (Vía Stellar)
        `${global.APIs.stellar.url}/ai/gemini?text=${encodeURIComponent(text)}&prompt=${encodeURIComponent(basePrompt)}&key=${global.APIs.stellar.key}`,
        // 2. GPT (Vía Stellar)
        `${global.APIs.stellar.url}/ai/gptprompt?text=${encodeURIComponent(text)}&prompt=${encodeURIComponent(basePrompt)}&key=${global.APIs.stellar.key}`
      ]
      
      let responseText = null
      
      // Intentar primero con las APIs avanzadas rápidas
      for (const url of apis) {
        try {
          const controller = new AbortController()
          const timeout = setTimeout(() => controller.abort(), 15000)
          const res = await fetch(url, { signal: controller.signal })
          const json = await res.json()
          clearTimeout(timeout)
          
          if (json?.response) { responseText = json.response; break }
          if (json?.result?.text) { responseText = json.result.text; break }
          if (json?.result) { responseText = json.result; break }
        } catch (err) { }
      }

      // 3. Fallback: Blackbox AI (Siputzx) si lo anterior falla
      if (!responseText) {
        try {
          responseText = await luminsesi(text, username, basePrompt)
        } catch (err) { }
      }
      
      if (!responseText) return client.reply(m.chat, '《✧》 No se pudo obtener una *respuesta* válida')
      await client.sendMessage(m.chat, { text: responseText.trim(), edit: key })
      await m.react('✔️')
    } catch (e) {
      await m.react('❌')
      await m.reply(`> Ha ocurrido un error inesperado al procesar tu solicitud con *ChatGPT*.\n> [Error: ${e.message}]`)
    }
  },
}

async function luminsesi(q, username, logic) {
  const res = await axios.post("https://ai.siputzx.my.id", { content: q, user: username, prompt: logic, webSearchMode: true }, { timeout: 15000 })
  return res.data.result
}
