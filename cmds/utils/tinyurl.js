import { httpGet, httpPost, httpAxios as axios } from '../../utils/http.js';

export default {
  command: ['tiny', 'shorturl', 'acortar'],
  category: 'utils',
  desc: 'Acorta un enlace usando TinyURL.',
  usage: '[enlace]',
  run: async (client, m, args, usedPrefix, command) => {
    const link = args[0];
    if (!link || !link.startsWith('http')) return m.reply(` Proporciona un enlace válido con http o https.\n*Ejemplo:* ${usedPrefix + command} https://ejemplo.com/enlace/muy/largo/abcd`);
    
    try {
      const res = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(link)}`);
      const short = await res.text();
      
      if (short === 'Error') throw new Error('Error API');
      m.reply(`🔗 *Enlace Acortado*\n\nOriginal: ${link}\n*Acortado:* ${short}`);
    } catch (e) {
      m.reply(` Error al acortar el enlace. Revise si es válido.`);
    }
  }
}
