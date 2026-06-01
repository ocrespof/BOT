/**
 * 🎓 ia_academia.js — Comandos de ayuda académica, generación y procesamiento de textos e imágenes por IA.
 * Reúne: solve, resumir, corregir, humanizar, apa, imagine
 */
import { getAIResponse } from '../../utils/ai.js';
import { formatAPA } from '../../utils/apaHelper.js';
import axios from 'axios';

const IMAGE_APIS = [
  (p) => `https://image.pollinations.ai/prompt/${encodeURIComponent(p)}?width=1024&height=1024&nologo=true&enhance=true`,
  (p) => `https://api.siputzx.my.id/api/ai/text2img?prompt=${encodeURIComponent(p)}`,
  (p) => `https://dalle.stacktoy.workers.dev/?apikey=Suhail&prompt=${encodeURIComponent(p)}`
];

const cmdSolve = {
  command: ['solve', 'solucionar', 'resolver'],
  category: 'academia', desc: 'Resuelve ecuaciones.',
  run: async (client, m, args, usedPrefix, command) => {
    const text = args.join(' ').trim();
    if (!text) {
      return m.reply(` Por favor, ingresa el problema matemático que deseas resolver.\n*Ejemplo:* ${usedPrefix + command} 2x + 5 = 15`);
    }

    try {
      await m.react('🕒');
      const { key } = await client.sendMessage(m.chat, { text: `*Procesando solución paso a paso...*` }, { quoted: m });
      
      const systemPrompt = `Eres un experto matemático con formación doctoral. Resuelve el problema con rigor académico. Estructura obligatoria: 1) Identificar el tipo de problema y los datos. 2) Plantear la estrategia de resolución. 3) Desarrollar cada paso con justificación algebraica. 4) Verificar el resultado sustituyendo en la ecuación original. 5) Enunciar la respuesta final con notación precisa. No uses emojis. No agregues comentarios motivacionales. Usa negritas solo para el resultado final. Idioma: español.`;
      
      const responseText = await getAIResponse({ content: text, prompt: systemPrompt, user: m.sender, memory: false });

      await client.sendMessage(m.chat, { text: responseText, edit: key });
      await m.react('✔️');
    } catch (error) {
      console.error("[Solve] Error:", error.message || error);
      await m.react('✖️');
      await m.reply(`> Ocurrió un error al intentar resolver el problema.\n[Error: *${error.message || 'Desconocido'}*]`);
    }
  }
};

const cmdResumir = {
  command: ['resumir', 'res', 'resumen'],
  category: 'academia', desc: 'Resumir textos largos.',
  run: async (client, m, args, usedPrefix, command) => {
    const text = args.join(' ').trim();
    if (!text) return m.reply(` Escribe o pega el texto que deseas resumir.\n*Ejemplo:* ${usedPrefix + command} La mitocondria es...`);
    
    try {
      const { key } = await client.sendMessage(m.chat, { text: `*IA* está leyendo tu texto para resumirlo...` }, { quoted: m });
      await m.react('🕒');
      const logic = "Eres un asistente académico de alto rendimiento. Analiza el texto proporcionado y extrae las ideas principales con precisión quirúrgica. Estructura: 1) Tesis o idea central (1 oración). 2) Ideas secundarias (3-5 viñetas concisas). 3) Datos clave o cifras mencionadas. Elimina información redundante o decorativa. No uses emojis. No agregues opiniones. Devuelve solo el resumen estructurado.";
      
      const responseText = await getAIResponse({ content: text, prompt: logic, user: m.sender });
      if (!responseText) return client.reply(m.chat, ' No se ha podido generar el resumen en este momento.');
      
      await client.sendMessage(m.chat, { text: `*📝 RESUMEN ESTUDIANTIL*\n\n${responseText.trim()}`, edit: key });
      await m.react('✔️');
    } catch (e) {
      await m.react('❌');
      m.reply(` Error al comunicarse con el motor de Inteligencia Artificial:\n${e.message}`);
    }
  }
};

