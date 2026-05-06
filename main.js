
import moment from 'moment';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import seeCommands from './core/system/commandLoader.js';
import initDB from './core/system/initDB.js';
import config from './config.js';
import antilink from './cmds/antilink.js';
import level from './utils/levelHook.js';
import { getGroupAdmins } from './core/message.js';
import Logger from './utils/logger.js';
import NodeCache from 'node-cache';

// Caché de metadata de grupo — TTL 5 min, evita llamadas de red en cada mensaje
const groupMetaCache = new NodeCache({ stdTTL: 300, checkperiod: 60, useClones: false });
global.groupMetaCache = groupMetaCache;

// Set estático — se crea una sola vez, no en cada mensaje
const ALLOWED_IN_PRIVATE = new Set([
  'play', 'mp3', 'play2', 'mp4', 'facebook', 'fb', 'tiktok', 'tt', 'instagram', 'ig', 'pinterest', 'pin', 'imagen', 'img',
  'chatgpt', 'ia', 'humanizar', 'hd', 'remini', 'read', 'readviewonce', 'ocr', 'texto', 'ssweb', 'ss', 'inspect', 'get', 'fetch', 'apa', 'citar',
  'tts', 'audio', 'decir', 'clima', 'weather', 'tiny', 'shorturl', 'acortar', 'recordar', 'remind', 'trad', 'traducir', 'tr', 'qr', 'qrcode', 'yts', 'ytsr',
  'wiki', 'wikipedia', 'math', 'calcular', 'resumir', 'resumen', 'pomodoro', 'estudio', 'trivia', 'preguntados', 'frase', 'motivacion', 'quote',
  'corregir', 'ortografia', 'parafrasear', 'reescribir', 'def', 'significado', 'diccionario', 'ruleta', 'sorteo', 'asignar',
  'menu', 'help', 'allmenu', 'ping', 'p', 'status', 'botstats', 'stats', 'estado',
  'balance', 'bal', 'saldo', 'profile', 'perfil', 'inv', 'inventory', 'inventario'
]);

seeCommands();

