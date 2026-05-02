import { getMedia, isImageUrl } from '../../utils/downloader.js'

// --- Formatting Helpers ---
const formatLine = (label, value) => value ? `• *${label}:* ${value}\n` : '';
const formatTitle = (title, index, max) => max ? `✧ ${title} ${index}/${max}\n\n` : `✧ ${title}\n\n`;
// --------------------------export default {
command: ['fb', 'facebook', 'ig', 'instagram', 'tiktok', 'tt', 'tiktoksearch', 'ttsearch', 'tts', 'pinterest', 'pin', 'studocu', 'studoc'],
  category: 'downloader',
    cooldown: 5,
      desc: 'Descarga contenido de múltiples plataformas (FB, IG, TikTok, Pinterest, Studocu)',
        run: async (client, m, args, usedPrefix, command) => {
          if (!args[0]) {
            return m.reply(` Por favor, ingresa un enlace o término de búsqueda para ${command}.`)
          }
          const text = args.join(' ')
          const cmd = command.toLowerCase()

          try {
            if (['fb', 'facebook'].includes(cmd)) {
              if (!text.match(/facebook\.com|fb\.watch|video\.fb\.com/)) return m.reply(' El enlace es invalido, envía un link de Facebook válido')
              const data = await getMedia('facebook', text)
              if (!data) return m.reply(' No se pudo obtener el contenido.')
              const caption = `« 𝐅𝐁 𝐃𝐎𝐖𝐍𝐋𝐎𝐀𝐃 \n\nTítulo: ${data.title || 'Contenido de Facebook'}`

              if (data.isCarousel || (data.urls && data.urls.length > 1)) {
                const maxMedia = data.urls.slice(0, 10);
                for (let i = 0; i < maxMedia.length; i++) {
                  const mData = maxMedia[i];
                  const textCap = formatTitle('Facebook Download', i + 1, maxMedia.length) + formatLine('Título', data.title || 'Facebook');
                  if (mData.type === 'video') await client.sendMessage(m.chat, { video: { url: mData.url }, caption: textCap }, { quoted: m });
                  else await client.sendMessage(m.chat, { image: { url: mData.url }, caption: textCap }, { quoted: m });
                  await new Promise(r => setTimeout(r, 800));
                }
              } else {
                if (data.type === 'video' || data.url.includes('.mp4')) await client.sendMessage(m.chat, { video: { url: data.url }, caption, mimetype: 'video/mp4', fileName: 'fb.mp4' }, { quoted: m })
                else if (data.type === 'image' || data.url.includes('.jpg')) await client.sendMessage(m.chat, { image: { url: data.url }, caption }, { quoted: m })
                else throw new Error('Contenido no soportado.')
              }
            }
            else if (['ig', 'instagram'].includes(cmd)) {
              if (!text.match(/instagram\.com\/(p|reel|share|tv|stories)\//)) return m.reply(' El enlace no parece *válido*. Asegúrate de que sea de *Instagram*.')
              const data = await getMedia('instagram', text)
              if (!data || !data.urls || !data.urls.length) return m.reply(' No se pudo obtener el contenido.')
              const caption = `« 𝐈𝐆 𝐃𝐎𝐖𝐍𝐋𝐎𝐀𝐃 \n\nAutor: ${data.title || 'Usuario de Instagram'}`

              if (data.isCarousel || data.urls.length > 1) {
                const maxMedia = data.urls.slice(0, 10);
                for (let i = 0; i < maxMedia.length; i++) {
                  const u = maxMedia[i];
                  const textCap = formatTitle('Instagram Download', i + 1, maxMedia.length) + formatLine('Autor', data.title || 'Usuario de Instagram');
                  if (u.type === 'video') await client.sendMessage(m.chat, { video: { url: u.url }, caption: textCap }, { quoted: m });
                  else await client.sendMessage(m.chat, { image: { url: u.url }, caption: textCap }, { quoted: m });
                  await new Promise(r => setTimeout(r, 800));
                }
              } else {
                const media = data.urls[0];
                if (media.type === 'video') await client.sendMessage(m.chat, { video: { url: media.url }, caption, mimetype: 'video/mp4', fileName: 'ig.mp4' }, { quoted: m })
                else if (media.type === 'image') await client.sendMessage(m.chat, { image: { url: media.url }, caption }, { quoted: m })
              }
            }
            else if (['tiktok', 'tt', 'tiktoksearch', 'ttsearch', 'tts'].includes(cmd)) {
              const isUrl = /(?:https:?\/{2})?(?:w{3}|vm|vt|t)?\.?tiktok.com\/([^\s&]+)/gi.test(text)
              const json = await getMedia('tiktok', text, { isUrl })
              if (!json || !json.status) return m.reply(' No se encontró contenido válido en TikTok.')
              if (isUrl) {
                const { title, duration, dl, author, stats, created_at, type } = json.data
                if (!dl || (Array.isArray(dl) && dl.length === 0)) return m.reply(' Enlace inválido o sin contenido descargable.')
                const caption = formatTitle('TikTok Download') +
                  formatLine('Título', title || 'Sin título') +
                  formatLine('Autor', author?.nickname || author?.unique_id || 'Desconocido') +
                  formatLine('Duración', duration) +
                  formatLine('Likes', (stats?.likes || 0).toLocaleString()) +
                  formatLine('Comentarios', (stats?.comments || 0).toLocaleString()) +
                  formatLine('Vistas', (stats?.views || stats?.plays || 0).toLocaleString()) +
                  formatLine('Compartidos', (stats?.shares || 0).toLocaleString()) +
                  formatLine('Fecha', created_at);

                if (type === 'image' || (Array.isArray(dl) && dl.length > 1 && typeof dl[0] === 'string' && dl[0].includes('.jpeg'))) {
                  if (Array.isArray(dl) && dl.length === 1) await client.sendMessage(m.chat, { image: { url: dl[0] }, caption }, { quoted: m })
                  else {
                    const maxMedia = Array.isArray(dl) ? dl.slice(0, 10) : [dl];
                    for (let i = 0; i < maxMedia.length; i++) {
                      const textCap = formatTitle('TikTok Download', i + 1, maxMedia.length) +
                        formatLine('Título', title || 'Sin título') +
                        formatLine('Autor', author?.nickname || 'Desconocido');
                      await client.sendMessage(m.chat, { image: { url: maxMedia[i] }, caption: textCap }, { quoted: m });
                      await new Promise(r => setTimeout(r, 800));
                    }
                  }
                  try {
                    const audioRes = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(text)}&hd=1`).then(r => r.json())
                    if (audioRes?.data?.play) await client.sendMessage(m.chat, { audio: { url: audioRes.data.play }, mimetype: 'audio/mp4', fileName: 'tiktok_audio.mp4' }, { quoted: m })
                  } catch (err) {
                    console.error("[TikTok Audio Fallback Error]:", err.message)
                  }
                } else {
                  const videoUrl = Array.isArray(dl) ? dl[0] : dl;
                  await client.sendMessage(m.chat, { video: { url: videoUrl }, caption }, { quoted: m })
                }
              } else {
                const validResults = json.data?.filter(v => v.dl && typeof v.dl === 'string' && v.dl.startsWith('http'))
                if (!validResults || validResults.length === 0) return m.reply(' No se encontraron resultados válidos.')

                const maxResults = validResults.slice(0, 4);
                for (let i = 0; i < maxResults.length; i++) {
                  const v = maxResults[i];
                  const caption = formatTitle('TikTok Search', i + 1, maxResults.length) +
                    formatLine('Título', v.title || 'Sin título') +
                    formatLine('Autor', `${v.author?.nickname || 'Desconocido'} ${v.author?.unique_id ? `@${v.author.unique_id}` : ''}`.trim()) +
                    formatLine('Duración', v.duration) +
                    formatLine('Likes', (v.stats?.likes || 0).toLocaleString()) +
                    formatLine('Comentarios', (v.stats?.comments || 0).toLocaleString()) +
                    formatLine('Vistas', (v.stats?.views || 0).toLocaleString()) +
                    formatLine('Compartidos', (v.stats?.shares || 0).toLocaleString()) +
                    formatLine('Audio', v.music?.title || `Original sound - ${v.author?.unique_id || 'unknown'}`);
                  await client.sendMessage(m.chat, { video: { url: v.dl }, caption }, { quoted: m });
                  await new Promise(r => setTimeout(r, 800));
                }
              }
            }
            else if (['pinterest', 'pin'].includes(cmd)) {
              const isUrl = /^https?:\/\//.test(text)
              if (isUrl) {
                const data = await getMedia('pinterest', text, { isUrl: true })
                if (!data) return m.reply('No se pudo obtener el contenido.')
                const caption = formatTitle('Pinterest Download') +
                  formatLine('Título', data.title) +
                  formatLine('Descripción', data.description) +
                  formatLine('Autor', data.author || data.name) +
                  formatLine('Usuario', data.username) +
                  formatLine('Seguidores', data.followers) +
                  formatLine('Fecha', data.uploadDate) +
                  formatLine('Likes', data.likes) +
                  formatLine('Comentarios', data.comments) +
                  formatLine('Vistas', data.views) +
                  formatLine('Guardados', data.saved) +
                  formatLine('Formato', data.format) +
                  formatLine('Enlace', text);
                if (data.type === 'video') await client.sendMessage(m.chat, { video: { url: data.url }, caption, mimetype: 'video/mp4', fileName: 'pin.mp4' }, { quoted: m })
                else if (data.type === 'image') await client.sendMessage(m.chat, { image: { url: data.url }, caption }, { quoted: m })
                else throw new Error('Contenido no soportado.')
              } else {
                const results = await getMedia('pinterest', text, { isUrl: false })
                const normalizedResults = results.map(r => {
                  let imgUrl = typeof r.image === 'string' ? r.image : (r.image?.url || r.url || r);
                  return { ...r, image: typeof imgUrl === 'string' ? imgUrl : null };
                });
                const validResults = normalizedResults.filter(r => r.image && r.image.startsWith('http'));
                if (!validResults || validResults.length === 0) {
                  console.error("[Pinterest Debug] Resultados inválidos:", results.slice(0, 2));
                  return m.reply(` No se encontraron imágenes válidas para *${text}*.`)
                }

                // Enviar hasta 4 resultados para evitar spam
                const maxResults = validResults.slice(0, 4);
                for (let i = 0; i < maxResults.length; i++) {
                  const r = maxResults[i];
                  const caption = formatTitle('Pinterest Search', i + 1, maxResults.length) +
                    formatLine('Título', r.title) +
                    formatLine('Descripción', r.description) +
                    formatLine('Autor', r.name) +
                    formatLine('Usuario', r.username) +
                    formatLine('Seguidores', r.followers) +
                    formatLine('Likes', r.likes) +
                    formatLine('Fecha', r.created_at);
                  if (r.type === 'video') {
                    await client.sendMessage(m.chat, { video: { url: r.image }, caption }, { quoted: m });
                  } else {
                    await client.sendMessage(m.chat, { image: { url: r.image }, caption }, { quoted: m });
                  }
                  await new Promise(resolve => setTimeout(resolve, 800)); // Pequeño delay
                }
              }
            }
            else if (['studocu', 'studoc'].includes(cmd)) {
              if (!text.match(/studocu\.com/)) return m.reply(' El enlace es invalido, envía un link de Studocu válido\n\nEjemplo: ' + usedPrefix + command + ' https://www.studocu.com/...')
              await m.reply(' Procesando documento, por favor espere...')
              const data = await getMedia('studocu', text)
              if (!data) return m.reply(' No se pudo obtener el documento. Esto puede deberse a un servidor caído o enlace inválido.')
              const caption = `« 𝐒𝐓𝐔𝐃𝐎𝐂𝐔 𝐃𝐎𝐖𝐍𝐋𝐎𝐀𝐃 \n\nTítulo: ${data.title || 'Documento Studocu'}`
              await client.sendMessage(m.chat, { document: { url: data.url }, caption, mimetype: 'application/pdf', fileName: `${data.title || 'studocu'}.pdf` }, { quoted: m })
            }

          } catch (e) {
            await m.reply(`> An unexpected error occurred while executing command *${usedPrefix + command}*. Please try again or contact support if the issue persists.\n[Error: *${e.message}*]`)
          }
        }

import { getMedia } from '../../utils/downloader.js';

// --- Constantes ---
const DELAY_MS = 800;
const MAX_CAROUSEL = 10;
const MAX_SEARCH = 4;

// --- Helpers de Formato ---
const formatLine = (label, value) => value ? `• *${label}:* ${value}\n` : '';
const formatTitle = (title, index, max) => max ? `✧ ${title} ${index}/${max}\n\n` : `✧ ${title}\n\n`;
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// --- Helpers de Envío ---
const sendMediaItem = async (client, chatId, url, type, caption, quoted, fileName = '') => {
  if (type === 'video' || url.includes('.mp4')) {
    await client.sendMessage(chatId, { video: { url }, caption, mimetype: 'video/mp4', fileName }, { quoted });
  } else {
    await client.sendMessage(chatId, { image: { url }, caption }, { quoted });
  }
};

const processCarousel = async (client, chatId, items, titlePrefix, extractCaption, extractUrl, extractType, quoted, max = MAX_CAROUSEL) => {
  const limitedItems = items.slice(0, max);
  for (let i = 0; i < limitedItems.length; i++) {
    const item = limitedItems[i];
    const caption = formatTitle(titlePrefix, i + 1, limitedItems.length) + extractCaption(item);
    const url = extractUrl(item);
    const type = extractType ? extractType(item) : (url.includes('.mp4') ? 'video' : 'image');

    await sendMediaItem(client, chatId, url, type, caption, quoted);
    if (i < limitedItems.length - 1) await sleep(DELAY_MS);
  }
};

// --- Controladores de Plataforma ---
const handlers = {
  facebook: async (client, m, text) => {
    if (!/facebook\.com|fb\.watch|video\.fb\.com/.test(text)) throw new Error('Enlace de Facebook inválido.');
    const data = await getMedia('facebook', text);
    if (!data) throw new Error('No se pudo obtener el contenido de Facebook.');

    if (data.isCarousel || (data.urls && data.urls.length > 1)) {
      await processCarousel(client, m.chat, data.urls, 'Facebook Download', () => formatLine('Título', data.title || 'Facebook'), item => item.url, item => item.type, m);
    } else {
      const caption = `« 𝐅𝐁 𝐃𝐎𝐖𝐍𝐋𝐎𝐀𝐃 \n\nTítulo: ${data.title || 'Contenido de Facebook'}`;
      await sendMediaItem(client, m.chat, data.url, data.type, caption, m, 'fb.mp4');
    }
  },

  instagram: async (client, m, text) => {
    if (!/instagram\.com\/(p|reel|share|tv|stories)\//.test(text)) throw new Error('Enlace de Instagram inválido.');
    const data = await getMedia('instagram', text);
    if (!data?.urls?.length) throw new Error('No se pudo obtener el contenido de Instagram.');

    if (data.isCarousel || data.urls.length > 1) {
      await processCarousel(client, m.chat, data.urls, 'Instagram Download', () => formatLine('Autor', data.title || 'Usuario de Instagram'), item => item.url, item => item.type, m);
    } else {
      const caption = `« 𝐈𝐆 𝐃𝐎𝐖𝐍𝐋𝐎𝐀𝐃 \n\nAutor: ${data.title || 'Usuario de Instagram'}`;
      await sendMediaItem(client, m.chat, data.urls[0].url, data.urls[0].type, caption, m, 'ig.mp4');
    }
  },

  tiktok: async (client, m, text) => {
    const isUrl = /(?:https:?\/{2})?(?:w{3}|vm|vt|t)?\.?tiktok.com\/([^\s&]+)/gi.test(text);
    const json = await getMedia('tiktok', text, { isUrl });
    if (!json?.status) throw new Error('No se encontró contenido válido en TikTok.');

    if (isUrl) {
      const { title, duration, dl, author, stats, created_at, type } = json.data;
      if (!dl || (Array.isArray(dl) && dl.length === 0)) throw new Error('Enlace inválido o sin contenido descargable.');

      const baseCaption = formatTitle('TikTok Download') +
        formatLine('Título', title || 'Sin título') +
        formatLine('Autor', author?.nickname || author?.unique_id || 'Desconocido') +
        formatLine('Duración', duration) +
        formatLine('Likes', (stats?.likes || 0).toLocaleString()) +
        formatLine('Vistas', (stats?.views || stats?.plays || 0).toLocaleString()) +
        formatLine('Fecha', created_at);

      if (type === 'image' || (Array.isArray(dl) && dl.length > 1 && dl[0].includes('.jpeg'))) {
        const mediaArray = Array.isArray(dl) ? dl : [dl];
        if (mediaArray.length === 1) {
          await sendMediaItem(client, m.chat, mediaArray[0], 'image', baseCaption, m);
        } else {
          await processCarousel(client, m.chat, mediaArray, 'TikTok Download', () => formatLine('Título', title) + formatLine('Autor', author?.nickname), url => url, () => 'image', m);
        }

        try {
          const audioRes = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(text)}&hd=1`).then(r => r.json());
          if (audioRes?.data?.play) await client.sendMessage(m.chat, { audio: { url: audioRes.data.play }, mimetype: 'audio/mp4', fileName: 'tiktok_audio.mp4' }, { quoted: m });
        } catch (err) {
          console.error("[TikTok Audio Fallback Error]:", err.message);
        }
      } else {
        await sendMediaItem(client, m.chat, Array.isArray(dl) ? dl[0] : dl, 'video', baseCaption, m);
      }
    } else {
      const validResults = json.data?.filter(v => v.dl && typeof v.dl === 'string' && v.dl.startsWith('http'));
      if (!validResults?.length) throw new Error('No se encontraron resultados válidos en la búsqueda.');

      await processCarousel(client, m.chat, validResults, 'TikTok Search', v =>
        formatLine('Título', v.title) +
        formatLine('Autor', `${v.author?.nickname} ${v.author?.unique_id ? `@${v.author.unique_id}` : ''}`.trim()) +
        formatLine('Likes', (v.stats?.likes || 0).toLocaleString()) +
        formatLine('Audio', v.music?.title),
        v => v.dl, () => 'video', m, MAX_SEARCH);
    }
  },

  pinterest: async (client, m, text) => {
    const isUrl = /^https?:\/\//.test(text);
    if (isUrl) {
      const data = await getMedia('pinterest', text, { isUrl: true });
      if (!data) throw new Error('No se pudo obtener el contenido de Pinterest.');

      const caption = formatTitle('Pinterest Download') + formatLine('Título', data.title) + formatLine('Autor', data.author || data.name);
      await sendMediaItem(client, m.chat, data.url, data.type, caption, m, 'pin.mp4');
    } else {
      const results = await getMedia('pinterest', text, { isUrl: false });
      const validResults = results.map(r => ({ ...r, image: typeof r.image === 'string' ? r.image : (r.image?.url || r.url || r) }))
        .filter(r => r.image && r.image.startsWith('http'));
      if (!validResults.length) throw new Error(`No se encontraron imágenes válidas para *${text}*.`);

      await processCarousel(client, m.chat, validResults, 'Pinterest Search', r =>
        formatLine('Título', r.title) + formatLine('Autor', r.name) + formatLine('Seguidores', r.followers),
        r => r.image, r => r.type || 'image', m, MAX_SEARCH);
    }
  },

  studocu: async (client, m, text) => {
    if (!/studocu\.com/.test(text)) throw new Error('Enlace de Studocu inválido.');
    await m.reply('Procesando documento, por favor espere...');
    const data = await getMedia('studocu', text);
    if (!data) throw new Error('No se pudo obtener el documento. Servidor caído o enlace inválido.');

    const caption = `« 𝐒𝐓𝐔𝐃𝐎𝐂𝐔 𝐃𝐎𝐖𝐍𝐋𝐎𝐀𝐃 \n\nTítulo: ${data.title || 'Documento Studocu'}`;
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
  command: Object.keys(aliasMap),
  category: 'downloader',
  cooldown: 5,
  desc: 'Descarga contenido de múltiples plataformas (FB, IG, TikTok, Pinterest, Studocu)',
  run: async (client, m, args, usedPrefix, command) => {
    if (!args[0]) return m.reply(`Por favor, ingresa un enlace o término de búsqueda para ${command}.`);

    const text = args.join(' ');
    const platform = aliasMap[command.toLowerCase()];

    try {
      if (handlers[platform]) {
        await handlers[platform](client, m, text);
      }
    } catch (e) {
      await m.reply(`> Error al ejecutar ${usedPrefix + command}.\n[Causa: *${e.message}*]`);
    }
  }
};