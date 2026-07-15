/**
 * 🏪 rpg_shop.js — Tienda del Bot, consumibles, inventario y gestión de títulos.
 * Reúne: inventory, shop, shopData, buy, use, heal, settitle
 */
import { getBotCurrency } from '../../utils/tools.js';
import { resolveLidToRealJid } from '../../core/utils.js';

// ── DATOS DE LA TIENDA Y ARTÍCULOS ──

export const SHOP_ITEMS = {
  // ── Títulos con Habilidades Pasivas (Buffs) ──
  titles: [
    { id: 'title_legend', name: '🏆 Leyenda', desc: '+15% de Monedas en .work', price: 5000, currency: 'coins', type: 'title', value: '🏆 Leyenda', buffDesc: '+15% Monedas en Trabajo' },
    { id: 'title_shadow', name: '🌑 Sombra', desc: 'Inmunidad total a ser robado (.steal)', price: 8000, currency: 'coins', type: 'title', value: '🌑 Sombra', buffDesc: 'Inmunidad al Robo' },
    { id: 'title_star', name: '⭐ Estrella', desc: '+15% XP en Juegos interactivos', price: 4000, currency: 'coins', type: 'title', value: '⭐ Estrella', buffDesc: '+15% XP en Juegos' },
    { id: 'title_neko', name: '🐱 Neko', desc: '+10 Salud recuperada al pescar', price: 3500, currency: 'coins', type: 'title', value: '🐱 Neko', buffDesc: '+10 Salud al Pescar' },
    { id: 'title_fire', name: '🔥 Infernal', desc: '+20% de recompensa en .dungeon', price: 6000, currency: 'coins', type: 'title', value: '🔥 Infernal', buffDesc: '+20% Monedas en Mazmorra' },
    { id: 'title_lucky', name: '🍀 Suertudo', desc: '+15% prob. de éxito en .crime', price: 4500, currency: 'coins', type: 'title', value: '🍀 Suertudo', buffDesc: '+15% Éxito en Crimen' },
    { id: 'title_fisher', name: '🎣 Pescador', desc: '+20% de Monedas en .fish', price: 3000, currency: 'coins', type: 'title', value: '🎣 Pescador', buffDesc: '+20% Monedas en Pesca' },
    { id: 'title_miner', name: '⛏️ Minero', desc: '+20% de Monedas en .mine', price: 3500, currency: 'coins', type: 'title', value: '⛏️ Minero', buffDesc: '+20% Monedas en Minería' },
    { id: 'title_tycoon', name: '💰 Magnate', desc: '+20% Monedas en reclamos fijos (daily, etc.)', price: 10000, currency: 'coins', type: 'title', value: '💰 Magnate', buffDesc: '+20% Monedas en Cobros' },
  ],

  // ── Boosters de XP ──
  boosters: [
    { id: 'xp_boost_2x', name: '⚡ XP Boost x2', desc: 'Duplica tu XP por 1 hora.', price: 2500, currency: 'coins', type: 'booster', duration: 3600000, multiplier: 2 },
    { id: 'xp_boost_3x', name: '💥 XP Boost x3', desc: 'Triplica tu XP por 30 min.', price: 5000, currency: 'coins', type: 'booster', duration: 1800000, multiplier: 3 },
  ],

  // ── Protección y Utilidades ──
  utilities: [
    { id: 'shield', name: '🛡️ Escudo Anti-Robo', desc: 'Te protege de .steal por 24h.', price: 3000, currency: 'coins', type: 'shield', duration: 86400000 },
    { id: 'extra_daily', name: '🎁 Daily Extra', desc: 'Reclama un segundo .daily hoy.', price: 1000, currency: 'coins', type: 'extra_daily' },
    { id: 'cooldown_skip', name: '⏩ Skip Cooldown', desc: 'Elimina el cooldown de tu próximo comando.', price: 500, currency: 'coins', type: 'cooldown_skip' },
  ],

  // ── Consumibles ──
  consumables: [
    { id: 'pocion_vida', name: '❤️‍🩹 Poción de Vida', desc: 'Restaura 50 puntos de salud.', price: 800, currency: 'coins', type: 'consumable', effect: 'heal', value: 50 },
    { id: 'pocion_suerte', name: '🍀 Poción de Suerte', desc: '+25% prob. de éxito en crimen y robo por 1h.', price: 1500, currency: 'coins', type: 'consumable', effect: 'luck', duration: 3600000, value: 0.25 },
    { id: 'megafono', name: '📢 Megáfono', desc: 'Envía un anuncio destacado al grupo.', price: 500, currency: 'coins', type: 'consumable', effect: 'megafono' },
  ],

  // ── Lootboxes ──
  lootboxes: [
    { id: 'caja_misteriosa', name: '📦 Caja Misteriosa', desc: 'Contiene un premio aleatorio (coins, XP o item raro).', price: 2000, currency: 'coins', type: 'lootbox' },
    { id: 'cofre_dorado', name: '🏆 Cofre Dorado', desc: 'Mayor probabilidad de items raros y legendarios.', price: 5000, currency: 'coins', type: 'lootbox' },
  ],

  // ── Conversión de Moneda ──
  exchange: [
    { id: 'coins_to_exp', name: '💱 1000 Coins → 500 XP', desc: 'Convierte tus monedas a experiencia.', price: 1000, currency: 'coins', type: 'exchange', gives: { exp: 500 } },
    { id: 'exp_to_coins', name: '💱 1000 XP → 500 Coins', desc: 'Convierte tu experiencia a monedas.', price: 1000, currency: 'exp', type: 'exchange', gives: { coins: 500 } },
  ],
};

