/**
 * 🏪 shopData.js — Fuente única de verdad para la tienda del bot.
 * Todos los archivos de economía importan de aquí.
 */

export const SHOP_ITEMS = {
  // ── Títulos Exclusivos (Cosméticos) ──
  titles: [
    { id: 'title_legend', name: '🏆 Leyenda', desc: 'Título exclusivo para tu perfil.', price: 5000, currency: 'coins', type: 'title', value: '🏆 Leyenda' },
    { id: 'title_shadow', name: '🌑 Sombra', desc: 'Título misterioso y oscuro.', price: 3000, currency: 'coins', type: 'title', value: '🌑 Sombra' },
    { id: 'title_star', name: '⭐ Estrella', desc: 'Brilla como una estrella.', price: 2000, currency: 'coins', type: 'title', value: '⭐ Estrella' },
    { id: 'title_neko', name: '🐱 Neko', desc: 'Título kawaii para fans de anime.', price: 1500, currency: 'coins', type: 'title', value: '🐱 Neko' },
    { id: 'title_fire', name: '🔥 Infernal', desc: 'Título ardiente y poderoso.', price: 4000, currency: 'coins', type: 'title', value: '🔥 Infernal' },
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
};
