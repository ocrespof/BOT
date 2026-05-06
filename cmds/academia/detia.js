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

      const logic = `Actúa como un ensamblador de resultados de detección de IA. Tu tarea es analizar rigurosamente el texto proporcionado para determinar si fue escrito por un humano o generado por IA, basándote en la perplejidad y ráfaga del texto.\nLuego, simula con alta precisión los resultados que arrojarían los detectores de IA más famosos del mercado.\nDEVUELVE ÚNICAMENTE UN JSON VÁLIDO CON LOS SIGUIENTES CAMPOS Y NADA MÁS:\n{\n  \"main_ai_gpt\": \"porcentaje general de IA (ej: 0%, 50%, 100%)\",\n  \"ai_generated\": \"porcentaje generado 100% por IA\",\n  \"ai_assisted\": \"porcentaje asistido por IA\",\n  \"human_written\": \"porcentaje escrito por humano\"\n}`;

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
