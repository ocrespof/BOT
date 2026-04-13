import axios from 'axios'
import path from 'path'
import { lookup } from 'mime-types'

export default {
  command: ['mediafire', 'mf'],
  category: 'downloader',
  run: async (client, m, args, usedPrefix, command) => {
    const text = args.join(' ').trim()

    if (!text) {
      return m.reply('《✧》 Por favor, ingresa el enlace de Mediafire o una palabra clave.')
    }

    try {
      const isUrl = /^https?:\/\/(www\.)?mediafire\.com\/.+/i.test(text)

      if (!isUrl) {
        const res = await axios.get(
          `${global.APIs.stellar.url}/search/mediafire?query=${encodeURIComponent(text)}&key=${global.APIs.stellar.key}`,
          { timeout: 15000 }
        )
        const data = res.data

        if (!data?.status || !data.results?.length) {
          return m.reply('《✧》 No se encontraron resultados para tu búsqueda.')
        }

        let caption = `✰ ᩧ　𓈒　ׄ　𝖬𝖾𝖽𝗂𝖺𝖥𝗂𝗋𝖾　ׅ　✿\n\n`
        caption += `𖣣ֶㅤ֯⌗ ❀  ⬭ *Resultados encontrados* › ${data.results.length}\n\n`

        data.results.forEach((r, i) => {
          caption += `﹙${i + 1}﹚ *Nombre* › ${r.filename}\n`
          caption += `﹙${i + 1}﹚ *Peso* › ${r.filesize}\n`
          caption += `﹙${i + 1}﹚ *Enlace* › ${r.url}\n`
          caption += `﹙${i + 1}﹚ *Fuente* › ${r.source_title}\n\n`
        })

        return m.reply(caption)
      }

      const scraped = await mediafireDl(text)
      if (!scraped?.downloadLink) return m.reply('《✧》 El enlace ingresado es inválido o expiró.')

      const title = (scraped.filename || 'archivo').trim()
      const ext = path.extname(title) || (scraped.type ? `.${scraped.type}` : '')
      const tipo = lookup((ext || '').toLowerCase()) || 'application/octet-stream'

      const info =
        `✰ ᩧ　𓈒　ׄ　𝖬𝖾𝖽𝗂𝖺𝖥𝗂𝗋𝖾　ׅ　✿\n\n` +
        `ׄ ﹙ׅ✿﹚ּ *Nombre* › ${title}\n` +
        `ׄ ﹙ׅ✿﹚ּ *Tipo* › ${tipo}\n` +
        (scraped.size ? `ׄ ﹙ׅ✿﹚ּ *Peso* › ${scraped.size}\n` : '') +
        (scraped.uploaded ? `ׄ ﹙ׅ✿﹚ּ *Subido* › ${scraped.uploaded}\n` : '') +
        `\n${dev}`

      await client.sendContextInfoIndex(m.chat, info, {}, m, true, null, {
        banner: 'https://cdn.yuki-wabot.my.id/files/5txZ.jpeg',
        title: '𖹭  ׄ  ְ ✿ Mediafire ✩',
        body: '✰ Descarga De MF',
        redes: global.db.data.settings[client.user.id.split(':')[0] + '@s.whatsapp.net'].link
      })

      await client.sendMessage(
        m.chat,
        { document: { url: scraped.downloadLink }, mimetype: tipo, fileName: title },
        { quoted: m }
      )
    } catch (e) {
      return m.reply(
        `> Ocurrió un fallo de memoria o conexión al procesar la descarga de MF. Reintenta más tarde.\n> [Error: *${e.message}*]`
      )
    }
  }
}

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

function cleanText(x) {
  return String(x || '').replace(/\s+/g, ' ').trim()
}

function normalizeUrl(u) {
  const s = cleanText(u)
  if (!s) return null
  if (/^https?:\/\//i.test(s)) return s
  if (s.startsWith('//')) return 'https:' + s
  if (s.startsWith('/')) return 'https://www.mediafire.com' + s
  return s
}

async function mediafireDl(url, timeout = 15000) {
  const mediafireUrl = cleanText(url)
  if (!mediafireUrl) throw new Error('URL requerida')

  const res = await axios.get(mediafireUrl, {
    timeout,
    maxRedirects: 5,
    headers: {
      'User-Agent': UA,
      'Accept-Language': 'en-US,en;q=0.9',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
    },
    validateStatus: () => true
  })

  if (res.status < 200 || res.status >= 400) {
    throw new Error(`MediaFire HTTP ${res.status}`)
  }

  const html = String(res.data || '');
  const downloadMatch = html.match(/href="([^"]+)"\s+id="downloadButton"/i) || html.match(/id="downloadButton"\s+href="([^"]+)"/i);
  const downloadLinkRaw = downloadMatch ? downloadMatch[1] : null;
  const downloadLink = normalizeUrl(downloadLinkRaw)

  if (!downloadLink) throw new Error('Download link not found')

  const fileMatch = html.match(/<div class="intro".*?<div class="filename">(.*?)<\/div>/s) || html.match(/<meta property="og:title" content="(.*?)"/i) || html.match(/<title>(.*?)<\/title>/i)
  const filename = fileMatch ? cleanText(fileMatch[1]) : null;

  const typeMatch = html.match(/<div class="filetype">(.*?)<\/div>/i);
  const filetype = typeMatch ? cleanText(typeMatch[1]) : null;

  let size = null
  let uploaded = null
  let sizeMatch = html.match(/File size:.*?<span>(.*?)<\/span>/i)
  if (sizeMatch) size = cleanText(sizeMatch[1])
  let upMatch = html.match(/Uploaded:.*?<span>(.*?)<\/span>/i)
  if (upMatch) uploaded = cleanText(upMatch[1])

  const m = String(filename).match(/\.([a-z0-9]{1,10})$/i)
  const type = m ? m[1].toLowerCase() : (filetype ? cleanText(filetype).toLowerCase() : null)

  return { downloadLink, filename, filetype, size, uploaded, type }
}
