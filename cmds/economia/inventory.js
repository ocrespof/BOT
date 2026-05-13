/**
 * 🎒 Inventory — Ver los artículos comprados
 */
import { TITLE_NAMES, ITEM_MAP, RARE_MAP } from './shopData.js';

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
    let hasItems = false;

    // Títulos
    const titles = inventory.filter(id => id.startsWith('title_'));
    if (titles.length > 0) {
      hasItems = true;
      msg += `> 🎖️ *Títulos*\n`;
      for (const t of titles) {
        const equipped = user.title === t ? ' *(equipado)*' : '';
        msg += ` ⊳ ${TITLE_NAMES[t] || t}${equipped}\n`;
      }
    }

    // Consumibles de tienda
    const consumables = inventory.filter(id => ITEM_MAP.has(id) && ITEM_MAP.get(id).type === 'consumable');
    if (consumables.length > 0) {
      hasItems = true;
      msg += `\n> 🧪 *Consumibles*\n`;
      const counts = {};
      for (const c of consumables) counts[c] = (counts[c] || 0) + 1;
      for (const [id, count] of Object.entries(counts)) {
        const item = ITEM_MAP.get(id);
        msg += ` ⊳ ${item.name} x${count}\n`;
      }
    }

    // Items raros (de lootbox)
    const rares = inventory.filter(id => RARE_MAP.has(id));
    if (rares.length > 0) {
      hasItems = true;
      msg += `\n> ✨ *Items Raros*\n`;
      const counts = {};
      for (const r of rares) counts[r] = (counts[r] || 0) + 1;
      for (const [id, count] of Object.entries(counts)) {
        const item = RARE_MAP.get(id);
        const rarityEmoji = item.rarity === 'legendario' ? '🌟' : item.rarity === 'epico' ? '💜' : '🔵';
        msg += ` ⊳ ${rarityEmoji} ${item.name} x${count} _(${item.rarity})_\n`;
      }
    }

    // Boosters activos
    if (user.xpBoost && user.xpBoost.expiresAt > Date.now()) {
      hasItems = true;
      const remaining = Math.ceil((user.xpBoost.expiresAt - Date.now()) / 60000);
      msg += `\n> ⚡ *Booster Activo*\n`;
      msg += ` ⊳ XP x${user.xpBoost.multiplier} — ${remaining} min\n`;
    }

    // Escudo
    if (user.shield && user.shield.expiresAt > Date.now()) {
      hasItems = true;
      const remaining = Math.ceil((user.shield.expiresAt - Date.now()) / 3600000);
      msg += `\n> 🛡️ *Escudo Activo*\n`;
      msg += ` ⊳ Anti-Robo — ${remaining}h\n`;
    }

    // Extras
    const extras = [];
    if (user.extraDaily) extras.push('🎁 Daily Extra');
    if (user.cooldownSkip) extras.push('⏩ Skip Cooldown');
    if (extras.length > 0) {
      hasItems = true;
      msg += `\n> 🔧 *Pendientes*\n`;
      for (const e of extras) msg += ` ⊳ ${e}\n`;
    }

    if (!hasItems) {
      msg += `_Tu inventario está vacío. Usa \`${usedPrefix}shop\` para comprar._`;
    }

    msg += `\n*Usar:* \`${usedPrefix}use <id>\` · *Tradear:* \`${usedPrefix}trade @user <id>\``;

    await client.sendMessage(m.chat, { text: msg }, { quoted: m });
  }
};
