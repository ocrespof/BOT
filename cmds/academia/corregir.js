import { getAIResponse } from '../../utils/ai.js'

export default {
  command: ['corregir', 'corr', 'ortografia'],
  category: 'academia',
  desc: 'Corrector ortográfico.',
  run: async (client, m, args, usedPrefix, command) => {
    let text = args.join(' ').trim()
    if (m.quoted && m.quoted.text) text = m.quoted.text;
    
    if (!text) return m.reply(` Escribe o responde a un mensaje para corregirlo.\n*Ejemplo:* ${usedPrefix + command} Ola como ezta el profe`);
    
    try {
      const { key } = await client.sendMessage(m.chat, { text: `*Autocorrector* analizando...` }, { quoted: m });
      await m.react('🕒');
      
      const logic = "Actúa como un profesor de lengua experto. Toma el texto proporcionado y corrígelo, solucionando errores de ortografía, gramática, signos de puntuación y sintaxis. Devuelve ÚNICAMENTE el texto corregido en limpio, listo para copiar y pegar, sin notas adicionales ni comillas extra.";
      const responseText = await getAIResponse({ content: text, prompt: logic, user: m.sender });
      
      if (!responseText) throw new Error("Vacio");
      
      await client.sendMessage(m.chat, { text: `*📝 TEXTO CORREGIDO*\n\n${responseText.trim()}`, edit: key });
      await m.react('✔️');
    } catch (e) {
      await m.react('❌');
      m.reply(` Error al corregir el texto. Intenta de nuevo.`);
    }
  }
}
