import axios from 'axios'

export default {
  command: ['parafrasear', 'parf', 'reescribir'],
  category: 'academia',
  run: async (client, m, args, usedPrefix, command) => {
    let text = args.join(' ').trim()
    if (m.quoted && m.quoted.text) text = m.quoted.text;
    
    if (!text) return m.reply(`《✧》 Escribe o responde a un mensaje para parafrasearlo.\n*Ejemplo:* ${usedPrefix + command} La fotosíntesis es fundamental...`);
    
    try {
      const { key } = await client.sendMessage(m.chat, { text: `ꕥ *Reescritura Inteligente* procesando la semántica...` }, { quoted: m });
      await m.react('🕒');
      
      const logic = `Actúa como un lingüista académico y editor profesional avanzado. Tu objetivo es parafrasear el texto proporcionado de manera magistral.
REGLAS:
1. Cambia sustancialmente la estructura gramatical (voz activa/pasiva, orden de cláusulas).
2. Usa sinónimos sofisticados, precisos y de alto nivel.
3. Mantén intactos los hechos, datos clave y el significado central.
4. El texto resultante debe ser fluido, natural y superar sistemas de detección de plagio por su originalidad gramatical.
5. NO agregues notas, saludos ni confirmaciones. Devuelve ÚNICAMENTE el texto final parafraseado listo para usar.`;
      
      const res = await axios.post("https://ai.siputzx.my.id", { 
          content: text, 
          user: m.sender, 
          prompt: logic, 
          webSearchMode: false 
      }, { timeout: 35000 });
      
      let responseText = res.data?.result || null;
      
      if (!responseText) {
          await m.react('❌');
          return client.sendMessage(m.chat, { text: `> El motor de reescritura no pudo procesar el texto. Verifica que sea legible.`, edit: key });
      }
      
      await client.sendMessage(m.chat, { text: `*🔄 TEXTO PARAFRASEADO*\n\n${responseText.trim()}`, edit: key });
      await m.react('✔️');
    } catch (e) {
      await m.react('❌');
      m.reply(`> Error al procesar el parafraseo. El servidor podría estar temporalmente saturado.\n> [Error: ${e.message}]`);
    }
  }
}
