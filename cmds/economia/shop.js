/**
 * 🏪 Shop — Tienda del Bot
 * Los usuarios gastan coins/XP para comprar mejoras, títulos, poderes y cosméticos.
 */
import { SHOP_ITEMS } from './shopData.js';

function renderShop(prefix) {
  let menu = `🏪 *SHOP* 🏪\n\n`;
  menu += `> 🎖️ *TÍTULOS*\n`;
  for (const item of SHOP_ITEMS.titles) {
    menu += ` ⊳ \`${item.id}\` — *${item.name}* · ${item.price} 🪙\n     _${item.desc}_\n`;
  }
  menu += `\n> ⚡ *BOOSTERS*\n`;
  for (const item of SHOP_ITEMS.boosters) {
    menu += ` ⊳ \`${item.id}\` — *${item.name}* · ${item.price} 🪙\n     _${item.desc}_\n`;
  }
  menu += `\n> 🛡️ *UTILIDADES*\n`;
  for (const item of SHOP_ITEMS.utilities) {
    menu += ` ⊳ \`${item.id}\` — *${item.name}* · ${item.price} 🪙\n     _${item.desc}_\n`;
  }
  menu += `\n> 🧪 *CONSUMIBLES*\n`;
  for (const item of (SHOP_ITEMS.consumables || [])) {
    menu += ` ⊳ \`${item.id}\` — *${item.name}* · ${item.price} 🪙\n     _${item.desc}_\n`;
  }
  menu += `\n> 📦 *LOOTBOXES*\n`;
  for (const item of (SHOP_ITEMS.lootboxes || [])) {
    menu += ` ⊳ \`${item.id}\` — *${item.name}* · ${item.price} 🪙\n     _${item.desc}_\n`;
  }
  menu += `\n> 💱 *INTERCAMBIO*\n`;
  for (const item of SHOP_ITEMS.exchange) {
    menu += ` ⊳ \`${item.id}\` — *${item.name}* · ${item.price} ${item.currency === 'coins' ? '🪙' : '✨'}\n     _${item.desc}_\n`;
  }
  menu += `\n*Uso:* \`${prefix}buy <id>\`\nEjemplo: \`${prefix}buy caja_misteriosa\``;
  return menu;
}

export default {
  command: ['shop', 'tienda', 'store'],
  category: 'economia',
  economy: true,
  desc: 'Abre la tienda del bot para gastar coins y XP.',
  usage: '.shop | .buy <id> | .inventory',
  cooldown: 3,
  run: async (client, m, args, usedPrefix, command) => {
    const menu = renderShop(usedPrefix);
    await client.sendMessage(m.chat, { text: menu }, { quoted: m });
  }
};
