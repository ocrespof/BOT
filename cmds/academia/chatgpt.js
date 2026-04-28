import { getAIResponse } from '../../src/ai/client.js'

export default {
  command: ['ia', 'chatgpt'],
  category: 'academia',
  desc: 'Conversa con la Inteligencia Artificial (Gemini/ChatGPT)',
  usage: '.ia <mensaje>',
  run: async (client, m, args, usedPrefix, command) => {
    const text = args.join(' ').trim()
    if (!text) {
      return m.reply(`《✧》 Escriba una *petición* para que la IA responda.\n> Ejemplo: *${usedPrefix + command} explica la física cuántica*`)
    }

    const botId = client.user.id.split(':')[0] + '@s.whatsapp.net'
    const botname = global.db.data.settings[botId]?.botname || 'YukiBot'
    const username = global.db.data.users[m.sender]?.name || 'usuario'
    
    // System Instruction limpia y clara
    const basePrompt = `Eres ${botname}, un asistente virtual avanzado y erudito para WhatsApp. Debes ser preciso, amigable y usar español. Te diriges al usuario como "${username}". Sé conciso pero completo.`
    
    let key;
    try {
      const msg = await client.sendMessage(m.chat, { text: `> 🧠 *Procesando...*` }, { quoted: m })
      key = msg.key
      await m.react('🕒')
      
      const responseText = await getAIResponse({ content: text, prompt: basePrompt, user: m.sender })

      await client.sendMessage(m.chat, { text: responseText, edit: key })
      await m.react('✔️')
    } catch (e) {
      await m.react('❌')
      const errorMsg = `> Ha ocurrido un error al conectar con la IA.\n> [Error: ${e.message}]`;
      if (key) {
        await client.sendMessage(m.chat, { text: errorMsg, edit: key })
      } else {
        await m.reply(errorMsg)
      }
    }
  },
}
