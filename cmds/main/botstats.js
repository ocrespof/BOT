/**
 * 📊 BotStats — Monitor de rendimiento desde WhatsApp
 * Muestra RAM, usuarios, uptime, comandos del día, tamaño de BD
 */
import fs from 'fs';
import path from 'path';
import os from 'os';

export default {
  command: ['botstats', 'stats', 'estado'],
  category: 'info',
  desc: 'Muestra las estadísticas y rendimiento del bot en tiempo real.',
  cooldown: 10,
  run: async (client, m, args, usedPrefix) => {
    const botJid = client.user.id.split(':')[0] + '@s.whatsapp.net';
    const settings = global.db.data.settings[botJid] || {};
    
    // RAM
    const memUsage = process.memoryUsage();
    const ramUsedMB = (memUsage.heapUsed / 1024 / 1024).toFixed(1);
    const ramTotalMB = (memUsage.heapTotal / 1024 / 1024).toFixed(1);
    const ramSystemMB = (os.totalmem() / 1024 / 1024).toFixed(0);
    const ramFreeMB = (os.freemem() / 1024 / 1024).toFixed(0);
    
    // Uptime
    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const mins = Math.floor((uptime % 3600) / 60);
    const secs = Math.floor(uptime % 60);
    const uptimeStr = `${hours}h ${mins}m ${secs}s`;
    
    // Users & Chats
    const totalUsers = Object.keys(global.db.data.users).length;
    const totalChats = Object.keys(global.db.data.chats).length;
    
    // Commands today
    const today = new Date().toLocaleDateString('es-CO', { timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').reverse().join('-');
    let cmdToday = 0;
    let msgsToday = 0;
    for (const chatData of Object.values(global.db.data.chats)) {
      if (!chatData.users) continue;
      for (const userData of Object.values(chatData.users)) {
        if (userData.stats && userData.stats[today]) {
          cmdToday += userData.stats[today].cmds || 0;
          msgsToday += userData.stats[today].msgs || 0;
        }
      }
    }
    
    // DB sizes
    const dbDir = path.join(process.cwd(), 'core');
    let dbSize = 0;
    for (const file of ['db_users.json', 'db_chats.json', 'db_settings.json', 'database.json']) {
      try {
        const stat = fs.statSync(path.join(dbDir, file));
        dbSize += stat.size;
      } catch {}
    }
    const dbSizeKB = (dbSize / 1024).toFixed(1);
    
    // Total commands
    const totalCmds = settings.commandsejecut || 0;
    const totalPlugins = global.comandos?.size || 0;
    
    // CPU
    const cpuCount = os.cpus().length;
    const loadAvg = os.loadavg()[0].toFixed(2);
    
    const msg = `📊 *B O T   S T A T S* 📊

> 🖥️ *Sistema*
 ⊳ RAM: *${ramUsedMB}MB* / ${ramTotalMB}MB (Heap)
 ⊳ RAM Sistema: *${ramFreeMB}MB* libres / ${ramSystemMB}MB
 ⊳ CPU: ${cpuCount} núcleos · Carga: ${loadAvg}
 ⊳ Node.js: ${process.version}

> ⏱️ *Actividad*
 ⊳ Uptime: *${uptimeStr}*
 ⊳ Comandos hoy: *${cmdToday.toLocaleString()}*
 ⊳ Mensajes hoy: *${msgsToday.toLocaleString()}*
 ⊳ Comandos totales: *${totalCmds.toLocaleString()}*

> 💾 *Base de Datos*
 ⊳ Usuarios: *${totalUsers.toLocaleString()}*
 ⊳ Chats/Grupos: *${totalChats.toLocaleString()}*
 ⊳ Tamaño BD: *${dbSizeKB} KB*
 ⊳ Plugins cargados: *${totalPlugins}*`;

    await client.sendMessage(m.chat, { text: msg }, { quoted: m });
  }
};
