import PDFDocument from 'pdfkit';
import { Writable } from 'stream';

export default {
    command: ['pdf', 'topdf', 'crearpdf'],
    category: 'academia',
    run: async (client, m, args, usedPrefix, command) => {
        let text = args.join(' ').trim();
        // Si el usuario no escribe texto pero responde a un mensaje, usa ese texto respondido
        if (!text && m.quoted && m.quoted.text) {
             text = m.quoted.text;
        }
        
        if (!text) return m.reply(`《✧》 Escribe un texto amplio o responde a un mensaje largo para empacarlo en formato PDF.\n> Ejemplo: *${usedPrefix + command}* Desarrollo del proyecto celular celular...`);
        
        try {
            await m.react('⏳');
            
            const buffers = [];
            const stream = new Writable({
                write(chunk, encoding, next) {
                    buffers.push(chunk);
                    next();
                }
            });
            
            const doc = new PDFDocument({ margin: 50, size: 'A4' });
            doc.pipe(stream);
            
            doc.font('Helvetica-Bold').fontSize(16).text('Documento Universitario de Lectura', { align: 'center' });
            doc.moveDown();
            
            // Texto general
            doc.font('Helvetica').fontSize(12).text(text, { align: 'justify' });
            
            // Cerrar flujos
            doc.end();
            
            stream.on('finish', async () => {
                const finalBuffer = Buffer.concat(buffers);
                await client.sendMessage(m.chat, { 
                    document: finalBuffer, 
                    mimetype: 'application/pdf', 
                    fileName: `Docs_${Date.now()}.pdf`,
                    caption: '🎓 *Tu documento PDF ha sido maquinado exitosamente en local.*'
                }, { quoted: m });
                await m.react('✔️');
            });
            
        } catch (e) {
            await m.react('✖️');
            m.reply(`> Falla en la inyección e impresión del render PDFKit.\n> [Error: ${e.message}]`);
        }
    }
}
