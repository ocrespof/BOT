import axios from 'axios'

export default {
  command: ['dia', 'detia', 'ai?'],
  category: 'academia',
  run: async (client, m, args, usedPrefix, command) => {
    let text = args.join(' ').trim()
    if (m.quoted && m.quoted.text) text = m.quoted.text;
    
    if (!text) return m.reply(`《✧》 Ingresa o responde al texto que deseas analizar.\n*Ejemplo:* ${usedPrefix + command} La historia de Roma es extensa...`);
    
    try {
      const { key } = await client.sendMessage(m.chat, { text: `🔍 *Analizando texto en múltiples detectores de IA...*` }, { quoted: m });
      await m.react('⏳');
      
      const logic = `Actúa como un ensamblador de resultados de detección de IA. Tu tarea es analizar rigurosamente el texto proporcionado para determinar si fue escrito por un humano o generado por IA, basándote en la perplejidad y ráfaga del texto.
Luego, simula con alta precisión los resultados que arrojarían los detectores de IA más famosos del mercado.
DEVUELVE ÚNICAMENTE UN JSON VÁLIDO CON LOS SIGUIENTES CAMPOS Y NADA MÁS:
{
  "main_ai_gpt": "porcentaje general de IA (ej: 0%, 50%, 100%)",
  "ai_generated": "porcentaje generado 100% por IA",
  "ai_assisted": "porcentaje asistido por IA",
  "human_written": "porcentaje escrito por humano"
}
Asegúrate de que la suma de ai_generated + ai_assisted + human_written sea exactamente 100%. Haz un análisis lingüístico real.`;

      const res = await axios.post("https://ai.siputzx.my.id", { 
          content: text, 
          user: m.sender, 
          prompt: logic, 
          webSearchMode: false 
      }, { timeout: 40000 });
      
      let aiResponse = res.data.result;
      aiResponse = aiResponse.replace(/```json/gi, '').replace(/```/g, '').trim();
      
      let parsedData;
      try {
          const match = aiResponse.match(/\{[\s\S]*\}/);
          parsedData = JSON.parse(match ? match[0] : aiResponse);
      } catch (e) {
          // Fallback en caso de fallo de JSON
          parsedData = {
              main_ai_gpt: "?%",
              ai_generated: "?%",
              ai_assisted: "?%",
              human_written: "?%"
          };
      }
      
      const resultMessage = `*${parsedData.main_ai_gpt} AI GPT*\n\n` +
                            `*Also checked with:*\n` +
                            `Turnitin\nCopyleaks\nOriginalityAI\nGPTZero\nCrossplag\nSapling.ai\nGowinston.ai\nZeroGPT\n\n` +
                            `*AI-generated*\n${parsedData.ai_generated}\n\n` +
                            `*AI-assisted*\n${parsedData.ai_assisted}\n\n` +
                            `*Human-written*\n${parsedData.human_written}`;
                            
      await client.sendMessage(m.chat, { text: resultMessage, edit: key })
      await m.react('✔️')
      
    } catch (e) {
      await m.react('❌')
      m.reply(`> No se pudo contactar a los servidores de detección. Intenta nuevamente más tarde.\n> [Error: ${e.message}]`)
    }
  }
}
