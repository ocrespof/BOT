import axios from 'axios';
import moment from 'moment-timezone';
import { sizeFormatter } from 'human-readable';
import util from 'util';
import * as Jimp from 'jimp';
import Logger from './logger.js';

export const unixTimestampSeconds = (date = new Date()) => Math.floor(date.getTime() / 1000);

export function generateMessageTag(epoch) {
  let tag = unixTimestampSeconds().toString();
  if (epoch) tag += '.--' + epoch;
  return tag;
}

export function processTime(timestamp, now) {
  return moment.duration(now - moment(timestamp * 1000)).asSeconds();
}

export function getRandom(ext) {
  return `${Math.floor(Math.random() * 10000)}${ext}`;
}

export async function getBuffer(url, options) {
  try {
    options = options ? options : {};
    const res = await axios({ method: 'get', url, headers: { DNT: 1, 'Upgrade-Insecure-Request': 1 }, timeout: 15000, ...options, responseType: 'arraybuffer'});
    return res.data;
  } catch (err) {
    throw err;
  }
}

export async function fetchJson(url, options) {
  try {
    options = options ? options : {};
    const res = await axios({ method: 'GET', url: url, headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36' }, timeout: 15000, ...options });
    return res.data;
  } catch (err) {
    throw err;
  }
}

export function runtime(seconds) {
  seconds = Number(seconds);
  var d = Math.floor(seconds / (3600 * 24));
  var h = Math.floor((seconds % (3600 * 24)) / 3600);
  var m = Math.floor((seconds % 3600) / 60);
  var s = Math.floor(seconds % 60);
  var dDisplay = d > 0 ? d + (d == 1 ? ' day, ' : ' days, ') : '';
  var hDisplay = h > 0 ? h + (h == 1 ? ' hour, ' : ' hours, ') : '';
  var mDisplay = m > 0 ? m + (m == 1 ? ' minute, ' : ' minutes, ') : '';
  var sDisplay = s > 0 ? s + (s == 1 ? ' second' : ' seconds') : '';
  return dDisplay + hDisplay + mDisplay + sDisplay;
}

export function clockString(ms) {
  let h = isNaN(ms) ? '--' : Math.floor(ms / 3600000);
  let m = isNaN(ms) ? '--' : Math.floor(ms / 60000) % 60;
  let s = isNaN(ms) ? '--' : Math.floor(ms / 1000) % 60;
  return [h, m, s].map((v) => v.toString().padStart(2, 0)).join(':');
}

export async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function isUrl(url) {
  return url.match(new RegExp(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)/, 'gi'));
}

export function getTime(format, date) {
  if (date) {
    return moment(date).locale('id').format(format);
  } else {
    return moment.tz('America/Bogota').locale('id').format(format);
  }
}

export function sanitizeFileName(str) {
  return str.replace(/[<>:"/\\|?*]/g, '').substring(0, 64).trim();
}

export function formatDate(n, locale = 'id') {
  let d = new Date(n);
  return d.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' });
}

export function tanggal(numer) {
  const myMonths = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const myDays = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const tgl = new Date(numer);
  const day = tgl.getDate();
  const bulan = tgl.getMonth();
  const thisDay = myDays[tgl.getDay()];
  const yy = tgl.getYear();
  const year = yy < 1000 ? yy + 1900 : yy;
  return `${thisDay}, ${day} - ${myMonths[bulan]} - ${year}`;
}

export var formatp = sizeFormatter({ std: 'JEDEC', decimalPlaces: 2, keepTrailingZeroes: false, render: (literal, symbol) => `${literal} ${symbol}B` });

export function jsonformat(string) {
  return JSON.stringify(string, null, 2);
}

export function logic(check, inp, out) {
  if (inp.length !== out.length) throw new Error('La entrada y la salida deben tener la misma longitud');
  for (let i in inp) if (util.isDeepStrictEqual(check, inp[i])) return out[i];
  return null;
}

export async function generateProfilePicture(buffer) {
  try {
    const jimp = await Jimp.read(buffer);
    const min = jimp.getWidth();
    const max = jimp.getHeight();
    const cropped = jimp.crop(0, 0, min, max);
    const scaled = await cropped.scaleToFit(360, 360); 
    return { 
        img: await scaled.getBufferAsync(Jimp.MIME_JPEG), 
        preview: await scaled.getBufferAsync(Jimp.MIME_JPEG) 
    };
  } catch (err) {
    Logger.warn(`Error JIMP pre-visualización (Ignorado por RAM): ${err.message}`);
    return { img: buffer, preview: buffer };
  }
}

export function bytesToSize(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function getSizeMedia(path) {
  return new Promise((resolve, reject) => {
    if (/http/.test(path)) {
      axios.get(path).then((res) => {
        let length = parseInt(res.headers['content-length']);
        let size = bytesToSize(length, 3);
        if (!isNaN(length)) resolve(size);
      });
    } else if (Buffer.isBuffer(path)) {
      let length = Buffer.byteLength(path);
      let size = bytesToSize(length, 3);
      if (!isNaN(length)) resolve(size);
    } else {
      reject('error');
    }
  });
}

export function pickRandom(list) {
  return list[Math.floor(list.length * Math.random())];
}

export function parseMention(text = '') {
  return [...text.matchAll(/@([0-9]{5,16}|0)/g)].map((v) => v[1] + '@s.whatsapp.net');
}

export function getGroupAdmins(participants) {
  let admins = [];
  for (let i of participants) {
    i.admin === 'superadmin' ? admins.push(i.id) : i.admin === 'admin' ? admins.push(i.id) : '';
  }
  return admins || [];
}

// ── Funciones centralizadas de economía ──

/**
 * Formatea milisegundos a string legible en español.
 * Ejemplo: 125000 → "2 minutos 5 segundos"
 */
export function formatTime(ms) {
  if (ms <= 0 || isNaN(ms)) return 'Ahora';
  const totalSec = Math.ceil(ms / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  const parts = [];
  if (days > 0) parts.push(`${days} día${days !== 1 ? 's' : ''}`);
  if (hours > 0) parts.push(`${hours} hora${hours !== 1 ? 's' : ''}`);
  if (minutes > 0) parts.push(`${minutes} minuto${minutes !== 1 ? 's' : ''}`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds} segundo${seconds !== 1 ? 's' : ''}`);
  return parts.join(' ');
}

/** Alias de formatTime para compatibilidad */
export const msToTime = formatTime;

/**
 * Formatea un número con separadores de miles.
 * Ejemplo: 1500000 → "1,500,000"
 */
export function formatNumber(number) {
  return Number(number).toLocaleString();
}

// ── Funciones centralizadas de nivel/XP ──

const XP_GROWTH = Math.pow(Math.PI / Math.E, 1.618) * Math.E * 0.75;

export function xpRange(level, multiplier = global.multiplier || 2) {
  if (level < 0) throw new TypeError('level cannot be negative value');
  level = Math.floor(level);
  const min = level === 0 ? 0 : Math.round(Math.pow(level, XP_GROWTH) * multiplier) + 1;
  const max = Math.round(Math.pow(level + 1, XP_GROWTH) * multiplier);
  return { min, max, xp: max - min };
}

export function findLevel(xp, multiplier = global.multiplier || 2) {
  if (xp === Infinity) return Infinity;
  if (isNaN(xp)) return NaN;
  if (xp <= 0) return -1;
  let level = 0;
  do { level++; } while (xpRange(level, multiplier).min <= xp);
  return --level;
}

export function canLevelUp(level, xp, multiplier = global.multiplier || 2) {
  if (level < 0) return false;
  if (xp === Infinity) return true;
  if (isNaN(xp)) return false;
  if (xp <= 0) return false;
  return level < findLevel(xp, multiplier);
}

/**
 * Helper para obtener configuración del bot de forma consistente.
 */
/**
 * Obtiene el JID normalizado del bot.
 */
export function getBotId(client) {
  return client.user.id.split(':')[0] + '@s.whatsapp.net';
}

export function getBotSettings(client) {
  return global.db.data.settings[getBotId(client)] || {};
}

export function getBotCurrency(client) {
  return getBotSettings(client).currency || 'Yenes';
}

/**
 * Obtiene metadata de grupo usando el cache global.
 * Si el cache no existe (inicio), llama a la API y cachea.
 * @param {object} client - Cliente de Baileys
 * @param {string} chatId - ID del grupo
 * @returns {object|null} GroupMetadata o null
 */
export async function getGroupMeta(client, chatId) {
  if (!chatId?.endsWith('@g.us')) return null;
  // Usar cache global (inicializado en main.js)
  if (global.groupMetaCache) {
    const cached = global.groupMetaCache.get(chatId);
    if (cached) return cached;
  }
  const metadata = await client.groupMetadata(chatId).catch(() => null);
  if (metadata && global.groupMetaCache) {
    global.groupMetaCache.set(chatId, metadata);
  }
  return metadata;
}

/**
 * Parse a human-readable duration string (e.g. "10s", "5m", "2h", "1d") to milliseconds.
 * Returns null if format is invalid.
 */
export function msParser(str) {
  const match = String(str).match(/^(\d+)([smhd])$/i);
  if (!match) return null;
  const num = parseInt(match[1]);
  const unit = match[2].toLowerCase();
  const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return num * (multipliers[unit] || 0);
}

/**
 * Convert milliseconds to a human-readable clock string.
 * e.g. 3661000 → "1 hora 1 minuto 1 segundo"
 */
export function clockStringHuman(ms) {
  const d = Math.floor(ms / 86400000);
  const h = Math.floor(ms / 3600000) % 24;
  const m = Math.floor(ms / 60000) % 60;
  const s = Math.floor(ms / 1000) % 60;
  let parts = [];
  if (d > 0) parts.push(`${d} ${d === 1 ? 'día' : 'días'}`);
  if (h > 0) parts.push(`${h} ${h === 1 ? 'hora' : 'horas'}`);
  if (m > 0) parts.push(`${m} ${m === 1 ? 'minuto' : 'minutos'}`);
  if (s > 0) parts.push(`${s} ${s === 1 ? 'segundo' : 'segundos'}`);
  return parts.join(' ') || '0 segundos';
}
