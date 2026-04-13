import fetch from 'node-fetch';

export default {
  command: ['alegria', 'baile', 'tristeza', 'desesperacion', 'desesperación', 'enojo', 'tranquilidad'],
  category: 'utils',
  run: async (client, m, args, usedPrefix, command) => {
    try {
      m.react('⏳');
      // Limpiamos los tildes por seguridad
      const cmd = command.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

      let term = 'happy';
      let messageText = '';

      switch (cmd) {
        case 'alegria':
          term = 'happy';
          messageText = `¡*${m.pushName || 'El usuario'}* está saltando de alegría! 😄`;
          break;
        case 'baile':
          term = 'dance';
          messageText = `¡*${m.pushName || 'El usuario'}* se puso a bailar sin parar! 💃🕺`;
          break;
        case 'tristeza':
          term = 'sad';
          messageText = `*${m.pushName || 'El usuario'}* se siente triste... 😢`;
          break;
        case 'desesperacion':
          term = 'panic';
          messageText = `¡A *${m.pushName || 'El usuario'}* le dio un ataque de desesperación! 😱`;
          break;
        case 'enojo':
          term = 'angry';
          messageText = `¡*${m.pushName || 'El usuario'}* está furioso/a! 😡`;
          break;
        case 'tranquilidad':
          term = 'calm';
          messageText = `*${m.pushName || 'El usuario'}* respira hondo y encuentra su tranquilidad. 😌`;
          break;
        default:
          term = 'happy';
          messageText = `¡*${m.pushName || 'El usuario'}* se siente genial! 😎`;
          break;
      }

      const searchUrl = `https://tenor.com/search/pinkie-pie-equestria-girls-${term}-gifs`;
      const res = await fetch(searchUrl);
      const html = await res.text();

      const mp4Match = html.match(/https:\/\/media\.tenor\.com\/[^"]*\.mp4/gi);

      if (mp4Match && mp4Match.length > 0) {
        const mp4s = [...new Set(mp4Match)];
        const randomMp4 = mp4s[Math.floor(Math.random() * mp4s.length)];

        await client.sendMessage(m.chat, { video: { url: randomMp4 }, gifPlayback: true, caption: messageText }, { quoted: m });
      } else {
        m.reply('❌ No pude encontrar mi GIF animado...');
      }
    } catch (e) {
      m.reply(`❌ Ocurrió un error al buscar la reacción.`);
      console.log(e);
    }
  }
}
