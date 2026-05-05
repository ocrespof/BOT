/**
 * 🏅 achievements.js — Sistema de Logros del Bot.
 * Muestra logros desbloqueados y progreso hacia el siguiente.
 */
import { gameEngine } from '../../utils/gameEngine.js';
import { getBotCurrency } from '../../utils/tools.js';

export const ACHIEVEMENTS = [
  // Juegos
  { id: 'first_win', name: '🎲 Primera Victoria', desc: 'Gana tu primer juego.', condition: 'gameWins >= 1', reward: { xp: 200 } },
  { id: 'ten_wins', name: '🎯 Jugador Dedicado', desc: 'Gana 10 juegos.', condition: 'gameWins >= 10', reward: { xp: 1000 } },
  { id: 'fifty_wins', name: '⚔️ Gladiador', desc: 'Gana 50 juegos.', condition: 'gameWins >= 50', reward: { xp: 5000, coins: 10000 } },
  { id: 'hundred_wins', name: '🏆 Leyenda del Juego', desc: 'Gana 100 juegos.', condition: 'gameWins >= 100', reward: { xp: 15000, coins: 50000 } },

  // Economía
  { id: 'millionaire', name: '💰 Millonario', desc: 'Acumula 1M de coins (cartera + banco).', condition: 'totalCoins >= 1000000', reward: { xp: 10000 } },
  { id: 'first_deposit', name: '🏦 Primer Depósito', desc: 'Deposita coins por primera vez.', condition: 'bank >= 1', reward: { xp: 100 } },

  // XP y Nivel
  { id: 'xp_master', name: '✨ Maestro del XP', desc: 'Acumula 50,000 XP.', condition: 'exp >= 50000', reward: { coins: 5000 } },
  { id: 'level_10', name: '📈 Nivel 10', desc: 'Alcanza el nivel 10.', condition: 'level >= 10', reward: { xp: 2000, coins: 3000 } },
  { id: 'level_25', name: '🌟 Nivel 25', desc: 'Alcanza el nivel 25.', condition: 'level >= 25', reward: { xp: 5000, coins: 10000 } },
  { id: 'level_50', name: '💎 Nivel 50', desc: 'Alcanza el nivel 50.', condition: 'level >= 50', reward: { xp: 15000, coins: 25000 } },

  // Actividad
  { id: 'veteran', name: '🎖️ Veterano', desc: 'Ejecuta 500 comandos.', condition: 'usedcommands >= 500', reward: { xp: 3000 } },
  { id: 'commander', name: '⭐ Comandante', desc: 'Ejecuta 2000 comandos.', condition: 'usedcommands >= 2000', reward: { xp: 8000, coins: 15000 } },

  // Streaks
  { id: 'streak_7', name: '🔥 Racha Semanal', desc: 'Mantén una racha diaria de 7 días.', condition: 'streak >= 7', reward: { xp: 1500, coins: 5000 } },
  { id: 'streak_30', name: '🌋 Racha Mensual', desc: 'Mantén una racha diaria de 30 días.', condition: 'streak >= 30', reward: { xp: 10000, coins: 30000 } },
];

const ACHIEVEMENT_MAP = new Map(ACHIEVEMENTS.map(a => [a.id, a]));

/**
 * Verifica los logros de un usuario y otorga recompensas por los nuevos.
 * @returns {Array} Los logros recién desbloqueados
 */
export function checkAchievements(sender) {
  const user = global.db.data.users[sender];
  if (!user) return [];
  if (!user.achievements) user.achievements = [];

  const totalCoins = (user.coins || 0) + (user.bank || 0);
  const ctx = {
    gameWins: user.gameWins || 0,
    gameLosses: user.gameLosses || 0,
    totalCoins,
    bank: user.bank || 0,
    exp: user.exp || 0,
    level: user.level || 0,
    usedcommands: user.usedcommands || 0,
    streak: user.streak || 0,
  };

  const newlyUnlocked = [];

  for (const achievement of ACHIEVEMENTS) {
    if (user.achievements.includes(achievement.id)) continue;

    // Evaluar condición de forma segura
    let passed = false;
    try {
      const fn = new Function(...Object.keys(ctx), `return ${achievement.condition}`);
      passed = fn(...Object.values(ctx));
    } catch { continue; }

    if (passed) {
      user.achievements.push(achievement.id);
      // Otorgar recompensa
      if (achievement.reward) {
        if (achievement.reward.xp) user.exp = (user.exp || 0) + achievement.reward.xp;
        if (achievement.reward.coins) user.coins = (user.coins || 0) + achievement.reward.coins;
      }
      newlyUnlocked.push(achievement);
    }
  }

  return newlyUnlocked;
}

export default {
  command: ['achievements', 'logros', 'badges'],
  category: 'economia',
  economy: true,
  desc: 'Muestra tus logros y progreso.',
  cooldown: 5,
  run: async (client, m, args, usedPrefix, command) => {
    const user = global.db.data.users[m.sender];
    const currency = getBotCurrency(client);
    const unlocked = user.achievements || [];

    // Verificar si hay logros nuevos
    const newAchievements = checkAchievements(m.sender);

    let msg = `🏅 *L O G R O S* 🏅\n\n`;

    if (newAchievements.length > 0) {
      msg += `> 🎉 *¡Nuevos logros desbloqueados!*\n`;
      for (const a of newAchievements) {
        let rewardText = '';
        if (a.reward?.xp) rewardText += `+${a.reward.xp} XP `;
        if (a.reward?.coins) rewardText += `+${a.reward.coins} ${currency}`;
        msg += ` ⊳ ${a.name} — ${rewardText.trim()}\n`;
      }
      msg += '\n';
    }

    // Logros desbloqueados
    const unlockedAchievements = ACHIEVEMENTS.filter(a => unlocked.includes(a.id));
    const lockedAchievements = ACHIEVEMENTS.filter(a => !unlocked.includes(a.id));

    if (unlockedAchievements.length > 0) {
      msg += `> ✅ *Desbloqueados (${unlockedAchievements.length}/${ACHIEVEMENTS.length})*\n`;
      for (const a of unlockedAchievements) {
        msg += ` ⊳ ${a.name} — _${a.desc}_\n`;
      }
    }

    if (lockedAchievements.length > 0) {
      msg += `\n> 🔒 *Por desbloquear (${lockedAchievements.length})*\n`;
      for (const a of lockedAchievements) {
        let rewardText = '';
        if (a.reward?.xp) rewardText += `+${a.reward.xp} XP `;
        if (a.reward?.coins) rewardText += `+${a.reward.coins} ${currency}`;
        msg += ` ⊳ ??? — _${a.desc}_ [${rewardText.trim()}]\n`;
      }
    }

    // Barra de progreso
    const pct = Math.round((unlockedAchievements.length / ACHIEVEMENTS.length) * 100);
    const filled = Math.round(pct / 10);
    const bar = '█'.repeat(filled) + '░'.repeat(10 - filled);
    msg += `\n⌦ Progreso: [${bar}] ${pct}%`;

    await client.sendMessage(m.chat, { text: msg }, { quoted: m });
  }
};
