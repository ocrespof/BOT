/**
 * 🛒 Buy — Comprar un artículo de la tienda
 */
import { ITEM_MAP } from './shopData.js';

export default {
  command: ['buy', 'comprar'],
  category: 'economia',
  economy: true,
  desc: 'Compra un artículo de la tienda usando su ID.',
  usage: '.buy <id>',
  cooldown: 3,
  run: async (client, m, args, usedPrefix, command) => {
    const itemId = args[0]?.toLowerCase();
    if (!itemId) return m.reply(`❌ Debes especificar el ID del artículo.\n\n*Ejemplo:* \`${usedPrefix}buy title_star\`\n\nUsa \`${usedPrefix}shop\` para ver la tienda.`);

    const item = ITEM_MAP.get(itemId);
    if (!item) return m.reply(`❌ El artículo \`${itemId}\` no existe. Usa \`${usedPrefix}shop\` para ver los artículos disponibles.`);

    const user = global.db.data.users[m.sender] ||= {};
    
    // Verificar saldo (todo global ahora)
    if (item.currency === 'coins') {
      if ((user.coins || 0) < item.price) return m.reply(`❌ No tienes suficientes monedas.\n\n*Saldo:* ${user.coins || 0} 🪙\n*Precio:* ${item.price} 🪙`);
      user.coins -= item.price;
    } else {
      if ((user.exp || 0) < item.price) return m.reply(`❌ No tienes suficiente XP.\n\n*Saldo:* ${user.exp || 0} ✨\n*Precio:* ${item.price} ✨`);
      user.exp -= item.price;
    }

    // Inventario del usuario
    if (!user.inventory) user.inventory = [];

    // Aplicar efecto según tipo
    switch (item.type) {
      case 'title': {
        if (user.inventory.includes(item.id)) {
          // Devolver dinero
          if (item.currency === 'coins') user.coins += item.price;
          else user.exp += item.price;
          return m.reply(`⚠️ Ya posees el título *${item.name}*. Usa \`${usedPrefix}settitle ${item.id}\` para equiparlo.`);
        }
        user.inventory.push(item.id);
        await m.reply(`✅ ¡Compraste el título *${item.name}*!\n\nUsa \`${usedPrefix}settitle ${item.id}\` para equiparlo en tu perfil.`);
        break;
      }

      case 'booster': {
        user.xpBoost = {
          multiplier: item.multiplier,
          expiresAt: Date.now() + item.duration
        };
        const mins = Math.floor(item.duration / 60000);
        await m.reply(`✅ ¡Activaste *${item.name}*!\n\nTu XP se multiplicará x${item.multiplier} durante los próximos *${mins} minutos*.`);
        break;
      }

      case 'shield': {
        user.shield = { expiresAt: Date.now() + item.duration };
        const hours = Math.floor(item.duration / 3600000);
        await m.reply(`✅ ¡Activaste *${item.name}*!\n\nEstás protegido contra robos por *${hours} horas*.`);
        break;
      }

      case 'extra_daily': {
        user.extraDaily = true;
        await m.reply(`✅ ¡Compraste *${item.name}*!\n\nPuedes reclamar un segundo \`${usedPrefix}daily\` hoy.`);
        break;
      }

      case 'cooldown_skip': {
        user.cooldownSkip = true;
        await m.reply(`✅ ¡Compraste *${item.name}*!\n\nTu próximo comando no tendrá cooldown.`);
        break;
      }

      case 'exchange': {
        if (item.gives.exp) {
          user.exp = (user.exp || 0) + item.gives.exp;
          await m.reply(`✅ ¡Intercambio completado!\n\n*-${item.price} 🪙* → *+${item.gives.exp} ✨ XP*`);
        } else if (item.gives.coins) {
          user.coins = (user.coins || 0) + item.gives.coins;
          await m.reply(`✅ ¡Intercambio completado!\n\n*-${item.price} ✨ XP* → *+${item.gives.coins} 🪙 Coins*`);
        }
        break;
      }

      default:
        await m.reply(`✅ ¡Compraste *${item.name}* con éxito!`);
    }
  }
};
