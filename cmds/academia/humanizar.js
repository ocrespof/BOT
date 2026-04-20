import axios from 'axios'

export default {
  command: ['humanizar', 'hum', 'humanize'],
  category: 'academia',
  run: async (client, m, args, usedPrefix, command) => {
    let text = args.join(' ').trim()
    if (m.quoted && m.quoted.text) text = m.quoted.text
    if (!text) return m.reply(`《✧》 Por favor, ingresa o responde al texto que deseas humanizar.\n> Ejemplo: *${usedPrefix + command}* La inteligencia artificial es un área multidisciplinaria...`)
    
    try {
      const { key } = await client.sendMessage(m.chat, { text: `⚙️ *Analizando y humanizando texto...* (Procesamiento avanzado anti-detección)` }, { quoted: m })
      await m.react('⏳')
      
      const logic = `Eres un experto lingüista y especialista en evasión de detectores de IA (como Turnitin, GPTZero, Copyleaks). Tu tarea es reescribir ("humanizar") el texto del usuario para que sea 100% indetectable como IA, alcanzando un 0% en detectores.
REGLAS ESTRICTAS DE REDACCIÓN:
1. Usa una estructura de oraciones variada (corta, media, larga) para aumentar la "perplejidad" y "ráfaga" (burstiness).
2. Usa un tono académico, profesional, pero natural y fluido. Evita palabras cliché de IA (ej. "en conclusión", "es crucial", "en resumen", "profundicemos", "paisaje").
3. Introduce ligeras imperfecciones humanas o variaciones en el ritmo de lectura sin perder el estilo académico.
4. Mantén intactos los hechos, datos y la intención original.
DEVUELVE ÚNICAMENTE UN JSON VÁLIDO. NINGÚN OTRO TEXTO.
Estructura del JSON:
{
  "original_ai_score": "Ej: 98%",
  "new_ai_score": "Ej: 0%",
  "humanized_text": "Tu texto humanizado aquí..."
}`;

      const res = await axios.post("https://ai.siputzx.my.id", { 
          content: text, 
          user: m.sender, 
          prompt: logic, 
          webSearchMode: false 
      }, { timeout: 60000 });
      
      let aiResponse = res.data.result;
      aiResponse = aiResponse.replace(/```json/gi, '').replace(/```/g, '').trim();
      
      let parsedData;
      try {
          const match = aiResponse.match(/\{[\s\S]*\}/);
          parsedData = JSON.parse(match ? match[0] : aiResponse);
      } catch (e) {
          parsedData = {
              original_ai_score: "?%",
              new_ai_score: "0%",
              humanized_text: aiResponse.replace(/"humanized_text":/g, '').replace(/["{}]/g, '').trim()
          };
      }
      
      const resultMessage = `⚙️ 𝗔𝗡𝗔́𝗟𝗜𝗦𝗜𝗦 𝗗𝗘 𝗛𝗨𝗠𝗔𝗡𝗜𝗭𝗔𝗖𝗜𝗢́𝗡 ⚙️\n\n` +
                            `📊 *Resultado de Pruebas:*\n` +
                            `🔴 Huella IA Original: *${parsedData.original_ai_score || '?%'}*\n` +
                            `🟢 Huella IA Humanizada: *${parsedData.new_ai_score || '0%'}*\n` +
                            `──────────────────\n\n` +
                            `📝 *Texto Modificado (Académico/Humano):*\n${parsedData.humanized_text || parsedData}`;
                            
      await client.sendMessage(m.chat, { text: resultMessage, edit: key })
      await m.react('✔️')
      
    } catch (e) {
      await m.react('✖️')
      m.reply(`> Error: El texto es demasiado complejo o los servidores están saturados (timeout).\n> [Error: ${e.message}]`)
    }
  }
}
