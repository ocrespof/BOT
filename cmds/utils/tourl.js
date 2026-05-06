import axios from "axios"
import FormData from "form-data"

function formatBytes(bytes) {
  if (bytes === 0) return "0 B"
  const sizes = ["B", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / 1024 ** i).toFixed(2)} ${sizes[i]}`
}

function generateUniqueFilename(mime) {
  const ext = mime.split("/")[1] || "bin"
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  let id = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
  return `${id}.${ext}`
}

async function uploadCatbox(buffer, mime) {
  const form = new FormData()
  form.append("reqtype", "fileupload")
  form.append("userhash", "c9bc208e83a7dbc7c7cc68aff")
  form.append("fileToUpload", buffer, { filename: generateUniqueFilename(mime) })
  const res = await axios.post("https://catbox.moe/user/api.php", form, { headers: form.getHeaders(), maxContentLength: Infinity, maxBodyLength: Infinity })
  if (typeof res.data !== "string" || !res.data.startsWith("https://")) {
    throw new Error("Respuesta inválida de Catbox: " + JSON.stringify(res.data))
  }
  return res.data
}

async function uploadUguu(buffer) {
  const form = new FormData()
  form.append("files[]", buffer, generateUniqueFilename("image/jpeg"))
  const res = await axios.post("https://uguu.se/upload.php", form, { headers: form.getHeaders(), maxContentLength: Infinity, maxBodyLength: Infinity })
  const data = res.data
  const url = data?.files?.[0]?.url
  if (!url) throw new Error("Respuesta inválida de Uguu: " + JSON.stringify(data))
  return url
}

async function uploadQuax(buffer, mime) {
  const form = new FormData()
  form.append("file", buffer, { filename: generateUniqueFilename(mime), contentType: mime })
  const res = await axios.post("https://qu.ax/upload.php", form, { headers: form.getHeaders(), maxContentLength: Infinity, maxBodyLength: Infinity })
  const data = res.data
  if (!data?.files?.[0]?.url) throw new Error("Respuesta inválida de Quax: " + JSON.stringify(data))
  return data.files[0].url
}

async function uploadAuto(buffer, mime) {
  try {
    return { link: await uploadCatbox(buffer, mime), server: "catbox" }
  } catch {
    try {
      return { link: await uploadUguu(buffer), server: "uguu" }
    } catch {
      try {
        return { link: await uploadQuax(buffer, mime), server: "quax" }
      } catch {
        throw new Error("Todos los servidores fallaron")
      }
    }
  }
}

export default {
  command: ['tourl'],
  category: 'utils',
  desc: 'Subir archivo a URL.',
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
      await client.reply(m.chat, `> An unexpected error occurred while executing command *${usedPrefix + command}*. Please try again or contact support if the issue persists.\n[Error: *${e.message}*]`, m);
    }
  }
};