/**
 * 📊 Bot Stats — Estadísticas globales del bot
 */
import os from 'os';
import { runtime, getBotCurrency, getBotSettings } from '../../utils/tools.js';

export default {
  command: ['botstats', 'stats'],
  category: 'info',
  desc: 'Muestra estadísticas globales del bot.',
  cooldown: 10,
  run: async (client, m, args, usedPrefix) => {
    const users = global.db.data.users || {};
    const chats = global.db.data.chats || {};
    const currency = getBotCurrency(client);

    // Contadores globales
    let totalUsers = 0;
    let totalCommands = 0;
    let totalCoins = 0;
    let totalXp = 0;
    let totalWins = 0;
    let totalLosses = 0;
    let totalAchievements = 0;
    let activeToday = 0;

    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;

    for (const [, u] of Object.entries(users)) {
      totalUsers++;
      totalCommands += u.usedcommands || 0;
      totalCoins += (u.coins || 0) + (u.bank || 0);
      totalXp += u.exp || 0;
      totalWins += u.gameWins || 0;
      totalLosses += u.gameLosses || 0;
      totalAchievements += (u.achievements || []).length;
      if (u.lastCmd && (now - u.lastCmd) < oneDayMs) activeToday++;
    }

    const totalGroups = Object.keys(chats).filter(k => k.endsWith('@g.us')).length;
    const totalGames = totalWins + totalLosses;
    const globalWinRate = totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0;

    // Top 5 comandos más usados
    const commandUsage = {};
    for (const [cmd, data] of global.comandos.entries()) {
      if (!commandUsage[data.pluginName]) {
        commandUsage[data.pluginName] = { cmd, category: data.category, count: 0 };
      }
    }

    // Uptime
    const uptimeStr = runtime(process.uptime());
    const sysUptimeStr = runtime(os.uptime());

    // Memoria
    const mem = process.memoryUsage();
    const memUsed = (mem.heapUsed / 1024 / 1024).toFixed(1);
    const memTotal = (mem.heapTotal / 1024 / 1024).toFixed(1);

    let txt = `╭┈──̇─̇─̇────̇─̇─̇──◯◝\n`;
    txt += `┊ 📊 *ESTADÍSTICAS GLOBALES*\n`;
    txt += `┊︶︶︶︶︶︶︶︶︶︶︶\n`;
    txt += `┊\n`;
    txt += `┊ 👥 *Usuarios*\n`;
    txt += `┊  ├ Registrados › *${totalUsers.toLocaleString()}*\n`;
    txt += `┊  ├ Activos hoy › *${activeToday.toLocaleString()}*\n`;
    txt += `┊  └ Grupos › *${totalGroups.toLocaleString()}*\n`;
    txt += `┊\n`;
    txt += `┊ ⚡ *Actividad*\n`;
    txt += `┊  ├ Comandos ejecutados › *${totalCommands.toLocaleString()}*\n`;
    txt += `┊  └ Logros desbloqueados › *${totalAchievements.toLocaleString()}*\n`;
    txt += `┊\n`;
    txt += `┊ 💰 *Economía*\n`;
    txt += `┊  ├ ${currency} en circulación › *¥${totalCoins.toLocaleString()}*\n`;
    txt += `┊  └ XP total › *${totalXp.toLocaleString()}*\n`;
    txt += `┊\n`;
    txt += `┊ 🎮 *Juegos*\n`;
    txt += `┊  ├ Partidas jugadas › *${totalGames.toLocaleString()}*\n`;
    txt += `┊  ├ Victorias globales › *${totalWins.toLocaleString()}*\n`;
    txt += `┊  └ Win Rate global › *${globalWinRate}%*\n`;
    txt += `┊\n`;
    txt += `┊ 🖥️ *Sistema*\n`;
    txt += `┊  ├ Bot uptime › *${uptimeStr}*\n`;
    txt += `┊  ├ Sistema uptime › *${sysUptimeStr}*\n`;
    txt += `┊  ├ Memoria › *${memUsed}/${memTotal} MB*\n`;
    txt += `┊  ├ Node.js › *${process.version}*\n`;
    txt += `┊  └ Comandos cargados › *${global.comandos.size}*\n`;
    txt += `┊ ︿︿︿︿︿︿︿︿︿︿︿\n`;
    txt += `╰─────────────────╯`;

    await client.sendMessage(m.chat, { text: txt }, { quoted: m });
  }
};
