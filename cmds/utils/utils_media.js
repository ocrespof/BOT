/**
 * 🎨 utils_media.js — Comandos de conversión, mejora visual e identificación de medios.
 * Reúne: tourl, toimg, hd, getpic, shazam
 */
import axios from 'axios';
import FormData from 'form-data';
import * as cheerio from 'cheerio';
import crypto from 'crypto';
import { promises as fsp } from 'fs';
import os from 'os';
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
import Acrcloud from 'acrcloud';
import { downloadContentFromMessage } from '@whiskeysockets/baileys';
import { resolveLidToRealJid } from "../../core/utils.js";

// ── CONFIGURACIÓN ACRCLOUD (SHAZAM) ──
const acr = new Acrcloud({
  host: 'identify-eu-west-1.acrcloud.com',
  access_key: 'c33c767d683f78bd17d4bd4991955d81',
  access_secret: 'bvgaIAEtADBTbLwiPGYlxupWqkNGIjT7J9Ag2vIu',
});

// ── FILE-TYPE (HD) ──
let fileTypeFromBuffer;
try {
  const ft = await import('file-type');
  fileTypeFromBuffer = ft.fileTypeFromBuffer;
} catch {
  fileTypeFromBuffer = async (buf) => {
    if (!buf || buf.length < 4) return null;
    if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47) return { ext: 'png', mime: 'image/png' };
    if (buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF) return { ext: 'jpg', mime: 'image/jpeg' };
    if (buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 && buf.length > 11 && buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50) return { ext: 'webp', mime: 'image/webp' };
    return null;
  };
}