const cmdCorregir = {
  command: ['corregir', 'corr', 'ortografia'],
  category: 'academia', desc: 'Corrector ortográfico.',
  run: async (client, m, args, usedPrefix, command) => {
    let text = args.join(' ').trim();
    if (m.quoted && m.quoted.text) text = m.quoted.text;
    if (!text) return m.reply(` Escribe o responde a un mensaje para corregirlo.\n*Ejemplo:* ${usedPrefix + command} Ola como ezta el profe`);
    
    try {
      const { key } = await client.sendMessage(m.chat, { text: `*Autocorrector* analizando...` }, { quoted: m });
      await m.react('🕒');
      
      const logic = "Actúa como un corrector de estilo profesional con nivel de publicación editorial. Corrige ortografía, gramática, puntuación, concordancia y sintaxis. Mantén el significado y tono original del autor. Devuelve ÚNICAMENTE el texto corregido en limpio, listo para copiar. No agregues notas, explicaciones, saludos ni comentarios sobre los errores encontrados.";
      const responseText = await getAIResponse({ content: text, prompt: logic, user: m.sender });
      if (!responseText) throw new Error("Vacio");
      
      await client.sendMessage(m.chat, { text: `*📝 TEXTO CORREGIDO*\n\n${responseText.trim()}`, edit: key });
      await m.react('✔️');
    } catch (e) {
      await m.react('❌');
      m.reply(` Error al corregir el texto. Intenta de nuevo.`);
    }
  }
};

const cmdHumanizar = {
  command: ['humanizar', 'hum', 'humanize', 'parafrasear', 'parf', 'reescribir'],
  category: 'academia', desc: 'Humanizar texto IA.',
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

const cmdApa = {
  command: ['apa', 'bibguru', 'citar'],
  category: 'academia', desc: 'Genera una cita APA 7ma edición de un enlace.', usage: '[url]',
  run: async (client, m, args) => {
    const url = args.join(' ').trim();
    if (!url) {
      return m.reply(` Por favor, proporciona el enlace completo (URL) del artículo que deseas citar.`);
    }
    if (!/^https?:\/\/\S+$/i.test(url)) {
      return m.reply(' La URL proporcionada no parece válida. Asegúrate de incluir http/https.');
    }
    try {
      await m.react('⏳');
      const citation = await formatAPA(url, client, m);
      await m.reply(`┌───「 🎓 *CITA APA (7ma)* 🎓 」───┐\n│\n│ ${citation}\n│\n└───────────────────────────┘`);
      await m.react('✔️');
    } catch (e) {
      await m.react('✖️');
      m.reply(`> ⚠️ Error al generar la cita: ${e.message}`);
    }
  }
};

const cmdImagine = {
  command: ['imagine', 'dibujar', 'dibuja'],
  category: 'academia', desc: 'Genera una imagen usando Inteligencia Artificial.', usage: '.imagine <texto>',
  run: async (client, m, args, usedPrefix, command) => {
    const text = args.join(' ').trim();
    if (!text) {
      return m.reply(` Escribe lo que deseas que la IA dibuje.\nEjemplo: *${usedPrefix + command} un gato astronauta en marte*`);
    }

    await m.react('🕒');
    let imageBuffer = null;

    try {
      for (const apiFn of IMAGE_APIS) {
        try {
          const url = apiFn(text);
          const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 30000 });
          if (res.data && res.data.length > 0) {
            imageBuffer = res.data;
            break;
          }
        } catch (e) {
          console.log(`Fallo un proveedor de imagen, intentando el siguiente...`);
        }
      }

      if (!imageBuffer) {
        throw new Error('Todos los proveedores de generación de imágenes fallaron.');
      }

      await client.sendMessage(
        m.chat, 
        { image: imageBuffer, caption: `🎨 *IMAGINE IA*\nPrompt: ${text}` }, 
        { quoted: m }
      );
      await m.react('✔️');
    } catch (err) {
      console.error('[IMAGINE]', err);
      await m.react('❌');
      await m.reply(`> Ha ocurrido un error al generar la imagen.\n[Error: ${err.message}]`);
    }
  }
};

export default [cmdSolve, cmdResumir, cmdCorregir, cmdHumanizar, cmdApa, cmdImagine];
