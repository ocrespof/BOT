import { downloadContentFromMessage } from '@whiskeysockets/baileys'
import pdfParse from 'pdf-parse'
import { getAIResponse } from '../../src/ai/client.js'

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
      try {
        responseText = await getAIResponse({ 
            content: "Responde de forma detallada basándote en el documento.", 
            prompt: prompt, 
            user: global.db.data.users[m.sender].name || "Estudiante" 
        })
      } catch (e) {}

      if (!responseText) return m.reply('《✧》 No pude generar una respuesta. Tal vez el documento sea extremadamente extenso y el servidor colapsó leyendo tantas páginas al mismo tiempo.')
      
      await client.reply(m.chat, responseText.trim(), m)
      await m.react('✔️')
    } catch (e) {
      m.react('❌')
      await m.reply(`> Ha ocurrido un error crítico.\n\nPudiste olvidar instalar la dependencia: abre la terminal y ejecuta *npm install pdf-parse* o *yarn add pdf-parse*. Si ya está instalada, entonces fue error de API: *${e.message}*`)
    }
  }
}
