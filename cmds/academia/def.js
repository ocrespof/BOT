import axios from 'axios'

export default {
  command: ['def', 'significado', 'diccionario'],
  category: 'academia',
  run: async (client, m, args, usedPrefix, command) => {
    let text = args.join(' ').trim()
    if (m.quoted && m.quoted.text) text = m.quoted.text;
    
    if (!text) return m.reply(`《✧》 Escribe o cita la palabra que deseas buscar.\n*Ejemplo:* ${usedPrefix + command} Hipotenusa`);
    
    try {
      await m.react('📖');
      
      const logic = "Actúa de forma precisa y objetiva como el Diccionario de la Real Academia Española. Se te entregará una palabra o frase corta. Debes devolver la respuesta en el siguiente formato riguroso sin añadir comentarios conversacionales:\n1. [Tipo gramatical] ej: Sustantivo masculino.\n2. Definición principal exacta.\n3. Una breve etimología u origen (solo si la palabra o concepto lo amerita).\n4. Un ejemplo muy breve de su uso correcto en una oración.";
      const res = await axios.post("https://ai.siputzx.my.id", { content: text, user: m.sender, prompt: logic, webSearchMode: false }, { timeout: 10000 });
      let responseText = res.data.result;
      
      if (!responseText) throw new Error("Vacio");
      
      let titulo = text.length > 25 ? "CONCEPTO" : text;
      
      await client.sendMessage(m.chat, { text: `*📕 DICCIONARIO: ${titulo.toUpperCase()}*\n\n${responseText.trim()}` }, { quoted: m });
      await m.react('✅');
    } catch (e) {
      await m.react('❌');
      m.reply(`《✧》 Error al buscar la definición. Verifica la conexión o intenta más tarde.`);
    }
  }
}
