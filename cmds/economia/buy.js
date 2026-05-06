/**
 * 🛒 Buy — Comprar un artículo de la tienda
 */
import { ITEM_MAP, RARE_ITEMS } from './shopData.js';

function openLootbox(isGolden) {
  const roll = Math.random();
  // Golden chest: 40% rare item, 30% big coins, 30% big XP
  // Mystery box: 15% rare item, 45% coins, 40% XP
  const rareChance = isGolden ? 0.40 : 0.15;
  
  if (roll < rareChance) {
    // Drop a rare item
    const pool = isGolden 
      ? RARE_ITEMS 
      : RARE_ITEMS.filter(i => i.rarity !== 'legendario');
    const item = pool[Math.floor(Math.random() * pool.length)];
    return { type: 'rare_item', item };
  } else if (roll < rareChance + 0.45) {
    const amount = isGolden 
      ? Math.floor(Math.random() * 8000) + 3000 
      : Math.floor(Math.random() * 4000) + 1000;
    return { type: 'coins', amount };
  } else {
    const amount = isGolden 
      ? Math.floor(Math.random() * 5000) + 2000 
      : Math.floor(Math.random() * 3000) + 500;
    return { type: 'xp', amount };
  }
}

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
    
    // Verificar saldo
    if (item.currency === 'coins') {
      if ((user.coins || 0) < item.price) return m.reply(`❌ No tienes suficientes monedas.\n\n*Saldo:* ${user.coins || 0} 🪙\n*Precio:* ${item.price} 🪙`);
      user.coins -= item.price;
    } else {
      if ((user.exp || 0) < item.price) return m.reply(`❌ No tienes suficiente XP.\n\n*Saldo:* ${user.exp || 0} ✨\n*Precio:* ${item.price} ✨`);
      user.exp -= item.price;
    }

    if (!user.inventory) user.inventory = [];

    switch (item.type) {
      case 'title': {
        if (user.inventory.includes(item.id)) {
          if (item.currency === 'coins') user.coins += item.price;
          else user.exp += item.price;
          return m.reply(`⚠️ Ya posees el título *${item.name}*. Usa \`${usedPrefix}settitle ${item.id}\` para equiparlo.`);
        }
        user.inventory.push(item.id);
        await m.reply(`✅ ¡Compraste el título *${item.name}*!\n\nUsa \`${usedPrefix}settitle ${item.id}\` para equiparlo en tu perfil.`);
        break;
      }

      case 'booster': {
        user.xpBoost = { multiplier: item.multiplier, expiresAt: Date.now() + item.duration };
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

      case 'consumable': {
        user.inventory.push(item.id);
        await m.reply(`✅ ¡Compraste *${item.name}*!\n\nÚsalo con \`${usedPrefix}use ${item.id}\``);
        break;
      }

      case 'lootbox': {
        const isGolden = item.id === 'cofre_dorado';
        const result = openLootbox(isGolden);
        let msg = `📦 *¡ABRIENDO ${isGolden ? 'COFRE DORADO' : 'CAJA MISTERIOSA'}!* 📦\n\n`;
        
        if (result.type === 'rare_item') {
          user.inventory.push(result.item.id);
          const rarityEmoji = result.item.rarity === 'legendario' ? '🌟' : result.item.rarity === 'epico' ? '💜' : '🔵';
          msg += `${rarityEmoji} *¡ITEM ${result.item.rarity.toUpperCase()}!*\nObtuviste: *${result.item.name}*\n_${result.item.desc}_\n\nÚsalo con \`${usedPrefix}use ${result.item.id}\` o tradéalo.`;
        } else if (result.type === 'coins') {
          user.coins = (user.coins || 0) + result.amount;
          msg += `🪙 Obtuviste *${result.amount.toLocaleString()} Monedas*`;
        } else {
          user.exp = (user.exp || 0) + result.amount;
          msg += `✨ Obtuviste *${result.amount.toLocaleString()} XP*`;
        }
        await m.reply(msg);
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
