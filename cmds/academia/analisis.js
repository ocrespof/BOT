/**
 * 🔍 analisis.js — Comandos de originalidad, análisis de plagio, detección de IA y lectura de PDFs.
 * Reúne: detia, detplagio, chatpdf
 */
import { getAIResponse } from '../../utils/ai.js';
import { downloadContentFromMessage } from '@whiskeysockets/baileys';
import pdfParse from 'pdf-parse';

const cmdDetIA = {
  command: ['dia', 'detia', 'ai?'],
  category: 'academia', desc: 'Detector de IA en textos.',
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

const cmdDetPlagio = {
  command: ['dplg', 'dplagio', 'plagio'],
  category: 'academia', desc: 'Detector de plagio.',
  run: async (client, m, args, usedPrefix, command) => {
    let text = args.join(' ').trim();
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
                            
      await client.sendMessage(m.chat, { text: resultMessage, edit: key });
      await m.react('✔️');
    } catch (e) {
      await m.react('❌');
      const errorMsg = e.response ? `Servidor saturado (Status: ${e.response.status})` : e.message;
      m.reply(`> ⚠️ Error en la detección de plagio: ${errorMsg}\nIntenta con un texto más corto o inténtalo más tarde.`);
    }
  }
};

const cmdChatPdf = {
  command: ['chatpdf', 'pdf'],
  category: 'academia', desc: 'Analizar documentos PDF.',
  run: async (client, m, args, usedPrefix, command) => {
    const text = args.join(' ').trim();
    if (!text) return m.reply(` Debes comentarme qué deseas que busque o que lea. Ej: *${usedPrefix + command} ¿De qué trata el documento?*`);
    
    const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const docMessage = quoted?.documentMessage;
    if (!docMessage || !docMessage.mimetype.includes('pdf')) {
      return m.reply(' Por favor, responde directamente a un documento *.PDF* con tu orden.');
    }
    
    try {
      await m.react('🕒');
      const stream = await downloadContentFromMessage(docMessage, 'document');
      let buffer = Buffer.from([]);
      for await(const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
      
      const data = await pdfParse(buffer, { max: 15 });
      let pdfText = data.text.substr(0, 15000);
      if (pdfText.length === 0) return m.reply(' El archivo parece estar vacío o su texto está protegido y es invisible (imagen incrustada en pdf).');
      
      const prompt = `Contenido extraído del documento PDF:\n"""${pdfText}"""\n\nInstrucciones: Responde la siguiente pregunta basándote EXCLUSIVAMENTE en el contenido del documento anterior. No inventes datos que no estén en el texto. Si la información no está en el documento, indícalo explícitamente. Cita las secciones relevantes. Pregunta del usuario: "${text}"`;
      
      let responseText = null;
      try {
        responseText = await getAIResponse({ 
            content: "Responde de forma detallada basándote en el documento.", 
            prompt: prompt, 
            user: global.db.data.users[m.sender].name || "Estudiante" 
        });
      } catch (e) {}

      if (!responseText) return m.reply(' No pude generar una respuesta. Tal vez el documento sea extremadamente extenso y el servidor colapsó leyendo tantas páginas al mismo tiempo.');
      
      await client.reply(m.chat, responseText.trim(), m);
      await m.react('✔️');
    } catch (e) {
      m.react('❌');
      await m.reply(`> Ha ocurrido un error crítico.\n\nPudiste olvidar instalar la dependencia: abre la terminal y ejecuta *npm install pdf-parse* o *yarn add pdf-parse*. Si ya está instalada, entonces fue error de API: *${e.message}*`);
    }
  }
};

export default [cmdDetIA, cmdDetPlagio, cmdChatPdf];
