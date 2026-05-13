import axios from 'axios';
import Logger from './logger.js';

/**
 * Traduce texto gratuitamente usando Google Translate API (gtx)
 * @param {string} text - Texto a traducir
 * @param {string} to - Código de idioma destino (ej. 'es')
 * @param {string} from - Código de idioma origen (ej. 'en', 'auto')
 * @returns {Promise<string>}
 */
export async function translate(text, to = 'es', from = 'auto') {
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(text)}`;
    const res = await axios.get(url);
    if (res.data && res.data[0]) {
      return res.data[0].map((item) => item[0]).join('');
    }
    return text;
  } catch (err) {
    Logger.error('Error al traducir texto', err);
    return text; // Fallback al texto original
  }
}
