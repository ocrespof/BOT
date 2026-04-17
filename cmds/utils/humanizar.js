import axios from 'axios'

export default {
  command: ['humanizar', 'hum', 'humanize'],
  category: 'utils',
  run: async (client, m, args, usedPrefix, command) => {
    const text = args.join(' ').trim()
    if (!text) return m.reply(`《✧》 Por favor, ingresa el texto que deseas humanizar.\n> Ejemplo: *${usedPrefix + command}* La inteligencia artificial es un área multidisciplinaria...`)
    
    try {
      const { key } = await client.sendMessage(m.chat, { text: `⚙️ *Analizando y humanizando texto...* (Procesamiento profundo, tomará unos instantes)` }, { quoted: m })
      await m.react('⏳')
      
      const logic = `Actúa como un experto en redacción humana anti-detección y lingüística académica. Tu objetivo es "humanizar" el texto proporcionado para que los detectores de IA (como Turnitin o ZeroGPT) lo cataloguen 100% como escrito por un humano.
Utiliza un TONO ACADÉMICO, PROFESIONAL Y SOFISTICADO. No uses lenguaje coloquial. Rompe la estructura monótona típica de la IA (ráfaga y perplejidad), cambia la longitud de las oraciones dinámicamente y usa sinónimos ricos y cultos. Conserva los datos estadísticos e informativos originales.
Tu respuesta DEBE SER EXCLUSIVAMENTE en formato JSON válido, sin ningún otro texto acompañante.
El JSON debe tener la siguiente estructura exacta:
{
  "original_ai_score": "porcentaje IA del original (ej. 92%)",
  "new_ai_score": "porcentaje IA del nuevo (ej. < 5%)",
  "humanized_text": "el texto completo humanizado y redactado con lenguaje académico..."
}`;

      // Aumentado a 60 segundos por seguridad de ruteo
      const res = await axios.post("https://ai.siputzx.my.id", { 
          content: text, 
          user: "usuario", 
          prompt: logic, 
          webSearchMode: false 
      }, { timeout: 60000 });
      
      let aiResponse = res.data.result;
      
      // Limpiar posibles caracteres markdown de code-blocks si la IA comete un error léxico
      aiResponse = aiResponse.replace(/```json/gi, '').replace(/```/g, '').trim();
      
      let parsedData;
      try {
          // Extraer JSON si viene incrustado en texto plano u otra cosa
          const match = aiResponse.match(/\{[\s\S]*\}/);
          parsedData = JSON.parse(match ? match[0] : aiResponse);
      } catch (e) {
          // Fallback robusto en caso de que la respuesta escape el formato JSON por completo
          parsedData = {
              original_ai_score: "?%",
              new_ai_score: "0%",
              humanized_text: aiResponse.replace(/"humanized_text":/g, '').replace(/["{}]/g, '').trim()
          };
      }
      
      const resultMessage = `⚙️ 𝗔𝗡𝗔́𝗟𝗜𝗦𝗜𝗦 𝗗𝗘 𝗛𝗨𝗠𝗔𝗡𝗜𝗭𝗔𝗖𝗜𝗢́𝗡 ⚙️\n\n` +
                            `📊 *Resultado de Pruebas:*\n` +
                            `🔴 Huella IA Original: *${parsedData.original_ai_score}*\n` +
                            `🟢 Huella IA Humanizada: *${parsedData.new_ai_score}*\n` +
                            `──────────────────\n\n` +
                            `📝 *Texto Modificado (Académico):*\n${parsedData.humanized_text}`;
                            
      await client.sendMessage(m.chat, { text: resultMessage, edit: key })
      await m.react('✔️')
      
    } catch (e) {
      await m.react('✖️')
      m.reply(`> No se pudo humanizar el texto. El servidor de IA tardó demasiado en forjar el texto y excedió el timeout de 60s.\n> [Error: ${e.message}]`)
    }
  }
}
