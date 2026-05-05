/**
 * 🏪 shopData.js — Fuente única de verdad para la tienda del bot.
 * Todos los archivos de economía importan de aquí.
 */

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

  // ── Conversión de Moneda ──
  exchange: [
    { id: 'coins_to_exp', name: '💱 1000 Coins → 500 XP', desc: 'Convierte tus monedas a experiencia.', price: 1000, currency: 'coins', type: 'exchange', gives: { exp: 500 } },
    { id: 'exp_to_coins', name: '💱 1000 XP → 500 Coins', desc: 'Convierte tu experiencia a monedas.', price: 1000, currency: 'exp', type: 'exchange', gives: { coins: 500 } },
  ],
};

export const ALL_ITEMS = [...SHOP_ITEMS.titles, ...SHOP_ITEMS.boosters, ...SHOP_ITEMS.utilities, ...SHOP_ITEMS.exchange];
export const ITEM_MAP = new Map(ALL_ITEMS.map(item => [item.id, item]));

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
