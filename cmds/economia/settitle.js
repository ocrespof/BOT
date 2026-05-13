/**
 * 🎖️ Set Title — Equipar un título comprado en la tienda
 */
import { TITLE_NAMES } from './shopData.js';

export default {
  command: ['settitle', 'titulo'],
  category: 'economia',
  economy: true,
  desc: 'Equipa un título que hayas comprado en la tienda.',
  usage: '.settitle <id>',
  cooldown: 3,
  run: async (client, m, args, usedPrefix, command) => {
    const user = global.db.data.users[m.sender] ||= {};
    const inventory = user.inventory || [];

    if (!args[0]) {
      if (user.title) {
        return m.reply(`🎖️ Tu título actual es: *${TITLE_NAMES[user.title] || user.title}*\n\nUsa \`${usedPrefix}settitle <id>\` para cambiarlo o \`${usedPrefix}settitle off\` para quitarlo.`);
      }
      return m.reply(`❌ Debes especificar el ID del título.\n\n*Ejemplo:* \`${usedPrefix}settitle title_star\`\n\nUsa \`${usedPrefix}inventory\` para ver tus títulos.`);
    }

    const titleId = args[0].toLowerCase();

    if (titleId === 'off' || titleId === 'none') {
      user.title = null;
      return m.reply(`✅ Has removido tu título.`);
    }

    if (!inventory.includes(titleId)) {
      return m.reply(`❌ No posees el título \`${titleId}\`.\n\nUsa \`${usedPrefix}shop\` para comprarlo o \`${usedPrefix}inventory\` para ver los que tienes.`);
    }

    user.title = titleId;
    await m.reply(`✅ ¡Título equipado!\n\nAhora te llamas: *${TITLE_NAMES[titleId] || titleId}*`);
  }
};
