import { getMedia, validateMediaUrl } from '../../utils/downloader.js';
import { extractUrl } from '../../utils/tools.js';
import axios from 'axios';

// --- Constantes ---
const DELAY_MS = 800;
const MAX_CAROUSEL = 10;
const MAX_SEARCH = 4;

// --- Helpers de Formato ---
const formatLine = (label, value) => value ? `• *${label}:* ${value}\n` : '';
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Genera un caption estandarizado para cualquier plataforma.
 * Recibe un objeto con campos opcionales y construye el bloque de texto.
 */
function buildCaption(header, fields = {}, index = null, total = null) {
  const prefix = (index !== null && total !== null)
    ? `✧ ${header} ${index}/${total}\n\n`
    : `« ${header}\n\n`;

  return (prefix +
    formatLine('Título', fields.title) +
    formatLine('Autor', fields.author) +
    formatLine('Resolución', fields.resolution) +
    formatLine('Duración', fields.duration) +
    formatLine('Descripción', fields.description?.slice(0, 200)) +
    formatLine('Likes', fields.likes) +
    formatLine('Vistas', fields.views) +
    formatLine('Fecha', fields.date) +
    formatLine('Seguidores', fields.followers) +
    formatLine('Enlace', fields.link)
  ).trim();
}

// --- Helper de Envío con Validación ---
const sendMediaItem = async (client, chatId, url, type, caption, quoted, fileName = '') => {
  const isMp4 = url.includes('.mp4') || type === 'video';
  const expectedType = isMp4 ? 'video' : 'image';

  // 1. Validar tamaño del archivo y obtener Content-Type en una sola llamada (HEAD o GET Range)
  const validation = await validateMediaUrl(url, expectedType);
  if (!validation.valid) {
    throw new Error(validation.reason);
  }

  // 2. Determinar si es video a partir de la sugerencia inicial o del contentType devuelto
  const isVideo = isMp4 || validation.contentType?.startsWith('video/');

  if (isVideo) {
    await client.sendMessage(chatId, { video: { url }, caption, mimetype: 'video/mp4', fileName: fileName || 'video.mp4' }, { quoted });
  } else {
    await client.sendMessage(chatId, { image: { url }, caption }, { quoted });
  }
};

/**
 * Envía múltiples items de un carousel de forma secuencial.
 * Reutiliza buildCaption para generar textos consistentes.
 * Si algún elemento individual falla por tamaño, se omite y se continúa con los demás.
 */
const processCarousel = async (client, chatId, items, headerText, buildFields, extractUrlFn, extractType, quoted, max = MAX_CAROUSEL) => {
  const limitedItems = items.slice(0, max);
  let sentCount = 0;
  
  for (let i = 0; i < limitedItems.length; i++) {
    const item = limitedItems[i];
    const fields = buildFields(item);
    const caption = buildCaption(headerText, fields, i + 1, limitedItems.length);
    const url = extractUrlFn(item);
    const type = extractType ? extractType(item) : (url.includes('.mp4') ? 'video' : 'image');

    try {
      await sendMediaItem(client, chatId, url, type, caption, quoted);
      sentCount++;
    } catch (error) {
      console.error(`[Carousel Error] Elemento ${i + 1} omitido:`, error.message);
      await client.sendMessage(chatId, { text: `⚠️ Elemento ${i + 1}/${limitedItems.length} omitido: ${error.message}` }, { quoted });
    }
    
    if (i < limitedItems.length - 1) await sleep(DELAY_MS);
  }

  if (sentCount === 0) {
    throw new Error('Ninguno de los elementos del carrusel se pudo enviar o todos exceden el límite de tamaño.');
  }
};

