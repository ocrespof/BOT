import { formatAPA } from '../../utils/apaHelper.js';

export default {
  command: ['apa', 'bibguru', 'citar'],
  category: 'academia',
  desc: 'Genera una cita APA 7ma edición de un enlace.',
  usage: '[url]',
  run: async (client, m, args, usedPrefix, command) => {
    const url = args.join(' ').trim();
    if (!url) {
      return m.reply(`《✧》 Por favor, proporciona el enlace completo (URL) del artículo que deseas citar.`);
    }
    if (!/^https?:\/\/\S+$/i.test(url)) {
      return m.reply('《✧》 La URL proporcionada no parece válida. Asegúrate de incluir http/https.');
    }
    try {
      await m.react('⏳');
      const citation = await formatAPA(url, client, m);
      await m.reply(`┌───「 🎓 *CITA APA (7ma)* 🎓 」───┐\n│\n│ ❖ ${citation}\n│\n└───────────────────────────┘`);
      await m.react('✔️');
    } catch (e) {
      await m.react('✖️');
      m.reply(`> ⚠️ Error al generar la cita: ${e.message}`);
    }
  },
};
