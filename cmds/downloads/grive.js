
import { extractUrl } from '../../utils/tools.js';

export default {
  command: ['drive', 'gdrive'],
  category: 'downloads',
  desc: 'Descargar de Google Drive. Puedes citar un mensaje con enlace.',
  run: async (client, m, args, usedPrefix, command) => {
    const text = args.join(' ').trim();
    const url = extractUrl(m, text);
    if (!url) {
      return m.reply(`Envía un enlace de Google Drive o *cita un mensaje* con uno.\n\n*Ejemplo:* \`${usedPrefix + command} https://drive.google.com/...\``)
    }
    if (!url.match(/drive\.google\.com\/(file\/d\/|open\?id=|uc\?id=)/)) {
      return m.reply('La URL no parece válida de Google Drive.')
    }
    try {
      const result = await gdriveScraper(url)
      if (!result.status) {
        return m.reply(' No se pudo obtener el archivo. Intenta con otro enlace.')
      }
      const { fileName, fileSize, mimetype, downloadUrl } = result.data
      const caption = `۟𝖦oogle 𝖣𝗋𝗂𝗏𝖾　ׅ　✿۟\n\n` + `*Nombre* › ${fileName}\n` + `*Tamaño* › ${fileSize}\n` + `*Tipo* › ${mimetype}\n\n` + `*Enlace* › ${url}`
      await client.sendMessage(m.chat, { document: { url: downloadUrl }, mimetype, fileName, caption }, { quoted: m })
    } catch (e) {
      return m.reply(`> Error al ejecutar el comando.\n[Error: *${e.message}*]`)
    }
  }
}

async function gdriveScraper(url) {
  try {
    let id = (url.match(/\/?id=(.+)/i) || url.match(/\/d\/(.*?)\//))[1]
    if (!id) throw new Error('No se encontró ID de descarga')
    let res = await fetch(`https://drive.google.com/uc?id=${id}&authuser=0&export=download`,
      {
        method: 'post', headers: { 'accept-encoding': 'gzip, deflate, br', 'content-length': 0, 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8', origin: 'https://drive.google.com', 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.181 Safari/537.36', 'x-client-data': 'CKG1yQEIkbbJAQiitskBCMS2yQEIqZ3KAQioo8oBGLeYygE=', 'x-drive-first-party': 'DriveWebUi', 'x-json-requested': 'true' }
      }
    )
    let { fileName, sizeBytes, downloadUrl } = JSON.parse((await res.text()).slice(4))
    if (!downloadUrl) throw new Error('Se excedió el número de descargas del link')
    let data = await fetch(downloadUrl)
    if (data.status !== 200) throw new Error(data.statusText)
    return {
      status: true,
      data: { downloadUrl, fileName, fileSize: `${(sizeBytes / (1024 * 1024)).toFixed(2)} MB`, mimetype: data.headers.get('content-type') }
    }
  } catch (error) {
    return { status: false, message: error.message }
  }
}