import fetch from 'node-fetch';

export default {
    command: ['apa', 'bibguru', 'citar'],
    category: 'academia',
    run: async (client, m, args) => {
        const url = args.join(' ').trim();
        if(!/^https?:\/\//i.test(url)) return m.reply('《✧》 Por favor, proporciona el enlace completo (URL) exacto del artículo que deseas citar. Funciona al instante estilo Bibguru.');
        
        try {
            await m.react('⏳');
            let res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }, timeout: 15000 });
            let html = await res.text();
            
            const titleMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i) || html.match(/<title>([^<]+)<\/title>/i);
            const authorMatch = html.match(/<meta\s+name="author"\s+content="([^"]+)"/i) || html.match(/<meta\s+property="article:author"\s+content="([^"]+)"/i);
            const dateMatch = html.match(/<meta\s+property="article:published_time"\s+content="([^"]+)"/i) || html.match(/<time[^>]+(?:datetime)?[='"]+([^'"]+)[='"]+>/i);
            const siteMatch = html.match(/<meta\s+property="og:site_name"\s+content="([^"]+)"/i);
            
            let title = titleMatch ? titleMatch[1].trim() : 'Título del Artículo Desconocido';
            let author = authorMatch ? authorMatch[1].trim() : 'Autor Anónimo / Institucional';
            let dateStr = 's.f.';
            if(dateMatch) {
               let d = new Date(dateMatch[1]);
               if(!isNaN(d.getTime())) {
                   const months = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
                   dateStr = `${d.getFullYear()}, ${d.getDate()} de ${months[d.getMonth()]}`;
               }
            }
            let site = siteMatch ? siteMatch[1].trim() : 'Documento Web';
            
            // Format Author to APA automatically (Apellido, Inicial.)
            let formattedAuthor = author;
            if(!author.includes('/') && !author.includes(',') && author.split(' ').length >= 2 && author.length < 35) {
               let p = author.trim().split(' ');
               let lastName = p.pop();
               let inits = p.map(x => x[0].toUpperCase() + '.').join(' ');
               formattedAuthor = `${lastName}, ${inits}`;
            }
            
            let citation = `${formattedAuthor} (${dateStr}). *${title}*. ${site}. ${url}`;
            
            await m.reply(`🎓 *Generador APA (7ma Edición)*\n\n${citation}`);
            await m.react('✔️');
        } catch (e) {
            await m.react('✖️');
            m.reply('> No se pudo extraer la información automáticamente. Verifica que el enlace no esté protegido ni requiera inicio de sesión.');
        }
    }
}
