export default {
  command: ['qr', 'qrcode'],
  category: 'utils',
  run: async (client, m, args, usedPrefix, command) => {
    const text = args.join(' ').trim();
    if (!text) return m.reply(`《✧》 Escribe un texto o URL para generar el Código QR.\n*Ejemplo:* ${usedPrefix + command} https://google.com`);
    
    try {
      m.react('📷');
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(text)}`;
      
      await client.sendMessage(m.chat, { image: { url: qrUrl }, caption: `> *Código QR Generado Exitosamente*` }, { quoted: m });
      m.react('✅');
    } catch (e) {
      m.react('❌');
      m.reply(`《✧》 Hubo un error al crear tu Código QR.`);
    }
  }
}
