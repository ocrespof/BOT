export default {
  command: ['tts', 'audio', 'decir'],
  category: 'utils',
  run: async (client, m, args, usedPrefix, command) => {
    const text = args.join(' ').trim();
    if (!text) return m.reply(`《✧》 Ingresa un texto para convertirlo a nota de voz.\n*Ejemplo:* ${usedPrefix + command} Hola espero que todos estén bien`);
    
    try {
      m.react('🎤');
      let lang = 'es';
      let msgToSpeak = text;
      
      if (args[0].length === 2 && args.length > 1) {
          lang = args[0];
          msgToSpeak = args.slice(1).join(' ').trim();
      }
      
      const ttsUrl = `http://translate.google.com/translate_tts?ie=UTF-8&total=1&idx=0&textlen=32&client=tw-ob&q=${encodeURIComponent(msgToSpeak)}&tl=${lang}`;
      
      await client.sendMessage(m.chat, { audio: { url: ttsUrl }, mimetype: 'audio/mp4', ptt: true }, { quoted: m });
      m.react('✅');
    } catch (e) {
      m.react('❌');
      m.reply(`《✧》 Error al generar el audio.`);
    }
  }
}
