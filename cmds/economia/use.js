/**
 * 🧪 Use — Consumir un item del inventario
 */
import { ITEM_MAP, RARE_MAP } from './shopData.js';

export default {
  command: ['use', 'usar'],
  category: 'economia',
  economy: true,
  desc: 'Usa un consumible o item de tu inventario.',
  usage: '.use <item_id>',
  cooldown: 5,
  run: async (client, m, args, usedPrefix, command) => {
    const itemId = args[0]?.toLowerCase();
    if (!itemId) return m.reply(`❌ Especifica el item a usar.\n\n*Ejemplo:* \`${usedPrefix}use pocion_vida\`\n\nVe tu inventario con \`${usedPrefix}inv\``);

    const user = global.db.data.users[m.sender] ||= {};
    if (!user.inventory) user.inventory = [];

    const idx = user.inventory.indexOf(itemId);
    if (idx === -1) return m.reply(`❌ No tienes \`${itemId}\` en tu inventario.\n\nUsa \`${usedPrefix}inv\` para ver tus items.`);

    // Check if it's a shop consumable
    const shopItem = ITEM_MAP.get(itemId);
    // Check if it's a rare item
    const rareItem = RARE_MAP.get(itemId);

    if (shopItem && shopItem.type === 'consumable') {
      user.inventory.splice(idx, 1); // Remove from inventory
      
      switch (shopItem.effect) {
        case 'heal': {
          user.health = Math.min((user.health || 100) + shopItem.value, 100);
          return m.reply(`❤️ ¡Usaste *${shopItem.name}*!\n\nRecuperaste *${shopItem.value} HP*. Salud actual: *${user.health}/100*`);
        }
        case 'luck': {
          user.luckBuff = { expiresAt: Date.now() + shopItem.duration, value: shopItem.value };
          const mins = Math.floor(shopItem.duration / 60000);
          return m.reply(`🍀 ¡Usaste *${shopItem.name}*!\n\n+${shopItem.value * 100}% probabilidad de éxito por *${mins} minutos*.`);
        }
        case 'megafono': {
          const texto = args.slice(1).join(' ');
          if (!texto) {
            user.inventory.push(itemId); // Devolver si no puso texto
            return m.reply(`📢 Debes escribir un mensaje.\n\n*Ejemplo:* \`${usedPrefix}use megafono Hola a todos!\``);
          }
          return client.sendMessage(m.chat, { text: `📢 *ANUNCIO DE @${m.sender.split('@')[0]}*\n\n${texto}`, mentions: [m.sender] });
        }
        default:
          return m.reply(`✅ Usaste *${shopItem.name}*.`);
      }
    }

    if (rareItem) {
      user.inventory.splice(idx, 1);
      
      switch (rareItem.id) {
        case 'cristal_exp': {
          const xpGained = Math.floor(Math.random() * 4000) + 1000;
          user.exp = (user.exp || 0) + xpGained;
          return m.reply(`💎 ¡Usaste *${rareItem.name}*!\n\nObtuviste *${xpGained.toLocaleString()} XP*`);
        }
        case 'pergamino_sabio': {
          user.triviaBuff = { expiresAt: Date.now() + 7200000, value: 0.50 };
          return m.reply(`📜 ¡Usaste *${rareItem.name}*!\n\n+50% XP en trivia por *2 horas*.`);
        }
        case 'pluma_fenix': {
          user.fenixRevive = true;
          return m.reply(`🪶 ¡Usaste *${rareItem.name}*!\n\nSi mueres en la mazmorra, revivirás con 100 HP.`);
        }
        case 'gema_dragon': {
          user.dungeonBuff = { expiresAt: Date.now() + 7200000, value: 0.30 };
          return m.reply(`🐉 ¡Usaste *${rareItem.name}*!\n\n+30% daño en mazmorra por *2 horas*.`);
        }
        case 'anillo_fortuna': {
          user.fortuneBuff = { expiresAt: Date.now() + 3600000, value: 0.10 };
          return m.reply(`💍 ¡Usaste *${rareItem.name}*!\n\n+10% en todas las recompensas por *1 hora*.`);
        }
        case 'moneda_antigua': {
          const value = Math.floor(Math.random() * 10000) + 5000;
          user.coins = (user.coins || 0) + value;
          return m.reply(`🪙 ¡Vendiste la *${rareItem.name}* por *${value.toLocaleString()} Monedas*!`);
        }
        default:
          return m.reply(`✅ Usaste *${rareItem.name}*.`);
      }
    }

    return m.reply(`❌ El item \`${itemId}\` no es consumible.`);
  }
};