export default async (client, m) => {

  const sender = m.sender;
  if (m.isBot) return
  initDB(m, client)
  antilink(client, m);

  // Buffer de mensajes globales para comandos que necesiten contexto (ej. .q N)
  global.msgBuffer = global.msgBuffer || {};
  global.msgBuffer[m.chat] = global.msgBuffer[m.chat] || [];
  global.msgBuffer[m.chat].push(m);
  if (global.msgBuffer[m.chat].length > 50) global.msgBuffer[m.chat].shift();

  const from = m.key.remoteJid;
  const botJid = client.user.id.split(':')[0] + '@s.whatsapp.net' || client.user.lid;
  const chat = global.db.data.chats[m.chat] || {}
  const settings = global.db.data.settings[botJid] || {}
  const user = global.db.data.users[sender] ||= {}
  // Garantizar que chat.users[sender] exista en la DB (no como objeto temporal)
  if (!chat.users) chat.users = {};
  if (!chat.users[sender]) chat.users[sender] = {};
  const users = chat.users[sender];
  const pushname = m.pushName || 'Sin nombre';

  let groupMetadata = null
  let groupAdmins = []
  let groupName = ''
  if (m.isGroup) {
    groupMetadata = groupMetaCache.get(m.chat)
    if (!groupMetadata) {
      groupMetadata = await client.groupMetadata(m.chat).catch(() => null)
      if (groupMetadata) groupMetaCache.set(m.chat, groupMetadata)
    }
    groupName = groupMetadata?.subject || ''
    groupAdmins = groupMetadata?.participants.filter(p => (p.admin === 'admin' || p.admin === 'superadmin')) || []
  }
  const isBotAdmins = m.isGroup ? groupAdmins.some(p => p.phoneNumber === botJid || p.jid === botJid || p.id === botJid || p.lid === botJid) : false
  const isAdmins = m.isGroup ? groupAdmins.some(p => p.phoneNumber === sender || p.jid === sender || p.id === sender || p.lid === sender) : false
  const isOwners = [botJid, ...(settings.owner ? [settings.owner] : []), ...config.owner.map(num => num + '@s.whatsapp.net')].includes(sender);

  for (const name in global.plugins) {
    const plugin = global.plugins[name];
    if (plugin && typeof plugin.all === "function") {
      try {
        await plugin.all(client, m);
      } catch (err) {
        console.error(`Error en plugin.all -> ${name}`, err);
      }
    }
  }

  const today = new Date().toLocaleDateString('es-CO', { timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').reverse().join('-');
  if (!users.stats) users.stats = {};
  if (!users.stats[today]) users.stats[today] = { msgs: 0, cmds: 0 };
  users.stats[today].msgs++;

  if (!settings._prefixCache || !(settings._prefixCache.regex instanceof RegExp) || settings._prefixCache.namebot !== settings.namebot || settings._prefixCache.type !== settings.type || JSON.stringify(settings._prefixCache.prefixSettings) !== JSON.stringify(settings.prefix)) {
    const rawBotname = settings.namebot || 'Yuki';
    const cleanBotname = rawBotname.replace(/[^a-zA-Z0-9\s]/g, '')
    const namebot = cleanBotname || 'Yuki';
    const shortForms = [namebot.charAt(0), namebot.split(" ")[0], namebot.split(" ")[0].slice(0, 2), namebot.split(" ")[0].slice(0, 3)];
    const prefixes = shortForms.map(name => `${name}`);
    prefixes.unshift(namebot);
    let prefixReg;
    if (Array.isArray(settings.prefix) || typeof settings.prefix === 'string') {
      const prefixArray = Array.isArray(settings.prefix) ? settings.prefix : [settings.prefix];
      prefixReg = new RegExp('^(' + prefixes.join('|') + ')?(' + prefixArray.map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')', 'i');
    } else if (settings.prefix === true) {
      prefixReg = new RegExp('^', 'i');
    } else {
      prefixReg = new RegExp('^(' + prefixes.join('|') + ')?', 'i');
    }
    settings._prefixCache = { namebot: settings.namebot, type: settings.type, prefixSettings: settings.prefix, regex: prefixReg };
  }
  let prefix = settings._prefixCache.regex;
  const strRegex = (str) => str.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&');
  let pluginPrefix = client.prefix ? client.prefix : prefix;
  let matchs = pluginPrefix instanceof RegExp ? [[pluginPrefix.exec(m.text), pluginPrefix]] : Array.isArray(pluginPrefix) ? pluginPrefix.map(p => {
    let regex = p instanceof RegExp ? p : new RegExp(strRegex(p));
    return [regex.exec(m.text), regex];
  }) : typeof pluginPrefix === 'string' ? [[new RegExp(strRegex(pluginPrefix)).exec(m.text), new RegExp(strRegex(pluginPrefix))]] : [[null, null]];
  let match = matchs.find(p => p[0]);

  let intercepted = false;
  for (const name in global.plugins) {
    const plugin = global.plugins[name];
    if (!plugin) continue;
    if (plugin.disabled) continue;
    if (typeof plugin.before === "function") {
      try {
        if (await plugin.before(client, m)) {
          intercepted = true;
          break;
        }
      } catch (err) {
        console.error(`Error en plugin.before -> ${name}`, err);
      }
    }
  }

  if (intercepted) return;

  if (!match) {
    if (global.queueSaveDatabase) global.queueSaveDatabase();
    return;
  }
  let usedPrefix = (match[0] || [])[0] || '';
  let args = m.text.slice(usedPrefix.length).trim().split(" ");
  let command = (args.shift() || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  let text = args.join(' ');
  if (!command) return;
  
  // ═══════════════════════════════════════════════
  //  MIDDLEWARE PIPELINE
  // ═══════════════════════════════════════════════

  // MW 1: Console logging (dev only, no user impact)
  if (m.message) {
    console.log(chalk.bold.blue(
      `╭──── CMD ────···\n` +
      `│ 📅 ${moment().format('DD/MM HH:mm:ss')}\n` +
      `│ 👤 ${pushname} (${sender.split('@')[0]})\n` +
      `│ ${m.isGroup ? '👥 ' + groupName : '💬 Privado'}\n` +
      `│ ⌨️ ${command}\n` +
      `╰────────────···`
    ));
  }

  // MW 2: Self mode — solo dueños pueden usar
  if (!isOwners && settings.self) return;

  // MW 3: Private chat filter
  if (m.chat && !m.chat.endsWith('g.us') && !isOwners) {
    if (!ALLOWED_IN_PRIVATE.has(command)) return;
  }

  // MW 4: Group ban check
  if (chat?.isBanned && !(command === 'bot' && text === 'on') && !isOwners) {
    return m.reply(`El bot *${settings.botname}* está desactivado en este grupo.\n\nUn *administrador* puede activarlo con:\n*${usedPrefix}bot on*`);
  }

  // MW 5: User ban check
  if (m.text && user.banned && !isOwners) {
    return m.reply(`Estás baneado/a, no puedes usar comandos.\n\n● *Razón ›* ${user.bannedReason || 'Sin especificar'}`);
  }

  // MW 6: Admin-only mode
  if (m.isGroup && chat.adminonly && !isAdmins && !isOwners) {
    return client.reply(m.chat, `⚠️ *MODO ADMIN ACTIVO*\nSolo administradores pueden usar comandos en este momento.`, m);
  }

  // MW 7: Command resolution
  const cmdData = global.comandos.get(command);
  if (!cmdData) {
    if (settings.prefix === true) return;
    await client.readMessages([m.key]);
    return m.reply(`ꕤ El comando *${command}* no existe.\nUsa *${usedPrefix}help* para ver los comandos.`);
  }

  // MW 8: Role checks
  if (cmdData.isOwner && !isOwners) {
    if (settings.prefix === true) return;
    return m.reply(`ꕤ El comando *${command}* no existe.\nUsa *${usedPrefix}help* para ver los comandos.`);
  }
  if (cmdData.isAdmin && !isAdmins) return client.reply(m.chat, mess.admin, m);
  if (cmdData.botAdmin && !isBotAdmins) return client.reply(m.chat, mess.botAdmin, m);

  // MW 9: Economy guard
  if (cmdData.economy) {
    const chatEco = global.db.data.chats[m.chat] || {};
    if (!chatEco.economy) {
      return m.reply(`Los comandos de *Economía* están desactivados en este grupo.\n\nUn *administrador* puede activarlos con:\n*${usedPrefix}economy on*`);
    }
  }

  // MW 10: Anti-spam
  const now = Date.now();
  if (!user.lastMessageTime) user.lastMessageTime = 0;
  if (now - user.lastMessageTime < 1500 && !isOwners) {
    if (!user.warnedSpam) {
      user.warnedSpam = true;
      user.lastMessageTime = now + 3000;
      return m.reply(`*¡No hagas spam!* Espera un momento.`);
    }
    return;
  }
  user.warnedSpam = false;
  user.lastMessageTime = now;

  // MW 11: Per-command cooldown (respects cooldownSkip from shop)
  const cmdCooldown = (cmdData.cooldown || 0) * 1000;
  if (cmdCooldown > 0 && !isOwners) {
    // Check if user has a cooldownSkip item active
    if (user.cooldownSkip) {
      user.cooldownSkip = false; // Consume the skip
    } else {
      if (!user.cooldowns) user.cooldowns = {};
      if (user.cooldowns[command] && now < user.cooldowns[command]) {
        if (!user.warnedCooldowns) user.warnedCooldowns = {};
        if (!user.warnedCooldowns[command] || now > user.warnedCooldowns[command]) {
          const timeLeft = Math.ceil((user.cooldowns[command] - now) / 1000);
          user.warnedCooldowns[command] = now + 5000;
          return m.reply(`⏳ Cooldown: espera *${timeLeft}s* para usar *${command}* de nuevo.`);
        }
        return;
      }
      user.cooldowns[command] = now + cmdCooldown;
    }
  }

  // ═══════════════════════════════════════════════
  //  COMMAND EXECUTION
  // ═══════════════════════════════════════════════
  if (!users.stats) users.stats = {};
  if (!users.stats[today]) users.stats[today] = { msgs: 0, cmds: 0 };

  try {
    await client.readMessages([m.key]);
    user.usedcommands = (user.usedcommands || 0) + 1;
    settings.commandsejecut = (settings.commandsejecut || 0) + 1;
    users.usedTime = new Date();
    users.lastCmd = Date.now();
    
    // XP gain — apply xpBoost multiplier if active
    let xpGain = Math.floor(Math.random() * 16) + 5;
    if (user.xpBoost && user.xpBoost.expiresAt > now) {
      xpGain = Math.floor(xpGain * user.xpBoost.multiplier);
    }
    // Apply fortuneBuff (+10% to all rewards)
    if (user.fortuneBuff && user.fortuneBuff.expiresAt > now) {
      xpGain = Math.floor(xpGain * (1 + user.fortuneBuff.value));
    }
    user.exp = (user.exp || 0) + xpGain;
    user.name = m.pushName;
    users.stats[today].cmds++;
    await cmdData.run(client, m, args, usedPrefix, command, text);
  } catch (error) {
    Logger.error(`Error al ejecutar ${command}:`, error);
    await client.sendMessage(m.chat, { text: `❌ Error al ejecutar el comando\n[${error.message}]` }, { quoted: m });
  } finally {
    if (global.queueSaveDatabase) global.queueSaveDatabase();
  }
  level(m);
};
