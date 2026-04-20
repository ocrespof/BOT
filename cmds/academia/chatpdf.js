import { downloadContentFromMessage } from '@whiskeysockets/baileys'
import pdfParse from 'pdf-parse'
import axios from 'axios'

export default {
  command: ['chatpdf', 'pdf'],
  category: 'academia',
  run: async (client, m, args, usedPrefix, command) => {
    const text = args.join(' ').trim()
    if (!text) return m.reply(`《✧》 Debes comentarme qué deseas que busque o que lea. Ej: *${usedPrefix + command} ¿De qué trata el documento?*`)
    
    const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage
    const docMessage = quoted?.documentMessage
    if (!docMessage || !docMessage.mimetype.includes('pdf')) {
      return m.reply('《✧》 Por favor, responde directamente a un documento *.PDF* con tu orden.')
    }
    
    try {
      await m.react('🕒')
      const stream = await downloadContentFromMessage(docMessage, 'document')
      let buffer = Buffer.from([])
      for await(const chunk of stream) buffer = Buffer.concat([buffer, chunk])
      
      const data = await pdfParse(buffer, { max: 15 })
      // Expandido a 15000: usa método POST para mandar fragmentos gigantes sin romper HTTP
      let pdfText = data.text.substr(0, 15000)
      if (pdfText.length === 0) return m.reply('《✧》 El archivo parece estar vacío o su texto está protegido y es invisible (imagen incrustada en pdf).')
      
      const prompt = `Soy YukiBot, un usuario de mi plataforma me envió un PDF para que lo analice. He extraído gran parte del documento original que compila esto:\n"""${pdfText}"""\n\nTu objetivo principal aquí es responder a la siguiente pregunta usando MÁXIMA PRECISIÓN basada EXCLUSIVAMENTE en el texto proporcionado: "${text}". Sé claro, ordenado e informativo.`
      
      let responseText = null
      
      // 1. Principal: Siputzx POST (Soporta payloads enormes de forma confiable)
      try {
           const res = await axios.post("https://ai.siputzx.my.id", { 
               content: "Responde de forma detallada basándote en el documento.", 
               user: global.db.data.users[m.sender].name || "Estudiante", 
               prompt: prompt, 
               webSearchMode: false 
           }, { timeout: 25000 })
           if (res.data?.status && res.data?.result) responseText = res.data.result
      } catch(e) {}

      // 2. Fallback: GET (Cortamos el prompt drásticamente para evitar 414 URI Too Long) si Siputzx falla
      if (!responseText) {
          try {
              const miniPrompt = prompt.substr(0, 2500)
              const url = `${global.APIs.stellar.url}/ai/gptprompt?text=Responde&prompt=${encodeURIComponent(miniPrompt)}&key=${global.APIs.stellar.key}`
              const resB = await axios.get(url, { timeout: 20000 })
              if (resB.data?.response) responseText = resB.data.response
              else if (resB.data?.result) responseText = resB.data.result
          } catch (e) {}
      }
      
      if (!responseText) return m.reply('《✧》 No pude generar una respuesta. Tal vez el documento sea extremadamente extenso y el servidor colapsó leyendo tantas páginas al mismo tiempo.')
      
      await client.reply(m.chat, responseText.trim(), m)
      await m.react('✔️')
    } catch (e) {
      m.react('❌')
      await m.reply(`> Ha ocurrido un error crítico.\n\nPudiste olvidar instalar la dependencia: abre la terminal y ejecuta *npm install pdf-parse* o *yarn add pdf-parse*. Si ya está instalada, entonces fue error de API: *${e.message}*`)
    }
  }
}
