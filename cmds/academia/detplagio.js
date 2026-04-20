import axios from 'axios'

export default {
  command: ['dplg', 'dplagio', 'plagio'],
  category: 'academia',
  run: async (client, m, args, usedPrefix, command) => {
    let text = args.join(' ').trim()
    if (m.quoted && m.quoted.text) text = m.quoted.text;
    
    if (!text) return m.reply(`《✧》 Ingresa o responde al texto que deseas escanear por plagio.\n*Ejemplo:* ${usedPrefix + command} El agua es un elemento esencial...`);
    
    try {
      const { key } = await client.sendMessage(m.chat, { text: `🌐 *Escaneando la web en busca de plagio...*` }, { quoted: m });
      await m.react('⏳');
      
      const logic = `Actúa como una herramienta profesional de detección de plagio (como EditPad, Turnitin). Usa tu capacidad de evaluar patrones para determinar si fragmentos del texto proporcionado existen en internet o son copiados.
Analiza la similitud general y extrae el porcentaje de plagio.
DEVUELVE ÚNICAMENTE UN JSON VÁLIDO CON LOS SIGUIENTES CAMPOS Y NADA MÁS:
{
  "plagiarism_percentage": "porcentaje de contenido plagiado (ej: 0%, 25%, 80%)",
  "unique_percentage": "porcentaje de contenido único original",
  "sources_found": "número de fuentes estimadas (ej: 0, 2, 5)",
  "verdict": "Un breve comentario final sobre la originalidad del texto (máximo 15 palabras)."
}
Asegúrate de que plagiarism_percentage + unique_percentage sumen 100%. Debes ser estricto. Si reconoces frases exactas muy comunes o contenido de Wikipedia, aumenta el plagio.`;

      // Timeout largo porque webSearchMode requiere más tiempo
      const res = await axios.post("https://ai.siputzx.my.id", { 
          content: text, 
          user: m.sender, 
          prompt: logic, 
          webSearchMode: true 
      }, { timeout: 50000 });
      
      let aiResponse = res?.data?.result;

      if (!aiResponse) {
          await m.react('❌');
          return client.sendMessage(m.chat, { text: `> ⚠️ La API no devolvió un análisis. Es posible que el texto sea muy largo o haya problemas de conexión.`, edit: key });
      }

      aiResponse = aiResponse.replace(/```json/gi, '').replace(/```/g, '').trim();
      
      let parsedData;
      try {
          const match = aiResponse.match(/\{[\s\S]*\}/);
          if (match) {
              parsedData = JSON.parse(match[0]);
          } else {
              throw new Error("JSON no encontrado");
          }
      } catch (e) {
          parsedData = {
              plagiarism_percentage: "?%",
              unique_percentage: "?%",
              sources_found: "?",
              verdict: "El análisis fue procesado pero hubo un error extrayendo los resultados."
          };
      }
      
      const resultMessage = `🛡️ 𝗥𝗘𝗣𝗢𝗥𝗧𝗘 𝗗𝗘 𝗣𝗟𝗔𝗚𝗜𝗢 🛡️\n\n` +
                            `📑 *Plagio Detectado:* ${parsedData.plagiarism_percentage}\n` +
                            `✨ *Contenido Único:* ${parsedData.unique_percentage}\n` +
                            `🔍 *Fuentes Coincidentes:* ${parsedData.sources_found}\n\n` +
                            `*Veredicto:* ${parsedData.verdict}`;
                            
      await client.sendMessage(m.chat, { text: resultMessage, edit: key })
      await m.react('✔️')
      
    } catch (e) {
      await m.react('❌')
      const errorMsg = e.response ? `Servidor saturado (Status: ${e.response.status})` : e.message;
      m.reply(`> ⚠️ Error en la detección de plagio: ${errorMsg}\n> Intenta con un texto más corto o inténtalo más tarde.`)
    }
  }
}
