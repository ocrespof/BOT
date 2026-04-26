// cmds/academia/humanizar.js
import { getAIResponse } from '../../src/ai/client.js';

export default {
  command: ['humanizar', 'hum', 'humanize', 'parafrasear', 'parf', 'reescribir'],
  category: 'academia',
  run: async (client, m, args, usedPrefix, command) => {
    let text = args.join(' ').trim();
    if (m.quoted && m.quoted.text) text = m.quoted.text;

    const isParafrasear = ['parafrasear', 'parf', 'reescribir'].includes(command);

    if (text.length > 2000) {
      return m.reply('⚠️ El texto supera los 2000 caracteres permitidos. Por favor, divídelo en partes más pequeñas.');
    }

    if (!text) {
      if (isParafrasear) {
        return m.reply(`《✧》 Escribe o responde a un mensaje para parafrasearlo.\n*Ejemplo:* ${usedPrefix + command} La fotosíntesis es fundamental...`);
      }
      return m.reply(`《✧》 Por favor, ingresa o responde al texto que deseas humanizar.\n> Ejemplo: *${usedPrefix + command}* La inteligencia artificial es un área multidisciplinaria...`);
    }

    try {
      const initMsg = isParafrasear
        ? `ꕥ *Reescritura Inteligente* procesando la semántica...`
        : `⚙️ *Analizando y humanizando texto...* (Procesamiento avanzado anti-detección)`;
      const { key } = await client.sendMessage(m.chat, { text: initMsg }, { quoted: m });
      await m.react('⏳');

      const logicHum = `Eres un experto lingüista y especialista en evasión de detectores de IA (como Turnitin, GPTZero, Copyleaks). Tu tarea es reescribir (\"humanizar\") el texto del usuario para que sea 100% indetectable como IA, alcanzando un 0% en detectores.\nREGLAS ESTRICTAS DE REDACCIÓN:\n1. Usa una estructura de oraciones variada (corta, media, larga) para aumentar la \"perplejidad\" y \"ráfaga\" (burstiness).\n2. Usa un tono académico, profesional, pero natural y fluido. Evita palabras cliché de IA (ej. \"en conclusión\", \"es crucial\", \"en resumen\", \"profundicemos\", \"paisaje\").\n3. Introduce ligeras imperfecciones humanas o variaciones en el ritmo de lectura sin perder el estilo académico.\n4. Mantén intactos los hechos, datos y la intención original.\nDEVUELVE ÚNICAMENTE UN JSON VÁLIDO. NINGÚN OTRO TEXTO.\nEstructura del JSON:\n{\n  \"original_ai_score\": \"Ej: 98%\",\n  \"new_ai_score\": \"Ej: 0%\",\n  \"humanized_text\": \"Tu texto humanizado aquí...\"\n}`;

      const logicParf = `Actúa como un lingüista académico y editor profesional avanzado. Tu objetivo es parafrasear el texto proporcionado de manera magistral.\nREGLAS:\n1. Cambia sustancialmente la estructura gramatical (voz activa/pasiva, orden de cláusulas).\n2. Usa sinónimos sofisticados, precisos y de alto nivel.\n3. Mantén intactos los hechos, datos clave y el significado central.\n4. El texto resultante debe ser fluido, natural y superar sistemas de detección de plagio por su originalidad gramatical.\n5. NO agregues notas, saludos ni confirmaciones. Devuelve ÚNICAMENTE el texto final parafraseado listo para usar sin ningún otro comentario ni markdown de bloque de código.`;

      const prompt = isParafrasear ? logicParf : logicHum;
      const aiResponse = await getAIResponse({ content: text, prompt, user: m.sender });

      let finalMessage = '';
      if (isParafrasear) {
        finalMessage = `*🔄 TEXTO PARAFRASEADO*\n\n${aiResponse.trim()}`;
      } else {
        const cleaned = aiResponse.replace(/```json/gi, '').replace(/```/g, '').trim();
        let parsedData;
        try {
          const match = cleaned.match(/\{[\s\S]*\}/);
          parsedData = match ? JSON.parse(match[0]) : {};
        } catch (e) {
          parsedData = { original_ai_score: '?%', new_ai_score: '?%', humanized_text: cleaned };
        }
        finalMessage = `⚙️ 𝗔𝗡𝗔́𝗟𝗜𝗦𝗜𝗦 𝗗𝗘 𝗛𝗨𝗠𝗔𝗡𝗜𝗭𝗔𝗖𝗜𝗢́𝗡 ⚙️\n\n` +
          `📊 *Resultado de Pruebas:*\n` +
          `🔴 Huella IA Original: *${parsedData.original_ai_score || '?%'}*\n` +
          `🟢 Huella IA Humanizada: *${parsedData.new_ai_score || '?%'}*\n` +
          `──────────────────\n\n` +
          `📝 *Texto Modificado:*\n${parsedData.humanized_text || parsedData}`;
      }

      await client.sendMessage(m.chat, { text: finalMessage, edit: key });
      await m.react('✔️');
    } catch (e) {
      await m.react('❌');
      const errMsg = e.response ? `Servidor saturado (Status: ${e.response.status})` : e.message;
      m.reply(`> ⚠️ Error al procesar el texto: ${errMsg}\n> Si el texto es muy largo, divídelo en partes.`);
    }
  }
};
