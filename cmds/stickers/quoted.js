import axios from 'axios';
import FormData from 'form-data';

// Helper to parse WhatsApp markdown formatting to Telegram entities
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
                const fullMatch = match[0];
                const content = match[1];
                const startIdx = match.index;
                const length = content.length;
                
                cleanText = cleanText.substring(0, startIdx) + content + cleanText.substring(startIdx + fullMatch.length);
                
                for (const ent of entities) {
                    if (ent.offset > startIdx) {
                        ent.offset -= (fullMatch.length - length);
                    }
                }
                
                entities.push({
                    type,
                    offset: startIdx,
                    length
                });
                changed = true;
                break;
            }
        }
    }

    return { text: cleanText, entities };
}

function generateUniqueFilename(mime) {
    const ext = mime.split("/")[1] || "bin";
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let id = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    return `${id}.${ext}`;
}

async function uploadCatbox(buffer, mime) {
    const form = new FormData();
    form.append("reqtype", "fileupload");
    form.append("userhash", "c9bc208e83a7dbc7c7cc68aff");
    form.append("fileToUpload", buffer, { filename: generateUniqueFilename(mime) });
    const res = await axios.post("https://catbox.moe/user/api.php", form, { 
        headers: form.getHeaders(), 
        maxContentLength: Infinity, 
        maxBodyLength: Infinity 
    });
    if (typeof res.data !== "string" || !res.data.startsWith("https://")) {
        throw new Error("Invalid Catbox response");
    }
    return res.data;
}

async function uploadUguu(buffer, mime) {
    const form = new FormData();
    form.append("files[]", buffer, generateUniqueFilename(mime));
    const res = await axios.post("https://uguu.se/upload.php", form, { 
        headers: form.getHeaders(), 
        maxContentLength: Infinity, 
        maxBodyLength: Infinity 
    });
    const url = res.data?.files?.[0]?.url;
    if (!url) throw new Error("Invalid Uguu response");
    return url;
}

async function uploadQuax(buffer, mime) {
    const form = new FormData();
    form.append("file", buffer, { filename: generateUniqueFilename(mime), contentType: mime });
    const res = await axios.post("https://qu.ax/upload.php", form, { 
        headers: form.getHeaders(), 
        maxContentLength: Infinity, 
        maxBodyLength: Infinity 
    });
    const url = res.data?.files?.[0]?.url;
    if (!url) throw new Error("Invalid Quax response");
    return url;
}

async function uploadAuto(buffer, mime) {
    try {
        return await uploadCatbox(buffer, mime);
    } catch {
        try {
            return await uploadUguu(buffer, mime);
        } catch {
            try {
                return await uploadQuax(buffer, mime);
            } catch {
                return null;
            }
        }
    }
}

