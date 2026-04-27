import { httpGet, httpPost, httpAxios as axios } from '../../utils/http.js';
import FormData from 'form-data';

export default {
    command: ['ocr', 'texto', 'escaner'],
    category: 'academia',
    run: async (client, m) => {
        let q = m.quoted ? m.quoted : m;
        let mime = (q.msg || q).mimetype || '';
        if (!mime.startsWith('image/')) return m.reply('《✧》 Por favor, responde a una imagen con texto visible que desees extraer.');
        
        try {
            await m.react('⏳');
            const buffer = await q.download();
            if (!buffer) return m.reply('《✧》 No se pudo encontrar y descargar la imagen.');
            
            const form = new FormData();
            form.append('apikey', 'helloworld'); // Generico Libre OCR-Space
            form.append('file', buffer, { filename: 'imagen.jpg', contentType: 'image/jpeg' });
            form.append('language', 'spa'); // Español Primario
            form.append('isOverlayRequired', 'false');
            
            let res = await fetch('https://api.ocr.space/parse/image', {
                method: 'POST',
                body: form,
                timeout: 30000 
            });
            let data = await res.json();
            
            if (data.IsErroredOnProcessing || !data.ParsedResults || !data.ParsedResults[0]) {
                await m.react('✖️');
                return m.reply('> No se detectó topografía legible o el escaner gratuito colapsó temporalmente por saturación de tráfico.');
            }
            
            const text = data.ParsedResults[0].ParsedText || '';
            if (text.trim() === '') {
                await m.react('✖️');
                return m.reply('> La imagen fue procesada a fondo, pero sus caracteres no lograron conformar palabras inteligibles.');
            }
            
            await m.reply(`🔎 *Texto Extraído (OCR Scanner):*\n──────────────────\n${text.trim()}`);
            await m.react('✔️');
        } catch (e) {
            await m.react('✖️');
            m.reply(`> Ocurrió un fallo en el procesador óptico y la conexión.\n> [Error: ${e.message}]`);
        }
    }
}
