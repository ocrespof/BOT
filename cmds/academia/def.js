import { getAIResponse } from '../../utils/ai.js'

export default {
  command: ['def', 'significado', 'diccionario'],
  category: 'academia',
  desc: 'Diccionario virtual.',
  run: async (client, m, args, usedPrefix, command) => {
    let text = args.join(' ').trim()
    if (m.quoted && m.quoted.text) text = m.quoted.text;
    
    if (!text) return m.reply(` Escribe o cita la palabra que deseas buscar.\n*Ejemplo:* ${usedPrefix + command} Hipotenusa`);
    
    try {
      await m.react('📖');
      
      const logic = "Actúa como un lexicógrafo de la Real Academia Española con rigor absoluto. Formato obligatorio para cada palabra: 1. Categoría gramatical (sustantivo, verbo, adjetivo, etc. con género y número). 2. Definición principal exacta y concisa. 3. Etimología (latín, griego, árabe, etc.) si es verificable. 4. Un ejemplo de uso en contexto académico. No agregues comentarios conversacionales, emojis ni saludos. Devuelve únicamente la entrada lexicográfica.";
      const responseText = await getAIResponse({ content: text, prompt: logic, user: m.sender });
      
      if (!responseText) throw new Error("Vacio");
      
      let titulo = text.length > 25 ? "CONCEPTO" : text;
      
      await client.sendMessage(m.chat, { text: `*📕 DICCIONARIO: ${titulo.toUpperCase()}*\n\n${responseText.trim()}` }, { quoted: m });
      await m.react('✅');
    } catch (e) {
      await m.react('❌');
      m.reply(` Error al buscar la definición. Verifica la conexión o intenta más tarde.`);
    }
  }
}
