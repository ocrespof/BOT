/**
 * 🏪 YukiShop — Tienda del Bot
 * Los usuarios gastan coins/XP para comprar mejoras, títulos, poderes y cosméticos.
 */
import { SHOP_ITEMS } from './shopData.js';

function renderShop(prefix) {
  let menu = `🏪 *Y U K I   S H O P* 🏪\n\n`;
  menu += `> 🎖️ *T Í T U L O S*\n`;
  for (const item of SHOP_ITEMS.titles) {
    menu += ` ⊳ \`${item.id}\` — *${item.name}* · ${item.price} ${item.currency === 'coins' ? '🪙' : '✨'}\n     _${item.desc}_\n`;
  }
  menu += `\n> ⚡ *B O O S T E R S*\n`;
  for (const item of SHOP_ITEMS.boosters) {
    menu += ` ⊳ \`${item.id}\` — *${item.name}* · ${item.price} ${item.currency === 'coins' ? '🪙' : '✨'}\n     _${item.desc}_\n`;
  }
  menu += `\n> 🛡️ *U T I L I D A D E S*\n`;
  for (const item of SHOP_ITEMS.utilities) {
    menu += ` ⊳ \`${item.id}\` — *${item.name}* · ${item.price} ${item.currency === 'coins' ? '🪙' : '✨'}\n     _${item.desc}_\n`;
  }
  menu += `\n> 💱 *I N T E R C A M B I O*\n`;
  for (const item of SHOP_ITEMS.exchange) {
    menu += ` ⊳ \`${item.id}\` — *${item.name}* · ${item.price} ${item.currency === 'coins' ? '🪙' : '✨'}\n     _${item.desc}_\n`;
  }
  menu += `\n*Uso:* \`${prefix}buy <id>\`\nEjemplo: \`${prefix}buy title_star\``;
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