// Items raros que SOLO se obtienen de lootboxes (no se compran en tienda, sí se tradean)
export const RARE_ITEMS = [
  { id: 'gema_dragon', name: '🐉 Gema del Dragón', desc: '+30% daño en .dungeon', rarity: 'legendario' },
  { id: 'anillo_fortuna', name: '💍 Anillo de la Fortuna', desc: '+10% en todas las recompensas', rarity: 'epico' },
  { id: 'pluma_fenix', name: '🪶 Pluma de Fénix', desc: 'Revive con 100 HP si mueres en mazmorra', rarity: 'legendario' },
  { id: 'moneda_antigua', name: '🪙 Moneda Antigua', desc: 'Objeto coleccionable raro. Vale mucho en tradeos.', rarity: 'raro' },
  { id: 'cristal_exp', name: '💎 Cristal de XP', desc: 'Al usarlo da entre 1000-5000 XP al azar.', rarity: 'epico' },
  { id: 'pergamino_sabio', name: '📜 Pergamino del Sabio', desc: '+50% XP en trivia por 2h', rarity: 'raro' },
];

export const ALL_ITEMS = [...SHOP_ITEMS.titles, ...SHOP_ITEMS.boosters, ...SHOP_ITEMS.utilities, ...(SHOP_ITEMS.consumables || []), ...(SHOP_ITEMS.lootboxes || []), ...SHOP_ITEMS.exchange];
export const ITEM_MAP = new Map(ALL_ITEMS.map(item => [item.id, item]));
export const RARE_MAP = new Map(RARE_ITEMS.map(item => [item.id, item]));

export const TITLE_NAMES = {
  title_legend: '🏆 Leyenda',
  title_shadow: '🌑 Sombra',
  title_star: '⭐ Estrella',
  title_neko: '🐱 Neko',
  title_fire: '🔥 Infernal',
  title_lucky: '🍀 Suertudo',
  title_fisher: '🎣 Pescador',
  title_miner: '⛏️ Minero',
  title_tycoon: '💰 Magnate',
};

