/**
 * 🎒 Inventory — Ver los artículos comprados
 */
import { TITLE_NAMES } from './shopData.js';

export default {
  command: ['inventory', 'inv', 'inventario', 'mochila'],
  category: 'economia',
  economy: true,
  desc: 'Muestra tu inventario de artículos comprados.',
  cooldown: 3,
  run: async (client, m, args, usedPrefix, command) => {
    const user = global.db.data.users[m.sender] ||= {};
    const inventory = user.inventory || [];

    let msg = `🎒 *I N V E N T A R I O* 🎒\n\n`;

    // Títulos
    const titles = inventory.filter(id => id.startsWith('title_'));
    if (titles.length > 0) {
      msg += `> 🎖️ *Títulos*\n`;
      for (const t of titles) {
        const equipped = user.title === t ? ' *(equipado)*' : '';
        msg += ` ⊳ ${TITLE_NAMES[t] || t}${equipped}\n`;
      }
    }

    // Boosters activos
    if (user.xpBoost && user.xpBoost.expiresAt > Date.now()) {
      const remaining = Math.ceil((user.xpBoost.expiresAt - Date.now()) / 60000);
      msg += `\n> ⚡ *Booster Activo*\n`;
      msg += ` ⊳ XP x${user.xpBoost.multiplier} — ${remaining} min restantes\n`;
    }

    // Escudo
    if (user.shield && user.shield.expiresAt > Date.now()) {
      const remaining = Math.ceil((user.shield.expiresAt - Date.now()) / 3600000);
      msg += `\n> 🛡️ *Escudo Activo*\n`;
      msg += ` ⊳ Anti-Robo — ${remaining}h restantes\n`;
    }

    // Extras
    const extras = [];
    if (user.extraDaily) extras.push('🎁 Daily Extra');
    if (user.cooldownSkip) extras.push('⏩ Skip Cooldown');
    if (extras.length > 0) {
      msg += `\n> 🔧 *Consumibles*\n`;
      for (const e of extras) msg += ` ⊳ ${e}\n`;
    }

    if (titles.length === 0 && !user.xpBoost && !user.shield && extras.length === 0) {
      msg += `_Tu inventario está vacío. Usa \`${usedPrefix}shop\` para comprar artículos._`;
    }

    msg += `\n*Equipar título:* \`${usedPrefix}settitle <id>\``;

    await client.sendMessage(m.chat, { text: msg }, { quoted: m });
  }
};
