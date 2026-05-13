/**
 * 🎮 Game Stats — Ver estadísticas de juegos y partidas
 */
import { gameEngine } from '../../utils/gameEngine.js';

export default {
  command: ['gamestats', 'gs', 'estadisticas'],
  category: 'juegos',
  desc: 'Muestra tus estadísticas de juegos.',
  cooldown: 5,
  run: async (client, m, args, usedPrefix, command) => {
    const stats = gameEngine.getStats(m.sender);
    const user = global.db.data.users[m.sender];
    const name = user?.name || m.sender.split('@')[0];

    let msg = `🎮 *Estadísticas de ${name}* 🎮\n\n`;
    msg += `✅ Victorias › *${stats.wins}*\n`;
    msg += `❌ Derrotas › *${stats.losses}*\n`;
    msg += `🎯 Total partidas › *${stats.total}*\n`;
    msg += `📊 Win Rate › *${stats.winRate}%*\n\n`;

    // Logros
    const achievements = stats.achievements;
    if (achievements.length > 0) {
      msg += `🏅 Logros desbloqueados › *${achievements.length}*\n`;
      msg += `_Usa \`${usedPrefix}logros\` para ver el detalle._\n\n`;
    }

    // Sesiones activas (debug info)
    msg += `⚡ Sesiones activas globales › *${gameEngine.activeSessions}*`;

    await client.sendMessage(m.chat, { text: msg }, { quoted: m });
  }
};
