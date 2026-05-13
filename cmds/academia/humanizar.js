// cmds/academia/humanizar.js
import { getAIResponse } from '../../utils/ai.js';

export default {
  command: ['humanizar', 'hum', 'humanize', 'parafrasear', 'parf', 'reescribir'],
  category: 'academia',
  desc: 'Humanizar texto IA.',
  run: async (client, m, args, usedPrefix, command) => {
    let text = args.join(' ').trim();
    if (m.quoted && m.quoted.text) text = m.quoted.text;

    const isParafrasear = ['parafrasear', 'parf', 'reescribir'].includes(command);

    if (text.length > 2000) {
      return m.reply('⚠️ El texto supera los 2000 caracteres permitidos. Por favor, divídelo en partes más pequeñas.');
    }

    if (!text) {
      if (isParafrasear) {
        return m.reply(` Escribe o responde a un mensaje para parafrasearlo.\n*Ejemplo:* ${usedPrefix + command} La fotosíntesis es fundamental...`);
      }
      return m.reply(` Por favor, ingresa o responde al texto que deseas humanizar.\nEjemplo: *${usedPrefix + command}* La inteligencia artificial es un área multidisciplinaria...`);
    }

    try {
      const initMsg = isParafrasear
        ? `*Reescritura Inteligente* procesando la semántica...`
        : `⚙️ *Analizando y humanizando texto...* (Procesamiento avanzado anti-detección)`;
      const { key } = await client.sendMessage(m.chat, { text: initMsg }, { quoted: m });
      await m.react('⏳');

      const logicHum = `Eres un especialista en lingüística computacional y evasión de detectores de IA. Reescribe el texto para hacerlo indetectable como IA.
TÉCNICAS OBLIGATORIAS:
1. Variar longitud de oraciones (3-25 palabras) para maximizar burstiness.
2. Insertar conectores naturales del habla académica española (no obstante, cabe señalar, en efecto).
3. Sustituir vocabulario genérico de IA por terminología específica del dominio.
4. Eliminar patrones paralelos y estructuras repetitivas.
5. Mantener hechos, datos y significado original intactos.
6. Tono: académico profesional, no conversacional.
DEVUELVE ÚNICAMENTE JSON VÁLIDO:
{
  "original_ai_score": "Ej: 98%",
  "new_ai_score": "Ej: 0%",
  "humanized_text": "Texto reescrito aquí"
}`;

      const logicParf = `Eres un editor académico profesional. Parafrasea el texto con transformación estructural profunda. Técnicas: 1) Inversión sintáctica de cláusulas. 2) Sustitución por sinónimos de registro equivalente. 3) Conversión entre voz activa y pasiva. 4) Reestructuración de párrafos manteniendo coherencia lógica. Mantener hechos y datos intactos. Devuelve ÚNICAMENTE el texto parafraseado final sin notas, saludos ni bloques de código.`;

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
      m.reply(`> ⚠️ Error al procesar el texto: ${errMsg}\nSi el texto es muy largo, divídelo en partes.`);
    }
  }
};
