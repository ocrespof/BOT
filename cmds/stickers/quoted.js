import axios from 'axios';
import FormData from 'form-data';
import { getCachedPushName } from '../../core/message.js';

// Parse WhatsApp markdown (*bold*, _italic_, ~strike~, `code`) to Telegram entities
function parseMarkdownToEntities(text) {
    const entities = [];
    let cleanText = text;
    const regexes = [
        { pattern: /\*([^*]+)\*/g, type: 'bold' },
        { pattern: /_([^_]+)_/g, type: 'italic' },
        { pattern: /~([^~]+)~/g, type: 'strikethrough' },
        { pattern: /`([^`]+)`/g, type: 'code' }
    ];

    let changed = true;
    while (changed) {
        changed = false;
        for (const { pattern, type } of regexes) {
            pattern.lastIndex = 0;
            const match = pattern.exec(cleanText);
            if (match) {
                const [fullMatch, content] = match;
                const startIdx = match.index;
                const length = content.length;
                const diff = fullMatch.length - length;
                const markerLen = fullMatch.indexOf(content);
                
                cleanText = cleanText.substring(0, startIdx) + content + cleanText.substring(startIdx + fullMatch.length);
                
                for (const ent of entities) {
                    if (ent.offset >= startIdx + fullMatch.length) ent.offset -= diff;
                    else if (ent.offset <= startIdx && ent.offset + ent.length >= startIdx + fullMatch.length) ent.length -= diff;
                    else if (ent.offset >= startIdx && ent.offset + ent.length <= startIdx + fullMatch.length) ent.offset -= markerLen;
                }
                
                entities.push({ type, offset: startIdx, length });
                changed = true;
                break;
            }
        }
    }
    return { text: cleanText, entities };
}

// User name resolution prioritizing pushName
async function getUserName(client, jid, pushName, chatId) {
    if (pushName && typeof pushName === 'string' && pushName.trim()) return pushName.trim();
    if (!jid) return 'Usuario';

    const cachedPush = getCachedPushName?.(jid);
    if (cachedPush && typeof cachedPush === 'string' && cachedPush.trim()) return cachedPush.trim();

    if (chatId && global.msgBuffer?.[chatId]) {
        const bufferedMsg = global.msgBuffer[chatId].find(m => (m.sender === jid || m.key?.participant === jid) && m.pushName?.trim());
        if (bufferedMsg?.pushName) return bufferedMsg.pushName.trim();
    }

    const dbName = global.db?.data?.users?.[jid]?.name;
    if (dbName && typeof dbName === 'string' && dbName.trim()) return dbName.trim();

    if (client?.getName) {
        try {
            const name = await client.getName(jid);
            if (name && typeof name === 'string' && name.trim()) return name.trim();
        } catch {}
    }

    return 'Usuario';
}

// Unified multi-provider file uploader
async function uploadMedia(buffer, mime) {
    const ext = mime.split("/")[1] || "bin";
    const filename = `${Math.random().toString(36).substring(2, 8)}.${ext}`;

    const uploaders = [
        async () => {
            const form = new FormData();
            form.append("reqtype", "fileupload");
            form.append("userhash", "c9bc208e83a7dbc7c7cc68aff");
            form.append("fileToUpload", buffer, { filename });
            const res = await axios.post("https://catbox.moe/user/api.php", form, { headers: form.getHeaders() });
            return typeof res.data === "string" && res.data.startsWith("https://") ? res.data : null;
        },
        async () => {
            const form = new FormData();
            form.append("files[]", buffer, filename);
            const res = await axios.post("https://uguu.se/upload.php", form, { headers: form.getHeaders() });
            return res.data?.files?.[0]?.url || null;
        },
        async () => {
            const form = new FormData();
            form.append("file", buffer, { filename, contentType: mime });
            const res = await axios.post("https://qu.ax/upload.php", form, { headers: form.getHeaders() });
            return res.data?.files?.[0]?.url || null;
        }
    ];

    for (const uploader of uploaders) {
        try {
            const url = await uploader();
            if (url) return url;
        } catch {}
    }
    return null;
}

// Extract and upload media from WhatsApp message
async function getMediaUploadUrl(msg) {
    if (!msg) return null;
    const isSticker = msg.message?.stickerMessage || msg.type === 'stickerMessage' || (msg.mime && /webp/i.test(msg.mime));
    const isImage = msg.message?.imageMessage || msg.type === 'imageMessage' || (msg.mime && /image/i.test(msg.mime) && !/webp/i.test(msg.mime));
    const isVideo = msg.message?.videoMessage || msg.type === 'videoMessage' || (msg.mime && /video/i.test(msg.mime));

    if (isImage || isSticker || isVideo) {
        try {
            const downloadFunc = msg.download || (msg.getQuotedObj ? async () => (await msg.getQuotedObj())?.download() : null);
            if (downloadFunc) {
                const buffer = await downloadFunc();
                if (buffer) {
                    const mime = msg.mime || msg.msg?.mimetype || (isImage ? 'image/jpeg' : isSticker ? 'image/webp' : 'video/mp4');
                    const url = await uploadMedia(buffer, mime);
                    if (url) return { url, type: isSticker ? 'sticker' : 'image' };
                }
            }
        } catch (e) {
            console.error('Failed media upload for quote:', e);
        }
    }
    return null;
}

export default {
    command: ['quoted', 'q', 'fakereply', 'quote', 'q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8', 'q9', 'q10'],
    category: 'stickers',
    desc: 'Genera un sticker de cita a partir de texto o varios mensajes.',
    usage: '.q [texto] o responde a un mensaje con .q, .q 2, .q 3 o usa atajos como .q2, .q3.',

    run: async (client, m, args, usedPrefix, command) => {
        // 1. Extraer color de fondo (preset o código hex)
        let backgroundColor = '#1b1429';
        const colorPresets = { '--dark': '#1b1429', '--black': '#000000', '--red': '#8b0000', '--blue': '#00008b', '--green': '#006400', '--purple': '#4b0082', '--grey': '#2f4f4f' };

        for (let i = 0; i < args.length; i++) {
            const arg = args[i];
            if (colorPresets[arg]) {
                backgroundColor = colorPresets[arg];
                args.splice(i, 1);
                break;
            } else if (/^#[0-9a-fA-F]{3,6}$/.test(arg)) {
                backgroundColor = arg;
                args.splice(i, 1);
                break;
            }
        }

        // 2. Determinar cantidad de mensajes (.q1-.q10 o argumento numérico)
        const qMatch = command.match(/^q([1-9]|10)$/i);
        let numMsgs = qMatch ? parseInt(qMatch[1]) : 1;
        let text = '';

        if (!qMatch && args.length > 0) {
            const firstNum = parseInt(args[0]);
            if (!isNaN(firstNum) && firstNum >= 1 && firstNum <= 10 && m.quoted) {
                numMsgs = firstNum;
                args.shift();
            } else if (!m.quoted) {
                text = args.join(' ').trim();
            }
        }

        // 3. Recopilar mensajes a citar
        let messagesToQuote = [];
        const buffer = global.msgBuffer?.[m.chat] || [];

        if (m.quoted) {
            const quotedId = m.quoted.id;
            const startIdx = buffer.findIndex(msg => (msg.key?.id || msg.id) === quotedId);

            if (startIdx !== -1) {
                const sliced = buffer.slice(startIdx, startIdx + numMsgs);
                messagesToQuote = sliced.map(msg => ({
                    sender: msg.sender || msg.key?.participant || m.chat,
                    pushName: msg.pushName,
                    text: msg.text || msg.caption || '',
                    isMedia: Boolean(msg.message?.imageMessage || msg.message?.videoMessage || msg.message?.stickerMessage),
                    type: msg.type || '',
                    msgObj: msg
                }));
            } else {
                messagesToQuote.push({
                    sender: m.quoted.sender,
                    pushName: m.quoted.pushName,
                    text: m.quoted.text || m.quoted.caption || '',
                    isMedia: Boolean(m.quoted.message?.imageMessage || m.quoted.message?.videoMessage || m.quoted.message?.stickerMessage),
                    type: m.quoted.type || '',
                    msgObj: m.quoted
                });

                if (numMsgs > 1) {
                    const quotedTime = Number(m.quoted.messageTimestamp || 0);
                    const subsequent = buffer.filter(msg => {
                        const t = Number(msg.messageTimestamp || 0);
                        return t >= quotedTime && (msg.key?.id || msg.id) !== quotedId;
                    }).slice(0, numMsgs - 1);

                    for (const msg of subsequent) {
                        messagesToQuote.push({
                            sender: msg.sender || msg.key?.participant || m.chat,
                            pushName: msg.pushName,
                            text: msg.text || msg.caption || '',
                            isMedia: Boolean(msg.message?.imageMessage || msg.message?.videoMessage || msg.message?.stickerMessage),
                            type: msg.type || '',
                            msgObj: msg
                        });
                    }
                }
            }
        } else if (text) {
            const who = m.mentionedJid?.[0] || m.sender;
            messagesToQuote = [{
                sender: who,
                pushName: m.pushName,
                text,
                isMedia: false,
                type: 'conversation',
                msgObj: null
            }];
        } else {
            return m.reply('📝 Responde a un mensaje con *.q* (o *.q 2*, *.q 3*, *.q2*, *.q3*) o escribe *.q <texto>*.');
        }

        await m.react('🕒');

        const getPfp = async (jid) => client.profilePictureUrl(jid, 'image').catch(() => 'https://telegra.ph/file/24fa902ead26340f3df2c.png');

        // 4. Construir payloads para la API de Citas en PARALELO
        const apiMessages = await Promise.all(messagesToQuote.map(async (msg) => {
            const jid = client.decodeJid(msg.sender || m.sender);
            const [name, pfp, mediaInfo] = await Promise.all([
                getUserName(client, jid, msg.pushName, m.chat),
                getPfp(jid),
                msg.msgObj ? getMediaUploadUrl(msg.msgObj) : Promise.resolve(null)
            ]);

            let msgText = msg.text || '';
            let entities = [];
            if (msgText) {
                const parsed = parseMarkdownToEntities(msgText);
                msgText = parsed.text;
                entities = parsed.entities;
            } else if (msg.isMedia && msg.msgObj) {
                const isImage = msg.msgObj.message?.imageMessage || msg.msgObj.type === 'imageMessage';
                const isSticker = msg.msgObj.message?.stickerMessage || msg.msgObj.type === 'stickerMessage';
                if (!isImage && !isSticker) {
                    msgText = msg.type === 'videoMessage' ? '🎥 Video' : (msg.type === 'stickerMessage' ? '🧩 Sticker' : 'Mensaje multimedia');
                }
            }

            const apiMsg = {
                entities,
                avatar: true,
                from: { id: jid.split('@')[0], name, photo: { url: pfp } },
                text: msgText,
                replyMessage: {}
            };

            if (mediaInfo) {
                apiMsg.media = { url: mediaInfo.url };
                if (mediaInfo.type === 'sticker') apiMsg.mediaType = 'sticker';
            }

            return apiMsg;
        }));

        // 5. Llamar a la API de citas y enviar sticker
        const QUOTE_ENDPOINTS = [
            'https://bot.lyo.su/quote/generate',
            'https://quote.yuri.ly/generate'
        ];

        try {
            const quoteObj = {
                type: 'quote',
                format: 'png',
                backgroundColor,
                width: 512,
                height: 512,
                scale: 2,
                messages: apiMessages
            };

            let res;
            let apiError = null;
            for (const endpoint of QUOTE_ENDPOINTS) {
                try {
                    res = await axios.post(endpoint, quoteObj, {
                        headers: { 'Content-Type': 'application/json' },
                        timeout: 12000
                    });
                    if (res.data?.result?.image) {
                        apiError = null;
                        break;
                    }
                } catch (err) {
                    apiError = err;
                }
            }

            if (apiError || !res?.data?.result?.image) {
                throw apiError || new Error('La API devolvió datos inválidos.');
            }

            const bufferImage = Buffer.from(res.data.result.image, 'base64');
            const userDb = global.db?.data?.users?.[m.sender] || {};
            const packname = userDb.metadatos?.trim() || 'YukiBot Quotes';
            const author = userDb.metadatos2?.trim() || (apiMessages[0]?.from?.name || 'Usuario');

            if (typeof client.sendImageAsSticker === 'function') {
                await client.sendImageAsSticker(m.chat, bufferImage, m, { packname, author });
            } else {
                await client.sendMessage(m.chat, { image: bufferImage }, { quoted: m });
            }
            await m.react('✔️');
        } catch (err) {
            console.error('Quote plugin error:', err);
            await m.react('❌');
            await m.reply('❌ Fallo al generar la cita. Inténtalo de nuevo más tarde.');
        }
    }
};
