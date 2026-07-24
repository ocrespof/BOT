import axios from 'axios';
import FormData from 'form-data';

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

// User name resolution prioritizing public profile names with groupMetadata & database lookups
async function getUserName(client, jid, pushName, chatId) {
    const isPhone = (str) => !str || /^\+?[0-9\s\-()]+$/.test(str.trim());

    if (pushName && !isPhone(pushName)) return pushName.trim();
    if (!jid) return 'Usuario';

    const dbName = global.db?.data?.users?.[jid]?.name;
    if (dbName && !isPhone(dbName)) return dbName.trim();

    if (client && chatId?.endsWith('@g.us')) {
        try {
            const meta = await client.groupMetadata(chatId).catch(() => null);
            const p = meta?.participants?.find(x => client.decodeJid(x.id) === client.decodeJid(jid));
            const pName = p?.name || p?.notify;
            if (pName && !isPhone(pName)) return pName.trim();
        } catch {}
    }

    if (client?.getName) {
        try {
            const name = await client.getName(jid);
            if (name && !isPhone(name)) return name.trim();
        } catch {}
    }

    return '@' + jid.split('@')[0];
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
    command: ['quoted', 'q', 'fakereply', 'quote', 'q1', 'q2', 'q3', 'q4', 'q5'],
    category: 'stickers',
    desc: 'Genera un sticker de cita a partir de texto o varios mensajes.',
    usage: '.q [texto] o responde a un mensaje con .q [número] o usa .q2 / .q4 directamente.',

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

        // 2. Determinar cantidad de mensajes (.q1-.q5 o argumento numérico)
        const qMatch = command.match(/^q([1-5])$/);
        let numMsgs = qMatch ? parseInt(qMatch[1]) : 1;
        let text = '';

        if (!qMatch && args.length > 0) {
            if (!isNaN(args[0]) && args.length === 1 && m.quoted) {
                numMsgs = Math.max(1, Math.min(parseInt(args[0]), 5));
            } else {
                text = args.join(' ').trim();
            }
        }

        // 3. Recopilar mensajes a citar
        let messagesToQuote = [];
        const buffer = global.msgBuffer?.[m.chat] || [];

        if (numMsgs > 1 && m.quoted) {
            const startIdx = buffer.findIndex(msg => msg.key.id === m.quoted.id);
            if (startIdx !== -1) {
                messagesToQuote = buffer.slice(startIdx, startIdx + numMsgs).map(msg => ({
                    sender: msg.sender,
                    pushName: msg.pushName,
                    text: msg.text || msg.caption || '',
                    isMedia: msg.isMedia || false,
                    type: msg.type || '',
                    msgObj: msg,
                    quoted: msg.quoted ? {
                        sender: msg.quoted.sender,
                        pushName: msg.quoted.pushName,
                        text: msg.quoted.text || msg.quoted.caption || (msg.quoted.message?.imageMessage ? '📷 Imagen' : (msg.quoted.message?.videoMessage ? '🎥 Video' : (msg.quoted.message?.stickerMessage ? '🧩 Sticker' : 'Mensaje')))
                    } : null
                }));
            } else {
                messagesToQuote = [{
                    sender: m.quoted.sender,
                    pushName: m.quoted.pushName,
                    text: m.quoted.text || m.quoted.caption || '',
                    isMedia: m.quoted.isMedia || false,
                    type: m.quoted.type || '',
                    msgObj: m.quoted,
                    quoted: null
                }];
                m.reply('⚠️ No pude encontrar los mensajes siguientes en memoria, creando sticker solo del mensaje respondido.');
            }
        } else if (!text) {
            const q = m.quoted;
            if (!q) return m.reply('📝 Por favor, proporciona un texto o responde a un mensaje.\n\nEjemplos:\n* .q <texto>\n* Responde a un mensaje con .q\n* Responde a un mensaje con .q 2 (para capturar 2 mensajes)\n* Usa atajos como .q2 o .q4 en respuestas.\n* Cambia el color con .q #ff0000 o .q --red');

            text = q.text || q.caption || '';
            let parentQuoted = null;
            const msgFromBuffer = buffer.find(msg => msg.key.id === q.id);
            if (msgFromBuffer?.quoted) {
                parentQuoted = msgFromBuffer.quoted;
            } else if (m.getQuotedObj) {
                const fullQuotedMsg = await m.getQuotedObj().catch(() => null);
                if (fullQuotedMsg?.quoted) parentQuoted = fullQuotedMsg.quoted;
            }

            messagesToQuote = [{
                sender: q.sender,
                pushName: q.pushName,
                text,
                isMedia: q.isMedia || false,
                type: q.type || '',
                msgObj: q,
                quoted: parentQuoted ? {
                    sender: parentQuoted.sender,
                    pushName: parentQuoted.pushName,
                    text: parentQuoted.text || parentQuoted.caption || (parentQuoted.message?.imageMessage ? '📷 Imagen' : (parentQuoted.message?.videoMessage ? '🎥 Video' : (parentQuoted.message?.stickerMessage ? '🧩 Sticker' : 'Mensaje')))
                } : null
            }];
        } else {
            const who = m.mentionedJid?.[0] || (m.quoted ? m.quoted.sender : m.sender);
            messagesToQuote = [{
                sender: who,
                pushName: m.quoted ? m.quoted.pushName : m.pushName,
                text,
                isMedia: false,
                type: 'conversation',
                msgObj: null,
                quoted: null
            }];
        }

        await m.react('🕒');

        const getPfp = async (jid) => client.profilePictureUrl(jid, 'image').catch(() => 'https://telegra.ph/file/24fa902ead26340f3df2c.png');

        // 4. Construir payloads para la API de Citas en PARALELO
        const apiMessages = await Promise.all(messagesToQuote.map(async (msg) => {
            const jid = msg.sender || m.sender;
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
                const isImage = msg.msgObj.message?.imageMessage || msg.msgObj.type === 'imageMessage' || (msg.msgObj.mime && /image/i.test(msg.msgObj.mime));
                const isSticker = msg.msgObj.message?.stickerMessage || msg.msgObj.type === 'stickerMessage' || (msg.msgObj.mime && /webp/i.test(msg.msgObj.mime));
                if (!isImage && !isSticker) {
                    msgText = msg.type === 'videoMessage' ? '🎥 Video' : (msg.type === 'stickerMessage' ? '🧩 Sticker' : 'Mensaje multimedia');
                }
            }

            let replyMessage = {};
            if (msg.quoted) {
                const replyName = await getUserName(client, msg.quoted.sender, msg.quoted.pushName, m.chat);
                replyMessage = {
                    name: replyName,
                    text: msg.quoted.text,
                    chatId: msg.quoted.sender.split('@')[0]
                };
            }

            const apiMsg = {
                entities,
                avatar: true,
                from: { id: jid.split('@')[0], name, photo: { url: pfp } },
                text: msgText,
                replyMessage
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
