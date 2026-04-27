import axios from 'axios';

export default {
    command: ['quoted', 'q', 'fakereply', 'quote'],
    category: 'stickers',
    desc: 'Genera un sticker de cita a partir de texto',
    usage: '.quote <texto> o responde a un mensaje',

    run: async (client, m, args, usedPrefix, command) => {
        const ctx = m.message?.extendedTextMessage?.contextInfo;
        let text = args.join(' ').trim();

        if (!text) {
            const q = m.quoted;
            if (!q) return m.reply('📝 Por favor, proporciona un texto o responde a un mensaje.\n\nEjemplo: .quote <texto>');
            text = q.text || q.caption || 'Mensaje multimedia';
        }

        const who = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : (m.quoted ? m.quoted.sender : m.sender);

        let pfp = 'https://i.ibb.co/9HY4wjz/a4c0b1af253197d4837ff6760d5b81c0.jpg';
        try {
            pfp = await client.profilePictureUrl(who, 'image');
        } catch (e) {}

        const userName = (m.quoted ? (m.quoted.pushName || `@${who.split('@')[0]}`) : m.pushName) || 'Usuario';

        try {
            await m.react('🕒');
            const res = await axios.post('https://bot.lyo.su/quote/generate', {
                type: 'quote',
                format: 'png',
                backgroundColor: '#1b1429',
                width: 1800,
                height: 200,
                scale: 2,
                messages: [{
                    entities: [],
                    avatar: true,
                    from: { id: 1, name: userName, photo: { url: pfp } },
                    text,
                    replyMessage: {}
                }]
            }, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 30000
            });

            if (!res.data?.result?.image) throw new Error('Respuesta inválida de la API');

            const bufferImage = Buffer.from(res.data.result.image, 'base64');

            try {
                // Using client's native sticker generation if available
                if (typeof client.sendImageAsSticker === 'function') {
                    await client.sendImageAsSticker(m.chat, bufferImage, m, { packname: 'YukiBot', author: userName });
                } else {
                    // Fallback to sending as image
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
