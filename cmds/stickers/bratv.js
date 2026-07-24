import axios from 'axios';

// Format text with auto word-wrap to make animated Brat font large, bold & readable
function formatBratText(text) {
    if (!text) return '';
    let clean = text.trim();
    if (clean.length > 200) clean = clean.substring(0, 200);
    if (clean.includes('\n')) return clean;

    const words = clean.split(/\s+/);
    const lines = [];
    let currentLine = '';

    for (const word of words) {
        if ((currentLine + ' ' + word).trim().length <= 18) {
            currentLine = (currentLine + ' ' + word).trim();
        } else {
            if (currentLine) lines.push(currentLine);
            currentLine = word;
        }
    }
    if (currentLine) lines.push(currentLine);
    return lines.join('\n');
}

// Fetch animated sticker video with multi-endpoint fallback
const fetchStickerVideoBuffer = async (formattedText) => {
    const endpoints = [
        { url: 'https://skyzxu-brat.hf.space/brat-animated', params: { text: formattedText } },
        { url: 'https://api.vreden.web.id/api/brat-animated', params: { text: formattedText } },
        { url: 'https://api.siputzx.my.id/api/brat-animated', params: { text: formattedText } }
    ];

    for (const ep of endpoints) {
        try {
            const res = await axios.get(ep.url, {
                params: ep.params,
                responseType: 'arraybuffer',
                timeout: 15000
            });
            if (res.data && res.data.length > 0) {
                return res.data;
            }
        } catch {}
    }
    throw new Error('No se pudo conectar a los servidores de Brat Animado.');
};

export default {
    command: ['bratv', 'bratvid', 'bratanimado'],
    category: 'stickers',
    desc: 'Sticker brat animado con alta legibilidad.',
    usage: '.bratv [texto] o responde a un mensaje.',

    run: async (client, m, args, usedPrefix, command, text) => {
        try {
            const input = m.quoted?.text || m.quoted?.caption || text;
            if (!input) {
                return client.reply(m.chat, '📝 Por favor, responde a un mensaje o ingresa un texto para crear el Sticker animado.', m);
            }

            await m.react('🕒');

            const formattedText = formatBratText(input);
            const videoBuffer = await fetchStickerVideoBuffer(formattedText);

            // Metadata & privacy check
            const userDb = global.db?.data?.users?.[m.sender] || {};
            const isPhone = (str) => !str || /^\+?[0-9\s\-()@]+$/.test(str.trim()) || !/[a-zA-Z\u00C0-\u024F]/.test(str);
            
            const meta1 = userDb.metadatos?.trim();
            const meta2 = userDb.metadatos2?.trim();
            const rawName = m.pushName || userDb.name;
            const validName = (rawName && !isPhone(rawName)) ? rawName.trim() : 'Sticker';

            const packname = meta1 || 'YukiBot Quotes';
            const author = meta1 ? (meta2 || '') : validName;

            if (typeof client.sendVideoAsSticker === 'function') {
                await client.sendVideoAsSticker(m.chat, videoBuffer, m, { packname, author });
            } else if (typeof client.sendImageAsSticker === 'function') {
                await client.sendImageAsSticker(m.chat, videoBuffer, m, { packname, author });
            } else {
                await client.sendMessage(m.chat, { video: videoBuffer, gifPlayback: true }, { quoted: m });
            }
            
            await m.react('✔️');
        } catch (e) {
            console.error('Error en comando bratv:', e);
            await m.react('✖️');
            return m.reply(`> ❌ Error al generar el sticker Brat animado.\n[Error: *${e.message}*]`);
        }
    }
};
