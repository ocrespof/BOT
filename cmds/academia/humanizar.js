import axios from 'axios'

export default {
  command: ['humanizar', 'hum', 'humanize', 'parafrasear', 'parf', 'reescribir'],
  category: 'academia',
  run: async (client, m, args, usedPrefix, command) => {
    let text = args.join(' ').trim()
    if (m.quoted && m.quoted.text) text = m.quoted.text

    const isParafrasear = ['parafrasear', 'parf', 'reescribir'].includes(command)

    if (!text) {
      if (isParafrasear) {
        return m.reply(`《✧》 Escribe o responde a un mensaje para parafrasearlo.\n*Ejemplo:* ${usedPrefix + command} La fotosíntesis es fundamental...`)
      } else {
        return m.reply(`《✧》 Por favor, ingresa o responde al texto que deseas humanizar.\n> Ejemplo: *${usedPrefix + command}* La inteligencia artificial es un área multidisciplinaria...`)
      }
    }
    
    try {
      const msgInit = isParafrasear 
          ? `ꕥ *Reescritura Inteligente* procesando la semántica...` 
          : `⚙️ *Analizando y humanizando texto...* (Procesamiento avanzado anti-detección)`
          
      const { key } = await client.sendMessage(m.chat, { text: msgInit }, { quoted: m })
      await m.react('⏳')
      
      const logicHum = `Eres un experto lingüista y especialista en evasión de detectores de IA (como Turnitin, GPTZero, Copyleaks). Tu tarea es reescribir ("humanizar") el texto del usuario para que sea 100% indetectable como IA, alcanzando un 0% en detectores.
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

      const logicParf = `Actúa como un lingüista académico y editor profesional avanzado. Tu objetivo es parafrasear el texto proporcionado de manera magistral.
REGLAS:
1. Cambia sustancialmente la estructura gramatical (voz activa/pasiva, orden de cláusulas).
2. Usa sinónimos sofisticados, precisos y de alto nivel.
3. Mantén intactos los hechos, datos clave y el significado central.
4. El texto resultante debe ser fluido, natural y superar sistemas de detección de plagio por su originalidad gramatical.
5. NO agregues notas, saludos ni confirmaciones. Devuelve ÚNICAMENTE el texto final parafraseado listo para usar sin ningún otro comentario ni markdown de bloque de código.`;

      const prompt = isParafrasear ? logicParf : logicHum;

      const res = await axios.post("https://ai.siputzx.my.id", { 
          content: text, 
          user: m.sender, 
          prompt: prompt, 
          webSearchMode: false 
      }, { timeout: 60000 });
      
      let aiResponse = res?.data?.result;
      
      if (!aiResponse) {
          await m.react('❌')
          return client.sendMessage(m.chat, { text: `> ⚠️ La API no devolvió una respuesta válida. Intenta de nuevo más tarde.`, edit: key })
      }
      
      let finalMessage = '';

      if (isParafrasear) {
          finalMessage = `*🔄 TEXTO PARAFRASEADO*\n\n${aiResponse.trim()}`;
      } else {
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
                  original_ai_score: "?%",
                  new_ai_score: "?%",
                  humanized_text: aiResponse.replace(/"humanized_text"\s*:\s*/g, '').replace(/[{}]/g, '').trim()
              };
          }
          
          finalMessage = `⚙️ 𝗔𝗡𝗔́𝗟𝗜𝗦𝗜𝗦 𝗗𝗘 𝗛𝗨𝗠𝗔𝗡𝗜𝗭𝗔𝗖𝗜𝗢́𝗡 ⚙️\n\n` +
                         `📊 *Resultado de Pruebas:*\n` +
                         `🔴 Huella IA Original: *${parsedData.original_ai_score || '?%'}*\n` +
                         `🟢 Huella IA Humanizada: *${parsedData.new_ai_score || '?%'}*\n` +
                         `──────────────────\n\n` +
                         `📝 *Texto Modificado:*\n${parsedData.humanized_text || parsedData}`;
      }
                             
      await client.sendMessage(m.chat, { text: finalMessage, edit: key })
      await m.react('✔️')
      
    } catch (e) {
      await m.react('❌')
      const errorMsg = e.response ? `Servidor saturado (Status: ${e.response.status})` : e.message;
      m.reply(`> ⚠️ Error al procesar el texto: ${errorMsg}\n> Si el texto es muy largo, divídelo en partes.`)
    }
  }
}
