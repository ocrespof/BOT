/**
 * 🏆 Game Leaderboard — Top jugadores por victorias, winRate y logros
 */
import { gameEngine } from '../../utils/gameEngine.js';
import { getBotCurrency } from '../../utils/tools.js';

export default {
  command: ['gameboard', 'glb', 'topjuegos'],
  category: 'juegos',
  desc: 'Muestra el ranking de los mejores jugadores.',
  cooldown: 10,
  run: async (client, m, args, usedPrefix) => {
    const currency = getBotCurrency(client);
    const users = global.db.data.users || {};
    const mode = (args[0] || 'wins').toLowerCase();

    // Filtrar usuarios que han jugado al menos 1 partida
    const players = Object.entries(users)
      .filter(([, u]) => (u.gameWins || 0) + (u.gameLosses || 0) > 0)
      .map(([jid, u]) => {
        const wins = u.gameWins || 0;
        const losses = u.gameLosses || 0;
        const total = wins + losses;
        return {
          jid,
          name: u.name || jid.split('@')[0],
          wins,
          losses,
          total,
          winRate: total > 0 ? Math.round((wins / total) * 100) : 0,
          achievements: (u.achievements || []).length,
          coins: (u.coins || 0) + (u.bank || 0),
        };
      });

    if (players.length === 0) {
      return m.reply('Todavía no hay jugadores con partidas registradas.');
    }

    // Ordenar según el modo
    const sortModes = {
      wins: (a, b) => b.wins - a.wins,
      rate: (a, b) => b.winRate - a.winRate || b.total - a.total,
      logros: (a, b) => b.achievements - a.achievements,
    };

    const sortFn = sortModes[mode] || sortModes.wins;
    const sorted = players.sort(sortFn).slice(0, 15);

    const modeLabels = { wins: 'Victorias', rate: 'Win Rate', logros: 'Logros' };
    const modeLabel = modeLabels[mode] || 'Victorias';
    const medals = ['🥇', '🥈', '🥉'];

    let txt = `╭┈──̇─̇─̇────̇─̇─̇──◯◝\n`;
    txt += `┊ 🏆 *GAME LEADERBOARD*\n`;
    txt += `┊ _Ordenado por: ${modeLabel}_\n`;
    txt += `┊︶︶︶︶︶︶︶︶︶︶︶\n`;

    sorted.forEach((p, i) => {
      const medal = medals[i] || `*${i + 1}.*`;
      const statsLine = mode === 'rate'
        ? `${p.winRate}% (${p.wins}W/${p.losses}L)`
        : mode === 'logros'
        ? `${p.achievements} 🏅 | ${p.wins}W`
        : `${p.wins}W / ${p.losses}L (${p.winRate}%)`;
      txt += `┊ ${medal} @${p.jid.split('@')[0]}\n`;
      txt += `┊    ➤ ${statsLine}\n`;
    });

    txt += `┊ ︿︿︿︿︿︿︿︿︿︿︿\n`;
    txt += `╰─────────────────╯\n\n`;
    txt += `> _Modos: ${usedPrefix}gameboard [wins|rate|logros]_`;

    const mentions = sorted.map(p => p.jid);
    await client.sendMessage(m.chat, { text: txt, mentions }, { quoted: m });
  }
};
