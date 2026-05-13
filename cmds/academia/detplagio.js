import { getAIResponse } from '../../utils/ai.js'

export default {
  command: ['dplg', 'dplagio', 'plagio'],
  category: 'academia',
  desc: 'Detector de plagio.',
  run: async (client, m, args, usedPrefix, command) => {
    let text = args.join(' ').trim()
    if (m.quoted && m.quoted.text) text = m.quoted.text;
    
    if (!text) return m.reply(` Ingresa o responde al texto que deseas escanear por plagio.\n*Ejemplo:* ${usedPrefix + command} El agua es un elemento esencial...`);
    
    try {
      const { key } = await client.sendMessage(m.chat, { text: `🌐 *Escaneando la web en busca de plagio...*` }, { quoted: m });
      await m.react('⏳');
      
      const logic = `Eres un sistema de análisis de originalidad textual. Evalúa el texto proporcionado mediante análisis de patrones lingüísticos, frecuencia de frases comunes y estructura gramatical para estimar la probabilidad de plagio.
DEVUELVE ÚNICAMENTE UN JSON VÁLIDO SIN NINGÚN OTRO TEXTO:
{
  "plagiarism_percentage": "porcentaje estimado de contenido no original (ej: 0%, 25%, 80%)",
  "unique_percentage": "porcentaje de contenido original",
  "sources_found": "número estimado de fuentes coincidentes (0-10)",
  "verdict": "Evaluación objetiva en máximo 15 palabras."
}
Criterios: Si detectas frases textuales comunes en Wikipedia, libros de texto o artículos frecuentes, incrementa el porcentaje. plagiarism_percentage + unique_percentage = 100%.`;

      const aiResponse = await getAIResponse({ 
          content: text, 
          prompt: logic,
          user: m.sender 
      });

      if (!aiResponse) {
          await m.react('❌');
          return client.sendMessage(m.chat, { text: `> ⚠️ La API no devolvió un análisis. Es posible que el texto sea muy largo o haya problemas de conexión.`, edit: key });
      }

      const cleaned = aiResponse.replace(/```json/gi, '').replace(/```/g, '').trim();
      
      let parsedData;
      try {
          const match = cleaned.match(/\{[\s\S]*\}/);
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
      m.reply(`> ⚠️ Error en la detección de plagio: ${errorMsg}\nIntenta con un texto más corto o inténtalo más tarde.`)
    }
  }
}
