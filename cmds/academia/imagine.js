import axios from 'axios'

const IMAGE_APIS = [
    // Pollinations es la opción más estable y de mayor calidad gratuita
    (p) => `https://image.pollinations.ai/prompt/${encodeURIComponent(p)}?width=1024&height=1024&nologo=true&enhance=true`,
    (p) => `https://api.siputzx.my.id/api/ai/text2img?prompt=${encodeURIComponent(p)}`,
    (p) => `https://dalle.stacktoy.workers.dev/?apikey=Suhail&prompt=${encodeURIComponent(p)}`
];

export default {
    command: ['imagine', 'dibujar', 'dibuja'],
    category: 'academia',
    desc: 'Genera una imagen usando Inteligencia Artificial.',
    usage: '.imagine <texto>',
    run: async (client, m, args, usedPrefix, command) => {
        const text = args.join(' ').trim();
        if (!text) {
            return m.reply(`《✧》 Escribe lo que deseas que la IA dibuje.\n> Ejemplo: *${usedPrefix + command} un gato astronauta en marte*`);
        }

        await m.react('🕒');
        let imageBuffer = null;

        try {
            for (const apiFn of IMAGE_APIS) {
                try {
                    const url = apiFn(text);
                    const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 30000 });
                    if (res.data && res.data.length > 0) {
                        imageBuffer = res.data;
                        break;
                    }
                } catch (e) {
                    console.log(`Fallo un proveedor de imagen (${apiFn.name || 'desconocido'}), intentando el siguiente...`);
                }
            }

            if (!imageBuffer) {
                throw new Error('Todos los proveedores de generación de imágenes fallaron.');
            }

            await client.sendMessage(
                m.chat, 
                { image: imageBuffer, caption: `🎨 *IMAGINE IA*\n> ❖ Prompt: ${text}` }, 
                { quoted: m }
            );
            await m.react('✔️');

        } catch (err) {
            console.error('[IMAGINE]', err);
            await m.react('❌');
            await m.reply(`> Ha ocurrido un error al generar la imagen.\n> [Error: ${err.message}]`);
        }
    }
}