// Helper para abrir lootbox
function openLootbox(isGolden) {
  const roll = Math.random();
  const rareChance = isGolden ? 0.40 : 0.15;
  
  if (roll < rareChance) {
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

// ── COMANDOS DE LA TIENDA ──

const cmdShop = {
  command: ['shop', 'tienda', 'store'],
  category: 'economia', economy: true, desc: 'Abre la tienda del bot para gastar coins y XP.',
  usage: '.shop | .buy <id> | .inventory', cooldown: 3,
  run: async (client, m, args, usedPrefix) => {
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
    for (const item of SHOP_ITEMS.consumables) {
      menu += ` ⊳ \`${item.id}\` — *${item.name}* · ${item.price} 🪙\n     _${item.desc}_\n`;
    }
    menu += `\n> 📦 *LOOTBOXES*\n`;
    for (const item of SHOP_ITEMS.lootboxes) {
      menu += ` ⊳ \`${item.id}\` — *${item.name}* · ${item.price} 🪙\n     _${item.desc}_\n`;
    }
    menu += `\n> 💱 *INTERCAMBIO*\n`;
    for (const item of SHOP_ITEMS.exchange) {
      menu += ` ⊳ \`${item.id}\` — *${item.name}* · ${item.price} ${item.currency === 'coins' ? '🪙' : '✨'}\n     _${item.desc}_\n`;
    }
    menu += `\n*Uso:* \`${usedPrefix}buy <id>\`\nEjemplo: \`${usedPrefix}buy caja_misteriosa\``;
    await client.sendMessage(m.chat, { text: menu }, { quoted: m });
  }
};

const cmdInventory = {
  command: ['inventory', 'inv', 'inventario', 'mochila'],
  category: 'economia', economy: true, desc: 'Muestra tu inventario de artículos comprados.', cooldown: 3,
  run: async (client, m, args, usedPrefix) => {
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

const cmdBuy = {
  command: ['buy', 'comprar'],
  category: 'economia', economy: true, desc: 'Compra un artículo de la tienda usando su ID.',
  usage: '.buy <id>', cooldown: 3,
  run: async (client, m, args, usedPrefix) => {
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

const cmdUse = {
  command: ['use', 'usar'],
  category: 'economia', economy: true, desc: 'Usa un consumible o item de tu inventario.',
  usage: '.use <item_id>', cooldown: 5,
  run: async (client, m, args, usedPrefix) => {
    const itemId = args[0]?.toLowerCase();
    if (!itemId) return m.reply(`❌ Especifica el item a usar.\n\n*Ejemplo:* \`${usedPrefix}use pocion_vida\`\n\nVe tu inventario con \`${usedPrefix}inv\``);

    const user = global.db.data.users[m.sender] ||= {};
    if (!user.inventory) user.inventory = [];

    const idx = user.inventory.indexOf(itemId);
    if (idx === -1) return m.reply(`❌ No tienes \`${itemId}\` en tu inventario.\n\nUsa \`${usedPrefix}inv\` para ver tus items.`);

    const shopItem = ITEM_MAP.get(itemId);
    const rareItem = RARE_MAP.get(itemId);

    if (shopItem && shopItem.type === 'consumable') {
      user.inventory.splice(idx, 1);
      
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
            user.inventory.push(itemId);
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

const cmdHeal = {
  command: ['heal', 'curar'],
  category: 'economia', economy: true, desc: 'Curarte con pociones.',
  run: async (client, m, args, usedPrefix) => {
    const currency = getBotCurrency(client);
    const db = global.db.data;
    const mentioned = m.mentionedJid || [];
    const who2 = mentioned[0] || (m.quoted ? m.quoted.sender : null);
    const who = await resolveLidToRealJid(who2, client, m.chat);
    const healer = db.users[m.sender];
    const target = who ? db.users[who] : healer;
    if (!target) return m.reply(`El usuario no se encuentra en la base de Datos.`);
    if ((target.health || 100) >= 100) {
      const maximo = who ? `La salud de *${target.name || who.split('@')[0]}* ya está al máximo, Salud actual: ${target.health || 100}` : `Tu salud ya está al máximo, Salud actual: ${target.health || 100}`;
      return m.reply(maximo);
    }
    const faltante = 100 - (target.health || 0);
    const bloques = Math.ceil(faltante / 10);
    const costo = bloques * 500;
    const totalFondos = (healer.coins || 0) + (healer.bank || 0);
    if (totalFondos < costo) {
      const fondos = who ? `No tienes suficientes ${currency} para curar a *${target.name || who.split('@')[0]}*.\nNecesitas *¥${costo.toLocaleString()} ${currency}* para curar ${faltante} puntos de salud.` : `No tienes suficientes ${currency} para curarte.\nNecesitas *¥${costo.toLocaleString()} ${currency}* para curar ${faltante} puntos de salud.`;
      return m.reply(fondos);
    }
    if ((healer.coins || 0) >= costo) {
      healer.coins -= costo;
    } else {
      const restante = costo - (healer.coins || 0);
      healer.coins = 0;
      healer.bank = Math.max(0, (healer.bank || 0) - restante);
    }
    target.health = 100;
    const info = who ? `Has curado a *${target.name || who.split('@')[0]}* hasta el máximo nivel de salud.` : `Te has curado hasta el máximo nivel de salud.`;
    m.reply(info);
  }
};

const cmdSetTitle = {
  command: ['settitle', 'titulo'],
  category: 'economia', economy: true, desc: 'Equipa un título que hayas comprado en la tienda.',
  usage: '.settitle <id>', cooldown: 3,
  run: async (client, m, args, usedPrefix) => {
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

export default [cmdShop, cmdInventory, cmdBuy, cmdUse, cmdHeal, cmdSetTitle];