// ── HELPER FORMATO DE BYTES (TOURL) ──
function formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / 1024 ** i).toFixed(2)} ${sizes[i]}`;
}

function generateUniqueFilename(mime) {
  const ext = mime.split("/")[1] || "bin";
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let id = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `${id}.${ext}`;
}

// ── SERVIDORES DE CARGA (TOURL) ──
async function uploadCatbox(buffer, mime) {
  const form = new FormData();
  form.append("reqtype", "fileupload");
  form.append("userhash", "c9bc208e83a7dbc7c7cc68aff");
  form.append("fileToUpload", buffer, { filename: generateUniqueFilename(mime) });
  const res = await axios.post("https://catbox.moe/user/api.php", form, { headers: form.getHeaders(), maxContentLength: Infinity, maxBodyLength: Infinity });
  if (typeof res.data !== "string" || !res.data.startsWith("https://")) {
    throw new Error("Respuesta inválida de Catbox: " + JSON.stringify(res.data));
  }
  return res.data;
}

async function uploadUguu(buffer) {
  const form = new FormData();
  form.append("files[]", buffer, generateUniqueFilename("image/jpeg"));
  const res = await axios.post("https://uguu.se/upload.php", form, { headers: form.getHeaders(), maxContentLength: Infinity, maxBodyLength: Infinity });
  const data = res.data;
  const url = data?.files?.[0]?.url;
  if (!url) throw new Error("Respuesta inválida de Uguu: " + JSON.stringify(data));
  return url;
}

async function uploadQuax(buffer, mime) {
  const form = new FormData();
  form.append("file", buffer, { filename: generateUniqueFilename(mime), contentType: mime });
  const res = await axios.post("https://qu.ax/upload.php", form, { headers: form.getHeaders(), maxContentLength: Infinity, maxBodyLength: Infinity });
  const data = res.data;
  if (!data?.files?.[0]?.url) throw new Error("Respuesta inválida de Quax: " + JSON.stringify(data));
  return data.files[0].url;
}

async function uploadAuto(buffer, mime) {
  try {
    return { link: await uploadCatbox(buffer, mime), server: "catbox" };
  } catch {
    try {
      return { link: await uploadUguu(buffer), server: "uguu" };
    } catch {
      try {
        return { link: await uploadQuax(buffer, mime), server: "quax" };
      } catch {
        throw new Error("Todos los servidores fallaron");
      }
    }
  }
}

// ── CONVERSORES STICKER (TOIMG) ──
async function webp2mp4(source) {
  let form = new FormData();
  let isUrl = typeof source === 'string' && /https?:\/\//.test(source);
  form.append('new-image-url', isUrl ? source : '');
  form.append('new-image', source, 'image.webp');  
  let res = await fetch('https://ezgif.com/webp-to-mp4', { method: 'POST', body: form });  
  let html = await res.text();
  const $ = cheerio.load(html);
  let form2 = new FormData();
  let obj = {};  
  $('form input[name]').each((i, input) => {
    const name = $(input).attr('name');
    const value = $(input).val();
    obj[name] = value;
    form2.append(name, value);
  });
  let res2 = await fetch('https://ezgif.com/webp-to-mp4/' + obj.file, { method: 'POST', body: form2 });  
  let html2 = await res2.text();
  const $2 = cheerio.load(html2);
  const videoUrl = new URL($2('div#output > p.outfile > video > source').attr('src'), res2.url).toString();  
  let videoRes = await fetch(videoUrl);
  let ab = await videoRes.arrayBuffer();
  return Buffer.from(ab);
}

async function webp2png(source) {
  let form = new FormData();
  let isUrl = typeof source === 'string' && /https?:\/\//.test(source);
  form.append('new-image-url', isUrl ? source : '');
  form.append('new-image', source, 'image.webp');  
  let res = await fetch('https://ezgif.com/webp-to-png', { method: 'POST', body: form });  
  let html = await res.text();
  const $ = cheerio.load(html);
  let form2 = new FormData();
  let obj = {};  
  $('form input[name]').each((i, input) => {
    const name = $(input).attr('name');
    const value = $(input).val();
    obj[name] = value;
    form2.append(name, value);
  });
  let res2 = await fetch('https://ezgif.com/webp-to-png/' + obj.file, { method: 'POST', body: form2 });  
  let html2 = await res2.text();
  const $2 = cheerio.load(html2);
  const imgUrl = new URL($2('div#output > p.outfile > img').attr('src'), res2.url).toString();  
  let imgRes = await fetch(imgUrl);
  let ab = await imgRes.arrayBuffer();
  return Buffer.from(ab);
}

// ── REGLAS DE MEJORA DE IMAGEN (HD) ──
async function safeFileType(buf) {
  try {
    return await fileTypeFromBuffer(buf);
  } catch {
    return null;
  }
}

async function safeJson(res) {
  const t = await res.text().catch(() => '');
  try {
    return JSON.parse(t);
  } catch {
    return { raw: t };
  }
}

function extFromMime(mime) {
  if (/png/i.test(mime)) return 'png';
  if (/webp/i.test(mime)) return 'webp';
  return 'jpg';
}

function runFfmpeg(args, timeoutMs = 60000) {
  return new Promise((resolve, reject) => {
    const p = spawn('ffmpeg', args, { stdio: ['ignore', 'ignore', 'pipe'] });
    let err = '';
    const t = setTimeout(() => {
      try {
        p.kill('SIGKILL');
      } catch {}
      reject(new Error('ffmpeg timeout'));
    }, timeoutMs);

    p.stderr.on('data', (d) => (err += d.toString()));
    p.on('error', (e) => {
      clearTimeout(t);
      reject(e);
    });
    p.on('close', (code) => {
      clearTimeout(t);
      if (code === 0) return resolve(true);
      reject(new Error(err || `ffmpeg failed (${code})`));
    });
  });
}

async function webpToPngWithFfmpeg(webpBuf, tmpDir) {
  const inPath = path.join(tmpDir, `vi_${Date.now()}_${Math.random().toString(16).slice(2)}.webp`);
  const outPath = path.join(tmpDir, `vi_${Date.now()}_${Math.random().toString(16).slice(2)}.png`);

  await fsp.writeFile(inPath, webpBuf);

  try {
    await runFfmpeg(['-y', '-i', inPath, '-frames:v', '1', outPath], 60000);
    const png = await fsp.readFile(outPath);
    return { ok: true, png };
  } catch (e) {
    return { ok: false, error: e?.message || String(e) };
  } finally {
    try {
      await fsp.unlink(inPath);
    } catch {}
    try {
      await fsp.unlink(outPath);
    } catch {}
  }
}

async function vectorinkEnhanceFromBuffer(inputBuf, inputMime) {
  const API = 'https://us-central1-vector-ink.cloudfunctions.net/upscaleImage';
  const ORIGIN = 'https://vectorink.io';
  const TIMEOUT_MS = 120000;
  const UA =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36';

  const out = {
    ok: false,
    provider: 'vectorink.io',
    meta: { request_id: crypto.randomUUID?.() || crypto.randomBytes(16).toString('hex') }
  };

  const tmpDir = path.join(os.tmpdir(), 'vectorink');
  const tmpPath = path.join(tmpDir, `img_${Date.now()}_${Math.random().toString(16).slice(2)}.${extFromMime(inputMime)}`);

  try {
    await fsp.mkdir(tmpDir, { recursive: true });
    await fsp.writeFile(tmpPath, inputBuf);

    const b64 = (await fsp.readFile(tmpPath)).toString('base64');

    const r = await fetch(API, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: '*/*',
        origin: ORIGIN,
        referer: `${ORIGIN}/`,
        'user-agent': UA
      },
      body: JSON.stringify({ data: { image: b64 } }),
      signal: AbortSignal.timeout ? AbortSignal.timeout(TIMEOUT_MS) : undefined
    });

    const j = await safeJson(r);
    if (!r.ok) {
      out.error = { step: 'request', status: r.status, body: j };
      return out;
    }

    const innerText = j?.result;
    if (typeof innerText !== 'string' || innerText.length < 10) {
      out.error = { step: 'parse', code: 'no_result', body: j };
      return out;
    }

    let inner;
    try {
      inner = JSON.parse(innerText);
    } catch {
      out.error = { step: 'parse', code: 'bad_result_json', body: j };
      return out;
    }

    const webpB64 = inner?.image?.b64_json;
    if (!webpB64) {
      out.error = { step: 'parse', code: 'no_b64', body: inner };
      return out;
    }

    const webpBuf = Buffer.from(webpB64, 'base64');

    const conv = await webpToPngWithFfmpeg(webpBuf, tmpDir);
    if (!conv.ok) {
      out.error = { step: 'convert', code: 'ffmpeg_failed', message: conv.error };
      return out;
    }

    out.ok = true;
    out.buffer = conv.png;
    out.contentType = 'image/png';
    out.result = { image_id: inner?.image?.image_id, created: inner?.created, credits: inner?.credits };
    return out;
  } catch (e) {
    out.error = { step: 'exception', message: e?.message || String(e) };
    return out;
  } finally {
    try {
      await fsp.unlink(tmpPath);
    } catch {}
  }
}

// ── SHAZAM HELPERS ──
function getAudioOrVideo(message) {
  const m = message.message || {};
  if (m.audioMessage) return { msg: m.audioMessage, type: 'audio', ext: '.mp3' };
  if (m.videoMessage) return { msg: m.videoMessage, type: 'video', ext: '.mp4' };

  const quoted = m.extendedTextMessage?.contextInfo?.quotedMessage;
  if (!quoted) return null;

  if (quoted.audioMessage) return { msg: quoted.audioMessage, type: 'audio', ext: '.mp3' };
  if (quoted.videoMessage) return { msg: quoted.videoMessage, type: 'video', ext: '.mp4' };

  return null;
}

async function downloadMedia(msg, type) {
  const stream = await downloadContentFromMessage(msg, type);
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks);
}

// ── COMANDOS DE MEDIOS ──

const cmdToUrl = {
  command: ['tourl'],
  category: 'utils', desc: 'Subir archivo a URL.',
  run: async (client, m, args, usedPrefix, command) => {
    const q = m.quoted || m;
    const mime = (q.msg || q).mimetype || '';
    if (!mime) {
      return client.reply(m.chat, ` Por favor, responde a una imagen o video con *${usedPrefix + command}  [servidor]* para convertirlo en URL.\n\n✿ Servidores disponibles:\n› catbox (permanente)\n› quax (permanente)\n› uguu (temporal, 3h)\n› auto (selecciona automáticamente)`, m);
    }    
    try {
      const media = await q.download();
      if (!media) return client.reply(m.chat, "No se pudo descargar el archivo.", m);
      const serverArg = args[0]?.toLowerCase() || "auto";
      let link, server;      
      if (serverArg === "catbox") {
        link = await uploadCatbox(media, mime);
        server = "catbox";
      } else if (serverArg === "uguu") {
        link = await uploadUguu(media);
        server = "uguu";
      } else if (serverArg === "quax") {
        link = await uploadQuax(media, mime);
        server = "quax";
      } else if (serverArg === "auto") {
        const autoRes = await uploadAuto(media, mime);
        link = autoRes.link;
        server = autoRes.server;
      } else {
        return client.reply(m.chat, `Servidor no válido. Usa: catbox, quax, uguu o auto`, m);
      }      
      const userName = m.pushName || 'Usuario';      
      const uploadMessage = `𖹭 *Upload To ${server.toUpperCase()}*\n\nׅ  ׄ  ✿   ׅ り *Link ›* ${link}\nׅ  ׄ  ✿   ׅ り *Peso ›* ${formatBytes(media.length)}\nׅ  ׄ  ✿   ׅ り *Tipo ›* ${mime.split("/")[1].toUpperCase() || "UNKNOWN"}\nׅ  ׄ  ✿   ׅ り *Solicitado por ›* ${userName}`;      
      await client.reply(m.chat, uploadMessage, m);      
    } catch (e) {
      await client.reply(m.chat, `> Error al ejecutar el comando.\n[Error: *${e.message}*]`, m);
    }
  }
};

const cmdToImg = {
  command: ['toimg', 'toimage'],
  category: 'utils', desc: 'Convertir sticker a imagen.',
  run: async (client, m) => {
    if (!m.quoted) {
      return client.reply(m.chat, ` Debes citar un sticker para convertir.`, m);
    }    
    await m.react('🕒');    
    try {
      const quoted = m.quoted;
      const buffer = await quoted.download();      
      if (!buffer) {
        await m.react('✖️');
        return client.reply(m.chat, ` No se pudo descargar el sticker.`, m);
      }      
      const isAnimated = quoted.msg && quoted.msg.isAnimated;      
      if (isAnimated) {
        const mp4Buffer = await webp2mp4(buffer);
        await client.sendMessage(m.chat, { video: mp4Buffer, caption: '*Aquí tienes ฅ^•ﻌ•^ฅ*', gifPlayback: true }, { quoted: m });
      } else {
        const pngBuffer = await webp2png(buffer);
        await client.sendMessage(m.chat, { image: pngBuffer, caption: '*Aquí tienes ฅ^•ﻌ•^ฅ*' }, { quoted: m });
      }      
      await m.react('✔️');
    } catch (error) {
      await m.react('✖️');
      client.reply(m.chat, ` Error al convertir el sticker.\n${error.message}`, m);
    }
  }
};

const cmdHd = {
  command: ['hd', 'enhance', 'remini'],
  category: 'utils', desc: 'Mejorar calidad de imagen.',
  run: async (client, m, args, usedPrefix, command) => {
    try {
      const q = m.quoted || m;
      const mime = q?.mimetype || q?.msg?.mimetype || '';

      if (!mime) return m.reply(` Responde a una *imagen* con:\n${usedPrefix + command}`);
      if (!/^image\/(jpe?g|png|webp)$/i.test(mime)) return m.reply(` El formato *${mime || 'desconocido'}* no es compatible`);

      const buffer = await q.download?.();
      if (!buffer || !Buffer.isBuffer(buffer) || buffer.length < 10) return m.reply(' No se pudo descargar la imagen');

      const ft = await safeFileType(buffer);
      const inputMime = ft?.mime || mime || 'image/jpeg';
      if (!/^image\/(jpe?g|png|webp)$/i.test(inputMime)) return m.reply(` El formato *${inputMime}* no es compatible`);

      const result = await vectorinkEnhanceFromBuffer(buffer, inputMime);

      if (!result?.ok || !result?.buffer) {
        const msg = result?.error?.code || result?.error?.step || result?.error?.message || 'error';
        return m.reply(` No se pudo *mejorar* la imagen (${msg})`);
      }

      await client.sendMessage(m.chat, { image: result.buffer, caption: null }, { quoted: m });
    } catch (e) {
      console.error(e);
      await m.reply(`> Error al ejecutar el comando.\n[Error: *${e?.message || String(e)}*]`);
    }
  }
};

const cmdGetPic = {
  command: ['pfp', 'getpic'],
  category: 'utils', desc: 'Obtener foto de perfil.',
  run: async (client, m, args) => {
    const mentioned = m.mentionedJid;
    const who2 = mentioned.length > 0 ? mentioned[0] : m.quoted ? m.quoted.sender : false;
    if (!who2) return m.reply(`Etiqueta o menciona al usuario del que quieras ver su foto de perfil.`);
    const who = who2.endsWith('@lid') ? await resolveLidToRealJid(who2, client, m.chat) : who2;
    try {
      const img = await client.profilePictureUrl(who, 'image').catch(() => null);
      if (!img)
        return client.sendMessage(m.chat, { text: `No se pudo obtener la foto de perfil de @${who.split('@')[0]}.`, mentions: [who] }, { quoted: m });
      await client.sendMessage(m.chat, { image: { url: img }, caption: null }, { quoted: m });
    } catch (e) {
      await m.reply(`Ha ocurrido un error al intentar obtener la foto de perfil.\n[Error: ${e.message}]`);
    }
  }
};

const cmdShazam = {
  command: ['shazam', 'whatmusic', 'songid'],
  category: 'utils', desc: 'Identificar canciones.',
  run: async (client, m) => {
    try {
      const media = getAudioOrVideo(m);
      if (!media) {
        return await client.sendMessage(
          m.chat,
          { text: '⚠️ *RESPONDE A UN AUDIO O VIDEO*' },
          { quoted: m }
        );
      }

      await m.react('🕒');
      const buffer = await downloadMedia(media.msg, media.type);

      const tmpDir = path.join(process.cwd(), 'tmp');
      if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

      const tmpPath = path.join(tmpDir, `${Date.now()}${media.ext}`);
      fs.writeFileSync(tmpPath, buffer);

      const res = await acr.identify(fs.readFileSync(tmpPath));
      fs.unlinkSync(tmpPath);

      const { code, msg } = res.status;
      if (code !== 0) throw msg;
      const music = res.metadata?.music?.[0];
      if (!music) throw new Error('No match found');
      
      const text = `ㅤ۟∩　ׅ　★　ׅ　🅢hazam 🅡ecognition　ׄᰙ　\n\n` +
      `𖣣ֶㅤ֯⌗ ☆  ׄ ⬭ *Canción* › ${music.title || 'NOT FOUND'}\n` +
      `𖣣ֶㅤ֯⌗ ☆  ׄ ⬭ *Artista* › ${music.artists?.map(a => a.name).join(', ') || 'NOT FOUND'}\n` +
      `𖣣ֶㅤ֯⌗ ☆  ׄ ⬭ *Álbum* › ${music.album?.name || 'NOT FOUND'}\n` +
      `𖣣ֶㅤ֯⌗ ☆  ׄ ⬭ *Lanzamiento* › ${music.release_date || 'NOT FOUND'}`;
      
      await client.sendMessage(m.chat, { text }, { quoted: m });
      await m.react('✔️');
    } catch(err) {
      console.error('[SHZ]', err);
      await m.react('❌');
      await client.sendMessage(
        m.chat,
        { text: `❌ Error al reconocer: ${err.message || err}` },
        { quoted: m }
      );
    }
  }
};

export default [cmdToUrl, cmdToImg, cmdHd, cmdGetPic, cmdShazam];
