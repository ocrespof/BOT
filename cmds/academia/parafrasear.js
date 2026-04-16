import axios from 'axios'

export default {
  command: ['parafrasear', 'parf', 'reescribir'],
  category: 'academia',
  run: async (client, m, args, usedPrefix, command) => {
    let text = args.join(' ').trim()
    if (m.quoted && m.quoted.text) text = m.quoted.text;
    
    if (!text) return m.reply(`《✧》 Escribe o responde a un mensaje para parafrasearlo.\n*Ejemplo:* ${usedPrefix + command} La fotosíntesis es fundamental...`);
    
    try {
      const { key } = await client.sendMessage(m.chat, { text: `ꕥ *Herramienta Anti-Plagio* procesando la entropía...` }, { quoted: m });
      await m.react('🕒');
      
      const logic = "Actúa como una herramienta anti-plagio avanzada y reescritor de ensayos. Analiza minuciosamente el texto dado y parafraséalo por completo. Cambia sustancialmente la estructura gramatical, usa sinónimos sofisticados y reordena las oraciones manteniendo el significado central e intactos los hechos o datos clave. Tu objetivo es que este texto alcance una lectura humana experta e irreconocible por sistemas genéricos pasando sistemas anti-plagio. Devuelve ÚNICAMENTE el texto parafraseado, sin notas adicionales en primera o tercera persona y sin rodeos.";
      const res = await axios.post("https://ai.siputzx.my.id", { content: text, user: m.sender, prompt: logic, webSearchMode: false }, { timeout: 20000 });
      let responseText = res.data.result;
      
      if (!responseText) throw new Error("Vacio");
      
      await client.sendMessage(m.chat, { text: `*🔄 TEXTO PARAFRASEADO*\n\n${responseText.trim()}`, edit: key });
      await m.react('✔️');
    } catch (e) {
      await m.react('❌');
      m.reply(`《✧》 Error al procesar el parafraseo. El texto podría ser demasiado complejo, intenta acortarlo.`);
    }
  }
}
