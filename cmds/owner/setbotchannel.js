import { getBotSettings } from '../../utils/tools.js';

export default {
  command: ['setbotchannel', 'setbotlink', 'setredes'],
  category: 'owner',
  desc: 'Cambiar el enlace del canal (o redes) que aparece en el menú y otros mensajes.',
  isOwner: true,
  run: async (client, m, args, usedPrefix, command) => {
    const link = args.join(' ').trim();
    if (!link) {
      return m.reply(`❌ Proporciona un enlace. Ejemplo: \`${usedPrefix + command} https://whatsapp.com/channel/xxx\``);
    }

    try {
      const botSettings = getBotSettings(client);
      botSettings.link = link;
      
      m.reply(`✅ El enlace del canal/redes se actualizó con éxito a:\n${link}`);
    } catch (e) {
      return m.reply(`❌ Error al actualizar el enlace.\n[Error: *${e.message}*]`);
    }
  },
};
