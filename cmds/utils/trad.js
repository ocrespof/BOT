import translate from '@vitalets/google-translate-api';

export default {
  command: ['trad', 'traducir', 'tr'],
  category: 'utils',
  desc: 'Traduce un texto al idioma especificado.',
  usage: '[idioma] [texto]',
  run: async (client, m, args, usedPrefix, command) => {
    if (args.length < 2) return m.reply(` Formato incorrecto. Debes colocar el idioma y texto.\n*Ejemplo:* ${usedPrefix + command} en Hola mundo`);
    
    const lang = args[0];
    const text = args.slice(1).join(' ').trim();
    
    try {
      m.react('🔤');
      const res = await translate(text, { to: lang });
      await m.reply(`*🌐 TRADUCCIÓN (${lang.toUpperCase()})*\n\n${res.text}`);
      m.react('✅');
    } catch (e) {
      m.react('❌');
      m.reply(` Error en la traducción. Asegúrate de usar un código de idioma válido de 2 letras (ej: en, fr, pt, de).`);
    }
  }
}
