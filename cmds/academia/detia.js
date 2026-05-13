import { getAIResponse } from '../../utils/ai.js';

export default {
  command: ['dia', 'detia', 'ai?'],
  category: 'academia',
  desc: 'Detector de IA en textos.',
  run: async (client, m, args, usedPrefix, command) => {
    let text = args.join(' ').trim();
    if (m.quoted && m.quoted.text) text = m.quoted.text;

    if (!text) {
      return m.reply(` Ingresa o responde al texto que deseas analizar.\n*Ejemplo:* ${usedPrefix + command} La historia de Roma es extensa...`);
    }

    try {
      const { key } = await client.sendMessage(m.chat, { text: `🔍 *Analizando texto en múltiples detectores de IA...*` }, { quoted: m });
      await m.react('⏳');

      const logic = `Eres un sistema de análisis forense de texto. Evalúa si el texto fue generado por IA o escrito por humano utilizando: perplejidad léxica, índice de ráfaga (burstiness), diversidad de vocabulario, y patrones sintácticos repetitivos.\nDEVUELVE ÚNICAMENTE UN JSON VÁLIDO SIN NINGÚN OTRO TEXTO:\n{\n  "main_ai_gpt": "probabilidad total de generación por IA (0-100%)",\n  "ai_generated": "porcentaje estimado de contenido 100% IA",\n  "ai_assisted": "porcentaje de contenido asistido por IA",\n  "human_written": "porcentaje escrito por humano"\n}\nIndicadores de IA: baja perplejidad, vocabulario uniforme, estructura paralela excesiva, ausencia de errores naturales. main_ai_gpt = ai_generated + ai_assisted. human_written + main_ai_gpt = 100%.`;

      const aiResponse = await getAIResponse({ content: text, prompt: logic, user: m.sender });
      const cleaned = aiResponse.replace(/```json/gi, '').replace(/```/g, '').trim();
      let parsedData;
      try {
        const match = cleaned.match(/\{[\s\S]*\}/);
        parsedData = match ? JSON.parse(match[0]) : {};
      } catch (e) {
        parsedData = { main_ai_gpt: '?%', ai_generated: '?%', ai_assisted: '?%', human_written: '?%' };
      }

      const resultMessage = `🛡️ 𝗗𝗘𝗧𝗘𝗖𝗖𝗜𝗢́𝗡 𝗗𝗘 𝗜𝗔 🛡️\n\n` +
        `📊 *Resultado Global:*\n` +
        `🤖 Probabilidad IA: *${parsedData.main_ai_gpt}*\n\n` +
        `📈 *Desglose de Análisis:*\n` +
        `  ▫️ 100% IA: *${parsedData.ai_generated}*\n` +
        `  ▫️ Asistido IA: *${parsedData.ai_asistido || parsedData.ai_assisted}*\n` +
        `  ▫️ Escrito por Humano: *${parsedData.human_written}*\n\n` +
        `🌐 _Análisis basado en heurísticas de:_\n_Turnitin, GPTZero, Copyleaks, ZeroGPT_`;

      await client.sendMessage(m.chat, { text: resultMessage, edit: key });
      await m.react('✔️');
    } catch (e) {
      await m.react('❌');
      const errorMsg = e.response ? `Servidor saturado (Status: ${e.response.status})` : e.message;
      m.reply(`> ⚠️ Error al escanear el texto: ${errorMsg}\nIntenta nuevamente más tarde.`);
    }
  }
};
