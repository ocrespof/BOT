import { createRequire } from 'module'
import { downloadContentFromMessage } from '@whiskeysockets/baileys'
import fs from 'fs'
import path from 'path'

const require = createRequire(import.meta.url)
const acrcloud = require('acrcloud')

const acr = new acrcloud({
    host: 'identify-eu-west-1.acrcloud.com',
    access_key: 'c33c767d683f78bd17d4bd4991955d81',
    access_secret: 'bvgaIAEtADBTbLwiPGYlxupWqkNGIjT7J9Ag2vIu',
})

/* ================= MEDIA HELPERS ================= */
function getAudioOrVideo(message) {
    const m = message.message || {}
    if (m.audioMessage) return { msg: m.audioMessage, type: 'audio', ext: '.mp3' }
    if (m.videoMessage) return { msg: m.videoMessage, type: 'video', ext: '.mp4' }

    const quoted = m.extendedTextMessage?.contextInfo?.quotedMessage
    if (!quoted) return null

    if (quoted.audioMessage) return { msg: quoted.audioMessage, type: 'audio', ext: '.mp3' }
    if (quoted.videoMessage) return { msg: quoted.videoMessage, type: 'video', ext: '.mp4' }

    return null
}

async function downloadMedia(msg, type) {
    const stream = await downloadContentFromMessage(msg, type)
    const chunks = []
    for await (const chunk of stream) chunks.push(chunk)
    return Buffer.concat(chunks)
}

/* ================= COMMAND MODULE ================= */
export default {
    command: ['shazam', 'whatmusic', 'songid'],
    category: 'utils',
  desc: 'Identificar canciones.',
    description: 'Identify a song from audio or video',
    usage: 'Responder a audio o video',
    run: async (client, m, args, usedPrefix, command) => {
        try {
            const media = getAudioOrVideo(m)
            if (!media) {
                return await client.sendMessage(
                    m.chat,
                    { text: '⚠️ *RESPONDE A UN AUDIO O VIDEO*' },
                    { quoted: m }
                )
            }

            await m.react('🕒')
            const buffer = await downloadMedia(media.msg, media.type)

            const tmpDir = path.join(process.cwd(), 'tmp')
            if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true })

            const tmpPath = path.join(tmpDir, `${Date.now()}${media.ext}`)
            fs.writeFileSync(tmpPath, buffer)

            const res = await acr.identify(fs.readFileSync(tmpPath))
            fs.unlinkSync(tmpPath)

            const { code, msg } = res.status
            if (code !== 0) throw msg
            const music = res.metadata?.music?.[0]
            if (!music) throw new Error('No match found')
            
            const text = `ㅤ۟∩　ׅ　★　ׅ　🅢hazam 🅡ecognition　ׄᰙ　\n\n` +
            `𖣣ֶㅤ֯⌗ ☆  ׄ ⬭ *Canción* › ${music.title || 'NOT FOUND'}\n` +
            `𖣣ֶㅤ֯⌗ ☆  ׄ ⬭ *Artista* › ${music.artists?.map(a => a.name).join(', ') || 'NOT FOUND'}\n` +
            `𖣣ֶㅤ֯⌗ ☆  ׄ ⬭ *Álbum* › ${music.album?.name || 'NOT FOUND'}\n` +
            `𖣣ֶㅤ֯⌗ ☆  ׄ ⬭ *Lanzamiento* › ${music.release_date || 'NOT FOUND'}`
            
            await client.sendMessage(m.chat, { text }, { quoted: m })
            await m.react('✔️')
        } catch(err) {
            console.error('[SHZ]', err)
            await m.react('❌')
            await client.sendMessage(
                m.chat,
                { text: `❌ Error al reconocer: ${err.message || err}` },
                { quoted: m }
            )
        }
    }
}
