import axios from 'axios';

export default {
    command: ['quoted', 'q', 'fakereply', 'quote'],
    category: 'stickers',
    desc: 'Genera un sticker de cita a partir de texto o varios mensajes.',
    usage: '.q [texto] o responde a un mensaje con .q [número]',

    run: async (client, m, args, usedPrefix, command) => {
        let numMsgs = 1;
        let text = '';
        
        // Determinar si el usuario pasó un número (ej: .q 2) o un texto (ej: .q hola)
        if (args.length > 0) {
            if (!isNaN(args[0]) && args.length === 1 && m.quoted) {
                numMsgs = Math.max(1, Math.min(parseInt(args[0]), 5)); // Limitar a 5 mensajes máx
            } else {
                text = args.join(' ').trim();
            }
        }

        let messagesToQuote = [];

        if (numMsgs > 1 && m.quoted) {
            const buffer = global.msgBuffer?.[m.chat] || [];
            // Buscar el índice del mensaje al que se respondió
            const startIdx = buffer.findIndex(msg => msg.key.id === m.quoted.id);
            
            if (startIdx !== -1) {
                // Tomamos desde el mensaje respondido hasta N mensajes adelante
                const slice = buffer.slice(startIdx, startIdx + numMsgs);
                messagesToQuote = slice.map(msg => ({
                    sender: msg.sender,
                    pushName: msg.pushName,
                    text: msg.text || msg.caption || (msg.message?.imageMessage ? '📷 Imagen' : (msg.message?.videoMessage ? '🎥 Video' : (msg.message?.stickerMessage ? '🧩 Sticker' : 'Mensaje')))
                }));
            } else {
                // Fallback si el mensaje no está en buffer (por ej. reinicio del bot)
                messagesToQuote = [{ 
                    sender: m.quoted.sender, 
                    pushName: m.quoted.pushName || global.db.data.users[m.quoted.sender]?.name || 'Usuario', 
                    text: m.quoted.text || m.quoted.caption || 'Mensaje multimedia'
                }];
                if (numMsgs > 1) {
                    m.reply('⚠️ No pude encontrar los mensajes siguientes en memoria, creando sticker solo del mensaje respondido.');
                }
            }
        } else {
            // Caso de 1 mensaje: usamos el texto ingresado o el mensaje respondido
            if (!text) {
                const q = m.quoted;
                if (!q) return m.reply('📝 Por favor, proporciona un texto o responde a un mensaje.\n\nEjemplos:\n* .q <texto>\n* Responde a un mensaje con .q\n* Responde a un mensaje con .q 2 (para capturar 2 mensajes)');
                text = q.text || q.caption || (q.message?.imageMessage ? '📷 Imagen' : (q.message?.videoMessage ? '🎥 Video' : (q.message?.stickerMessage ? '🧩 Sticker' : 'Mensaje multimedia')));
            }
            
            const who = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : (m.quoted ? m.quoted.sender : m.sender);
            const userName = (m.quoted ? (m.quoted.pushName || global.db.data.users[who]?.name || 'Usuario') : m.pushName) || 'Usuario';
            
            messagesToQuote = [{
                sender: who,
                pushName: userName,
                text: text
            }];
        }

        await m.react('🕒');

        // Función para obtener foto de perfil
        const getPfp = async (jid) => {
            try {
                return await client.profilePictureUrl(jid, 'image');
            } catch {
                return 'https://i.ibb.co/9HY4wjz/a4c0b1af253197d4837ff6760d5b81c0.jpg'; // Imagen por defecto
            }
        };

        // Construir array de mensajes para la API
        const apiMessages = [];
        for (const msg of messagesToQuote) {
            const jid = msg.sender || m.sender;
            const name = msg.pushName || global.db.data.users[jid]?.name || 'Usuario';
            const msgText = msg.text || 'Mensaje';
            const pfp = await getPfp(jid);
            
            apiMessages.push({
                entities: [],
                avatar: true,
                from: { id: jid.split('@')[0], name: name, photo: { url: pfp } },
                text: msgText,
                replyMessage: {}
            });
        }

        try {
            const res = await axios.post('https://bot.lyo.su/quote/generate', {
                type: 'quote',
                format: 'png',
                backgroundColor: '#1b1429',
                width: 512,
                height: 512,
                scale: 2,
                messages: apiMessages
            }, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 30000
            });

            if (!res.data?.result?.image) throw new Error('Respuesta inválida de la API');

            const bufferImage = Buffer.from(res.data.result.image, 'base64');

            try {
                // Intentar enviar como sticker nativo
                if (typeof client.sendImageAsSticker === 'function') {
                    await client.sendImageAsSticker(m.chat, bufferImage, m, { packname: 'YukiBot Quotes', author: messagesToQuote[0].pushName });
                } else {
                    // Fallback a imagen normal
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