async function getMediaUploadUrl(msg) {
    if (!msg) return null;
    const isSticker = msg.message?.stickerMessage || msg.type === 'stickerMessage' || (msg.mime && /webp/i.test(msg.mime));
    const isImage = msg.message?.imageMessage || msg.type === 'imageMessage' || (msg.mime && /image/i.test(msg.mime) && !/webp/i.test(msg.mime));
    const isVideo = msg.message?.videoMessage || msg.type === 'videoMessage' || (msg.mime && /video/i.test(msg.mime));
    
    if (isImage || isSticker || isVideo) {
        try {
            const downloadFunc = msg.download || (msg.getQuotedObj ? async () => {
                const qObj = await msg.getQuotedObj();
                return qObj ? qObj.download() : null;
            } : null);
            
            if (downloadFunc) {
                const buffer = await downloadFunc();
                if (buffer) {
                    const mime = msg.mime || msg.msg?.mimetype || (isImage ? 'image/jpeg' : isSticker ? 'image/webp' : 'video/mp4');
                    const uploadUrl = await uploadAuto(buffer, mime);
                    if (uploadUrl) {
                        return {
                            url: uploadUrl,
                            type: isSticker ? 'sticker' : 'image'
                        };
                    }
                }
            }
        } catch (e) {
            console.error('Failed to download/upload media for quote:', e);
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
        let numMsgs = 1;
        let text = '';

        // 1. Extraer color de fondo si el usuario ingresó un preset o un hex
        let backgroundColor = '#1b1429';
        const colorPresets = {
            '--dark': '#1b1429',
            '--black': '#000000',
            '--red': '#8b0000',
            '--blue': '#00008b',
            '--green': '#006400',
            '--purple': '#4b0082',
            '--grey': '#2f4f4f'
        };

        for (const preset in colorPresets) {
            const idx = args.indexOf(preset);
            if (idx !== -1) {
                backgroundColor = colorPresets[preset];
                args.splice(idx, 1);
                break;
            }
        }

        const hexIdx = args.findIndex(arg => /^#[0-9a-fA-F]{6}$|^#[0-9a-fA-F]{3}$/.test(arg));
        if (hexIdx !== -1) {
            backgroundColor = args[hexIdx];
            args.splice(hexIdx, 1);
        }

        // 2. Determinar si el comando es tipo .q2 o si se pasó un número como argumento
        const cmdMatch = command.match(/^q([1-5])$/);
        if (cmdMatch) {
            numMsgs = parseInt(cmdMatch[1]);
        } else if (args.length > 0) {
            if (!isNaN(args[0]) && args.length === 1 && m.quoted) {
                numMsgs = Math.max(1, Math.min(parseInt(args[0]), 5)); // Limitar a 5 mensajes máx
            } else {
                text = args.join(' ').trim();
            }
        }

        let messagesToQuote = [];

        if (numMsgs > 1 && m.quoted) {
            const buffer = global.msgBuffer?.[m.chat] || [];
            const startIdx = buffer.findIndex(msg => msg.key.id === m.quoted.id);

            if (startIdx !== -1) {
                const slice = buffer.slice(startIdx, startIdx + numMsgs);
                messagesToQuote = slice.map(msg => ({
                    sender: msg.sender,
                    pushName: msg.pushName,
                    text: msg.text || msg.caption || '',
                    isMedia: msg.isMedia || false,
                    type: msg.type || '',
                    msgObj: msg,
                    quoted: msg.quoted ? {
                        sender: msg.quoted.sender,
                        pushName: msg.quoted.pushName || global.db.data.users[msg.quoted.sender]?.name || msg.quoted.sender.split('@')[0] || 'Usuario',
                        text: msg.quoted.text || msg.quoted.caption || (msg.quoted.message?.imageMessage ? '📷 Imagen' : (msg.quoted.message?.videoMessage ? '🎥 Video' : (msg.quoted.message?.stickerMessage ? '🧩 Sticker' : 'Mensaje')))
                    } : null
                }));
            } else {
                messagesToQuote = [{
                    sender: m.quoted.sender,
                    pushName: m.quoted.pushName || global.db.data.users[m.quoted.sender]?.name || 'Usuario',
                    text: m.quoted.text || m.quoted.caption || '',
                    isMedia: m.quoted.isMedia || false,
                    type: m.quoted.type || '',
                    msgObj: m.quoted,
                    quoted: null
                }];
                if (numMsgs > 1) {
                    m.reply('⚠️ No pude encontrar los mensajes siguientes en memoria, creando sticker solo del mensaje respondido.');
                }
            }
        } else {
            // Caso de 1 mensaje
            if (!text) {
                const q = m.quoted;
                if (!q) return m.reply('📝 Por favor, proporciona un texto o responde a un mensaje.\n\nEjemplos:\n* .q <texto>\n* Responde a un mensaje con .q\n* Responde a un mensaje con .q 2 (para capturar 2 mensajes)\n* Usa atajos como .q2 o .q4 en respuestas.\n* Cambia el color con .q #ff0000 o .q --red');
                text = q.text || q.caption || '';
                
                // Buscar contexto de respuesta (si q responde a su vez a otro mensaje)
                let parentQuoted = null;
                const buffer = global.msgBuffer?.[m.chat] || [];
                const msgFromBuffer = buffer.find(msg => msg.key.id === q.id);
                if (msgFromBuffer && msgFromBuffer.quoted) {
                    parentQuoted = msgFromBuffer.quoted;
                } else if (m.getQuotedObj) {
                    const fullQuotedMsg = await m.getQuotedObj().catch(() => null);
                    if (fullQuotedMsg && fullQuotedMsg.quoted) {
                        parentQuoted = fullQuotedMsg.quoted;
                    }
                }

                messagesToQuote = [{
                    sender: q.sender,
                    pushName: q.pushName || global.db.data.users[q.sender]?.name || 'Usuario',
                    text: text,
                    isMedia: q.isMedia || false,
                    type: q.type || '',
                    msgObj: q,
                    quoted: parentQuoted ? {
                        sender: parentQuoted.sender,
                        pushName: parentQuoted.pushName || global.db.data.users[parentQuoted.sender]?.name || parentQuoted.sender.split('@')[0] || 'Usuario',
                        text: parentQuoted.text || parentQuoted.caption || (parentQuoted.message?.imageMessage ? '📷 Imagen' : (parentQuoted.message?.videoMessage ? '🎥 Video' : (parentQuoted.message?.stickerMessage ? '🧩 Sticker' : 'Mensaje')))
                    } : null
                }];
            } else {
                const who = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : (m.quoted ? m.quoted.sender : m.sender);
                const userName = (m.quoted ? (m.quoted.pushName || global.db.data.users[who]?.name || 'Usuario') : m.pushName) || 'Usuario';

                messagesToQuote = [{
                    sender: who,
                    pushName: userName,
                    text: text,
                    isMedia: false,
                    type: 'conversation',
                    msgObj: null,
                    quoted: null
                }];
            }
        }

        await m.react('🕒');

        const getPfp = async (jid) => {
            try {
                return await client.profilePictureUrl(jid, 'image');
            } catch {
                return 'https://telegra.ph/file/24fa902ead26340f3df2c.png';
            }
        };

        const apiMessages = [];
        for (const msg of messagesToQuote) {
            const jid = msg.sender || m.sender;
            const name = msg.pushName || global.db.data.users[jid]?.name || 'Usuario';
            
            let msgText = msg.text || '';
            let entities = [];
            if (msgText) {
                const parsed = parseMarkdownToEntities(msgText);
                msgText = parsed.text;
                entities = parsed.entities;
            }

            if (!msgText && msg.isMedia) {
                const isImage = msg.msgObj?.message?.imageMessage || msg.msgObj?.type === 'imageMessage' || (msg.msgObj?.mime && /image/i.test(msg.msgObj.mime));
                const isSticker = msg.msgObj?.message?.stickerMessage || msg.msgObj?.type === 'stickerMessage' || (msg.msgObj?.mime && /webp/i.test(msg.msgObj.mime));
                if (!isImage && !isSticker) {
                    msgText = msg.type === 'videoMessage' ? '🎥 Video' : (msg.type === 'stickerMessage' ? '🧩 Sticker' : 'Mensaje multimedia');
                }
            }

            const pfp = await getPfp(jid);

            let replyMessage = {};
            if (msg.quoted) {
                replyMessage = {
                    name: msg.quoted.pushName,
                    text: msg.quoted.text,
                    chatId: msg.quoted.sender.split('@')[0]
                };
            }

            const apiMsg = {
                entities: entities,
                avatar: true,
                from: { id: jid.split('@')[0], name: name, photo: { url: pfp } },
                text: msgText,
                replyMessage: replyMessage
            };

            if (msg.msgObj) {
                const mediaInfo = await getMediaUploadUrl(msg.msgObj);
                if (mediaInfo) {
                    apiMsg.media = { url: mediaInfo.url };
                    if (mediaInfo.type === 'sticker') {
                        apiMsg.mediaType = 'sticker';
                    }
                }
            }

            apiMessages.push(apiMsg);
        }

        const QUOTE_ENDPOINTS = [
            'https://bot.lyo.su/quote/generate',
            'https://quote.yuri.ly/quote/generate'
        ];

        try {
            const quoteObj = {
                type: 'quote',
                format: 'png',
                backgroundColor: backgroundColor,
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
                        timeout: 15000
                    });
                    if (res.data?.result?.image) {
                        apiError = null;
                        break;
                    }
                } catch (err) {
                    apiError = err;
                    console.warn(`Quote API failed for endpoint ${endpoint}:`, err.message);
                }
            }

            if (apiError || !res?.data?.result?.image) {
                throw apiError || new Error('La API devolvió datos inválidos o fallaron los endpoints.');
            }

            const bufferImage = Buffer.from(res.data.result.image, 'base64');

            // Obtener metadatos personalizados para el sticker
            const userDb = global.db.data.users[m.sender] || {};
            const meta1 = userDb.metadatos ? String(userDb.metadatos).trim() : '';
            const meta2 = userDb.metadatos2 ? String(userDb.metadatos2).trim() : '';
            let packname = meta1 ? meta1 : 'YukiBot Quotes';
            let author = meta1 ? (meta2 ? meta2 : '') : messagesToQuote[0].pushName;

            try {
                if (typeof client.sendImageAsSticker === 'function') {
                    await client.sendImageAsSticker(m.chat, bufferImage, m, { packname: packname, author: author });
                } else {
                    await client.sendMessage(m.chat, { image: bufferImage }, { quoted: m });
                }
                await m.react('✔️');
            } catch (stickerErr) {
                console.error(stickerErr);
                await client.sendMessage(
                    m.chat,
                    { image: bufferImage, caption: '📝 No se pudo convertir a sticker, enviando imagen.' },
                    { quoted: m }
                );
            }
        } catch (err) {
            console.error('Quote plugin error:', err);
            const msg = err.message.includes('timeout')
                ? 'El tiempo de espera se agotó.'
                : err.message.includes('inválida')
                    ? 'La API devolvió datos inválidos.'
                    : 'Inténtalo de nuevo más tarde.';
            await m.react('❌');
            await m.reply(`❌ Fallo al generar la cita. ${msg}`);
        }
    }
};