// --- Controladores de Plataforma ---
const handlers = {
  facebook: async (client, m, text) => {
    const url = extractUrl(m, text);
    if (!url || !/facebook\.com|fb\.watch|video\.fb\.com/.test(url)) throw new Error('Enlace de Facebook inválido. Envía un enlace o cita un mensaje que contenga uno.');
    const data = await getMedia('facebook', url);
    if (!data) throw new Error('No se pudo obtener el contenido de Facebook.');

    if (data.isCarousel || (data.urls && data.urls.length > 1)) {
      await processCarousel(client, m.chat, data.urls, 'Facebook Download',
        () => ({ title: data.title || 'Facebook', resolution: data.resolution }),
        item => item.url, item => item.type, m);
    } else {
      const caption = buildCaption('𝐅𝐁 𝐃𝐎𝐖𝐍𝐋𝐎𝐀𝐃', {
        title: data.title || 'Contenido de Facebook',
        resolution: data.resolution,
        duration: data.duration,
        link: url
      });
      await sendMediaItem(client, m.chat, data.url, data.type, caption, m, 'fb.mp4');
    }
  },

  instagram: async (client, m, text) => {
    const url = extractUrl(m, text);
    if (!url || !/instagram\.com\/(p|reel|reels|share|tv|stories)\//.test(url)) throw new Error('Enlace de Instagram inválido. Envía un enlace o cita un mensaje que contenga uno.');
    const data = await getMedia('instagram', url);
    if (!data?.urls?.length) throw new Error('No se pudo obtener el contenido de Instagram.');

    if (data.isCarousel || data.urls.length > 1) {
      await processCarousel(client, m.chat, data.urls, 'Instagram Download',
        () => ({ author: data.title || 'Usuario de Instagram', description: data.caption }),
        item => item.url, item => item.type, m);
    } else {
      const caption = buildCaption('𝐈𝐆 𝐃𝐎𝐖𝐍𝐋𝐎𝐀𝐃', {
        author: data.title || 'Usuario de Instagram',
        description: data.caption
      });
      await sendMediaItem(client, m.chat, data.urls[0].url, data.urls[0].type, caption, m, 'ig.mp4');
    }
  },

  tiktok: async (client, m, text) => {
    const url = extractUrl(m, text);
    const isUrl = url ? /(?:https:?\/{2})?(?:w{3}|vm|vt|t)?\.?tiktok.com\/([^\s&]+)/gi.test(url) : false;
    const searchText = isUrl ? url : text;
    if (!searchText) throw new Error('Envía un enlace de TikTok o un término de búsqueda.');
    
    const json = await getMedia('tiktok', searchText, { isUrl });
    if (!json?.status) throw new Error('No se encontró contenido válido en TikTok.');

    if (isUrl) {
      const { title, duration, dl, author, stats, created_at, type } = json.data;
      if (!dl || (Array.isArray(dl) && dl.length === 0)) throw new Error('Enlace inválido o sin contenido descargable.');

      const captionFields = {
        title: title || 'Sin título',
        author: author?.nickname || author?.unique_id || 'Desconocido',
        duration,
        likes: (stats?.likes || 0).toLocaleString(),
        views: (stats?.views || stats?.plays || 0).toLocaleString(),
        date: created_at
      };

      if (type === 'image' || (Array.isArray(dl) && dl.length > 1 && dl[0].includes('.jpeg'))) {
        const mediaArray = Array.isArray(dl) ? dl : [dl];
        if (mediaArray.length === 1) {
          await sendMediaItem(client, m.chat, mediaArray[0], 'image', buildCaption('TikTok Download', captionFields), m);
        } else {
          await processCarousel(client, m.chat, mediaArray, 'TikTok Download',
            () => ({ title, author: author?.nickname }),
            url => url, () => 'image', m);
        }

        try {
          const audioRes = (await axios.get(`https://www.tikwm.com/api/?url=${encodeURIComponent(searchText)}&hd=1`, { timeout: 6000 })).data;
          if (audioRes?.data?.play) {
            await client.sendMessage(m.chat, { audio: { url: audioRes.data.play }, mimetype: 'audio/mp4', fileName: 'tiktok_audio.mp4' }, { quoted: m });
          }
        } catch (err) {
          console.error("[TikTok Audio Fallback Error]:", err.message);
        }
      } else {
        await sendMediaItem(client, m.chat, Array.isArray(dl) ? dl[0] : dl, 'video', buildCaption('TikTok Download', captionFields), m);
      }
    } else {
      const validResults = json.data?.filter(v => v.dl && typeof v.dl === 'string' && v.dl.startsWith('http'));
      if (!validResults?.length) throw new Error('No se encontraron resultados válidos en la búsqueda.');

      await processCarousel(client, m.chat, validResults, 'TikTok Search',
        v => ({
          title: v.title,
          author: `${v.author?.nickname} ${v.author?.unique_id ? `@${v.author.unique_id}` : ''}`.trim(),
          likes: (v.stats?.likes || 0).toLocaleString(),
          description: v.music?.title
        }),
        v => v.dl, () => 'video', m, MAX_SEARCH);
    }
  },

  pinterest: async (client, m, text) => {
    const url = extractUrl(m, text);
    const isUrl = url ? /^https?:\/\//.test(url) : false;
    const searchText = isUrl ? url : text;
    if (!searchText) throw new Error('Envía un enlace de Pinterest o un término de búsqueda.');

    if (isUrl) {
      const data = await getMedia('pinterest', searchText, { isUrl: true });
      if (!data) throw new Error('No se pudo obtener el contenido de Pinterest.');

      const caption = buildCaption('Pinterest Download', { title: data.title, author: data.author || data.name });
      await sendMediaItem(client, m.chat, data.url, data.type, caption, m, 'pin.mp4');
    } else {
      const results = await getMedia('pinterest', searchText, { isUrl: false });
      const validResults = results.map(r => ({ ...r, image: typeof r.image === 'string' ? r.image : (r.image?.url || r.url || r) }))
        .filter(r => r.image && r.image.startsWith('http'));
      if (!validResults.length) throw new Error(`No se encontraron imágenes válidas para *${searchText}*.`);

      await processCarousel(client, m.chat, validResults, 'Pinterest Search',
        r => ({ title: r.title, author: r.name, followers: r.followers }),
        r => r.image, r => r.type || 'image', m, MAX_SEARCH);
    }
  },

  studocu: async (client, m, text) => {
    const url = extractUrl(m, text);
    if (!url || !/studocu\.com/.test(url)) throw new Error('Enlace de Studocu inválido. Envía un enlace o cita un mensaje que contenga uno.');
    await m.reply('⏳ Procesando documento, por favor espere...');
    const data = await getMedia('studocu', url);
    if (!data) throw new Error('No se pudo obtener el documento. Servidor caído o enlace inválido.');

    // Validar tamaño del documento
    const validation = await validateMediaUrl(data.url, 'document');
    if (!validation.valid) throw new Error(validation.reason);

    const caption = buildCaption('𝐒𝐓𝐔𝐃𝐎𝐂𝐔 𝐃𝐎𝐖𝐍𝐋𝐎𝐀𝐃', { title: data.title || 'Documento Studocu' });
    await client.sendMessage(m.chat, { document: { url: data.url }, caption, mimetype: 'application/pdf', fileName: `${data.title || 'studocu'}.pdf` }, { quoted: m });
  }
};

const aliasMap = {
  fb: 'facebook', facebook: 'facebook',
  ig: 'instagram', instagram: 'instagram',
  tiktok: 'tiktok', tt: 'tiktok', tiktoksearch: 'tiktok', ttsearch: 'tiktok', tts: 'tiktok',
  pinterest: 'pinterest', pin: 'pinterest',
  studocu: 'studocu', studoc: 'studocu'
};

export default {
  help: ['fb', 'ig', 'tiktok', 'tiktoksearch', 'pinterest', 'studocu'],
  command: Object.keys(aliasMap),
  category: 'downloads',
  heavy: true,
  cooldown: 5,
  desc: 'Descarga contenido de múltiples plataformas (FB, IG, TikTok, Pinterest, Studocu). Puedes citar un mensaje con enlace.',
  run: async (client, m, args, usedPrefix, command) => {
    const text = args.join(' ');
    const platform = aliasMap[command.toLowerCase()];

    // If no args and no quoted message with URL, show usage
    if (!text && !m.quoted) {
      return m.reply(`Envía un enlace o *cita un mensaje* que contenga un enlace de ${platform}.\n\n*Ejemplo:* \`${usedPrefix + command} https://...\`\no responde a un mensaje con un enlace.`);
    }

    try {
      if (handlers[platform]) {
        await handlers[platform](client, m, text);
      }
    } catch (e) {
      await m.reply(`> Error al ejecutar ${usedPrefix + command}.\n[Causa: *${e.message}*]`);
    }
  }
};