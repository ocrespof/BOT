import yts from 'yt-search';

export default {
  command: ['yts', 'ytsr'],
  category: 'utils',
  desc: 'Busca videos en YouTube.',
  usage: '[búsqueda]',
  run: async (client, m, args, usedPrefix, command) => {
    const query = args.join(' ').trim();
    if (!query) return m.reply(`《✧》 Escribe qué deseas buscar en YouTube.\n*Ejemplo:* ${usedPrefix + command} Música épica`);
    
    try {
      m.react('🔍');
      const results = await yts(query);
      const videos = results.videos.slice(0, 5);
      
      if (!videos.length) return m.reply(`《✧》 No se encontraron videos para: *${query}*`);
      
      let text = `*🔴 RESULTADOS DE BÚSQUEDA YOUTUBE*\n\n`;
      videos.forEach((v, i) => {
        text += `> *${i + 1}.* ${v.title}\n`;
        text += `> 👤 *Canal:* ${v.author.name}\n`;
        text += `> 🕒 *Duración:* ${v.timestamp}\n`;
        text += `> 🔗 *Link:* ${v.url}\n\n`;
      });
      
      await client.sendMessage(m.chat, { text: text.trim() }, { quoted: m });
      m.react('✅');
    } catch (e) {
      m.react('❌');
      m.reply(`《✧》 Error al comunicarse con YouTube Search.`);
    }
  }
}
