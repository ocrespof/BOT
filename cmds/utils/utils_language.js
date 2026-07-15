/**
 * 🌐 utils_language.js — Comandos lingüísticos, traducción, OCR e Inteligencia Artificial.
 * Reúne: chatgpt, ocr, translate, say
 */
import { getAIResponse } from '../../utils/ai.js';
import { getBotId, getGroupMeta } from '../../utils/tools.js';
import FormData from 'form-data';
import translate from '@vitalets/google-translate-api';

const langs = { typescript: 'ts', javascript: 'js', python: 'py', html: 'html', css: 'css', java: 'java', cpp: 'cpp', c: 'c', json: 'json', bash: 'sh', sql: 'sql', rust: 'rs', go: 'go', php: 'php', ruby: 'rb' };

function detectLanguage(query, response) {
  const q = query.toLowerCase();
  const r = response;
  if (/typescript/i.test(q)) return 'typescript';
  if (/\bpython\b/i.test(q)) return 'python';
  if (/\bhtml\b/i.test(q)) return 'html';
  if (/\bcss\b/i.test(q)) return 'css';
  if (/\bjava\b(?!script)/i.test(q)) return 'java';
  if (/\bc\+\+|cpp\b/i.test(q)) return 'cpp';
  if (/\bjson\b/i.test(q)) return 'json';
  if (/\bbash\b|\bshell\b/i.test(q)) return 'bash';
  if (/\bsql\b/i.test(q)) return 'sql';
  if (/\brust\b/i.test(q)) return 'rust';
  if (/\bgolang\b|\bgo\b/i.test(q)) return 'go';
  if (/\bphp\b/i.test(q)) return 'php';
  if (/\bruby\b/i.test(q)) return 'ruby';
  if (/javascript/i.test(q)) return 'javascript';
  const asksCode = /(c[oó]digo|code|programa|script|funci[oó]n|clase|m[eé]todo|algoritmo|actualiza|edita|crea|implementa)/i.test(q);
  if (!asksCode) return null;
  if (/def |import \w+\n|print\s*\(|:\n\s{4}/i.test(r)) return 'python';
  if (/<html|<div|<body|<span|<head/i.test(r)) return 'html';
  if (/\{[\s\S]*color:|margin:|padding:|font-/i.test(r)) return 'css';
  if (/public\s+class|System\.out\.print/i.test(r)) return 'java';
  if (/#include\s*<|int main\s*\(/i.test(r)) return 'cpp';
  if (/SELECT |INSERT |UPDATE |DELETE |CREATE TABLE/i.test(r)) return 'sql';
  if (/fn main\(\)|let mut |println!\(/i.test(r)) return 'rust';
  if (/func \w+\(|package main|fmt\.Print/i.test(r)) return 'go';
  if (/<\?php|\$[a-z_]+\s*=/i.test(r)) return 'php';
  if (/def initialize|\.each do |puts /i.test(r)) return 'ruby';
  if (/\{["'][\w]+["']\s*:/i.test(r) && !/function|const|let|var/.test(r)) return 'json';
  if (/function|class\s+\w|const |let |var |=>|\bimport\b|\bexport\b|console\.log/i.test(r)) {
    return /:\s*(string|number|boolean|void|any)\b|interface\s+\w|<\w+>/i.test(r) ? 'typescript' : 'javascript';
  }
  return null;
}

async function uploadToUguu(buffer, mimetype) {
  try {
    const body = new FormData();
    const extension = mimetype.split('/')[1] || 'jpg';
    body.append('files[]', buffer, `file.${extension}`);
    const res = await fetch('https://uguu.se/upload.php', { method: 'POST', body });
    const json = await res.json();
    return json.files?.[0]?.url ?? null;
  } catch {
    return null;
  }
}

const cmdChatGPT = {
  command: ['ia', 'chatgpt'],
  category: 'utils', desc: 'Inteligencia Artificial.',
  run: async (client, m, args) => {
    const botId = getBotId(client);
    const text = args.join(' ').trim();
    if (!text) {
      return m.reply(` Escriba una *petición* para que la IA responda.`);
    }
    const botname = global.db.data.settings[botId]?.botname || 'YukiBot';
    const username = global.db.data.users[m.sender]?.name || 'usuario';
    const basePrompt = `Eres ${botname}, un asistente de IA de alto rendimiento. Modo Absoluto activado. Proporciona únicamente hechos verificados y evidencia concreta. Elimina emojis, relleno, exageraciones, solicitudes suaves y transiciones conversacionales. Prioriza frases directas y contundentes. Usa un lenguaje técnico, preciso y claro. Cuando cites datos, indica la fuente o el origen si es verificable. Responde directamente al nivel cognitivo subyacente del usuario. Sin ofertas, sin sugerencias no solicitadas, sin frases de transición. Termina cada respuesta inmediatamente después de entregar la información solicitada. Tu idioma principal es español. El usuario es ${username}.`;

    try {
      const { key } = await client.sendMessage(m.chat, { text: `*Procesando tu respuesta...*` }, { quoted: m });
      await m.react('🕒');

      let imageBuffer = null;
      const quotedMsg = m.quoted ? m.quoted : null;
      if (quotedMsg && (quotedMsg.message?.imageMessage || quotedMsg.message?.videoMessage || quotedMsg.mtype === 'imageMessage' || quotedMsg.mtype === 'videoMessage')) {
        const media = quotedMsg.message?.imageMessage || quotedMsg.message?.videoMessage || quotedMsg;
        const buffer = await quotedMsg.download();
        if (buffer) {
          const uploadUrl = await uploadToUguu(buffer, media.mimetype || 'image/jpeg');
          if (uploadUrl) imageBuffer = uploadUrl;
        }
      }

      const responseText = await getAIResponse({ content: text, prompt: basePrompt, user: m.sender, imageBuffer });

      if (!responseText) {
        throw new Error("No se pudo obtener una respuesta válida.");
      }

      const clean = responseText.trim();
      const lang = detectLanguage(text, clean);
      if (lang) {
        const ext = langs[lang] ?? 'txt';
        const filename = `respuesta.${ext}`;
        const tableData = { title: '✎ ChatGPT', headers: ['Campo', 'Valor'], rows: [ ['Lenguaje', lang], ['Líneas', String(clean.split('\n').length)], ['Caracteres', String(clean.length)], ], };
        await client.sendMessage(m.chat, { text: `*ChatGPT* · respuesta en *${lang}*`, edit: key });
        await client.sendCodeMessage(m.chat, filename, clean, m, tableData);
      } else {
        await client.sendMessage(m.chat, { text: clean, edit: key });
      }
      await m.react('✔️');
    } catch (error) {
      console.error("[ChatGPT] Error:", error.message || error);
      await m.react('✖️');
      await m.reply(`> No se pudo conectar con los servidores de IA en este momento.\n[Error: *${error.message || 'Desconocido'}*]`);
    }
  }
};

const cmdOcr = {
  command: ['ocr', 'texto', 'escaner'],
  category: 'utils', desc: 'Extraer texto de imagen.',
  run: async (client, m) => {
    let q = m.quoted ? m.quoted : m;
    let mime = (q.msg || q).mimetype || '';
    if (!mime.startsWith('image/')) return m.reply(' Por favor, responde a una imagen con texto visible que desees extraer.');
    
    try {
      await m.react('⏳');
      const buffer = await q.download();
      if (!buffer) return m.reply(' No se pudo encontrar y descargar la imagen.');
      
      const form = new FormData();
      form.append('apikey', 'helloworld');
      form.append('file', buffer, { filename: 'imagen.jpg', contentType: 'image/jpeg' });
      form.append('language', 'spa');
      form.append('isOverlayRequired', 'false');
      
      let res = await fetch('https://api.ocr.space/parse/image', {
        method: 'POST',
        body: form,
        timeout: 30000 
      });
      let data = await res.json();
      
      if (data.IsErroredOnProcessing || !data.ParsedResults || !data.ParsedResults[0]) {
        await m.react('✖️');
        return m.reply('> No se detectó topografía legible o el escaner gratuito colapsó temporalmente por saturación de tráfico.');
      }
      
      const text = data.ParsedResults[0].ParsedText || '';
      if (text.trim() === '') {
        await m.react('✖️');
        return m.reply('> La imagen fue procesada a fondo, pero sus caracteres no lograron conformar palabras inteligibles.');
      }
      
      await m.reply(`🔎 *Texto Extraído (OCR Scanner):*\n──────────────────\n${text.trim()}`);
      await m.react('✔️');
    } catch (e) {
      await m.react('✖️');
      m.reply(`> Ocurrió un fallo en el procesador óptico y la conexión.\n[Error: ${e.message}]`);
    }
  }
};

const cmdTranslate = {
  command: ['translate', 'trad', 'traducir'],
  category: 'utils', desc: 'Traducir texto.',
  run: async (client, m, args) => {
    const defaultLang = 'es';
    if (!args[0] && !m.quoted) return m.reply(' Ingresa el idioma seguido del texto que quieras traducir.');
    let lang = args[0];
    let text = args.slice(1).join(' ') || m.quoted?.text;
    if ((lang || '').length !== 2) {
      lang = defaultLang;
      text = args.join(' ') || m.quoted?.text;
    }
    try {
      await m.react('🕒');
      const result = await translate(text, { to: lang, autoCorrect: true });
      await client.sendMessage(m.chat, { text: result.text }, { quoted: m });
      await m.react('✔️');
    } catch (e) {
      await m.react('✖️');
      await m.reply(`> Error al ejecutar el comando.\n[Error: *${e.message}*]`);
    }
  }
};

const cmdSay = {
  command: ['say', 'decir'],
  category: 'grupo', desc: 'Texto a voz.',
  run: async (client, m, args) => {
    const groupMetadata = m.isGroup ? await getGroupMeta(client, m.chat) : null;
    const groupParticipants = groupMetadata?.participants || [];
    const allMentions = groupParticipants.map(p => client.decodeJid(p.jid || p.id || p.lid || p.phoneNumber)).filter(Boolean);
    const userText = (args.join(' ') || '').trim();
    const src = m.quoted || m;
    const hasImage = Boolean(src.message?.imageMessage || src.mtype === 'imageMessage');
    const hasVideo = Boolean(src.message?.videoMessage || src.mtype === 'videoMessage');
    const hasAudio = Boolean(src.message?.audioMessage || src.mtype === 'audioMessage');
    const hasSticker = Boolean(src.message?.stickerMessage || src.mtype === 'stickerMessage');
    const isQuoted = Boolean(m.quoted);
    const originalText = (src.caption || src.text || src.body || '').trim();
    const textToCheck = (userText || originalText || '').trim();
    const explicitMentions = allMentions.filter(jid => textToCheck.includes(jid.split('@')[0]));
    try {
      const options = { quoted: null, mentions: explicitMentions.length ? explicitMentions : [] };
      if (hasImage || hasVideo) {
        const media = await src.download();
        if (hasImage) {
          return client.sendMessage(m.chat, { image: media, caption: textToCheck || '', ...options });
        } else {
          return client.sendMessage(m.chat, { video: media, mimetype: 'video/mp4', caption: textToCheck || '', ...options });
        }
      }
      if (hasAudio) {
        const media = await src.download();
        return client.sendMessage(m.chat, { audio: media, mimetype: 'audio/mp4', fileName: 'hidetag.mp3', ...options });
      }
      if (hasSticker) {
        const media = await src.download();
        return client.sendMessage(m.chat, { sticker: media, ...options });
      }
      if (textToCheck) {
        return client.sendMessage(m.chat, { text: textToCheck, ...options });
      }
      return m.reply(' Por favor, escribe el texto que deseas repetir.');
    } catch (e) {
      return m.reply(`> Error al ejecutar el comando.\n[Error: *${e.message}*]`);
    }
  }
};

export default [cmdChatGPT, cmdOcr, cmdTranslate, cmdSay];
