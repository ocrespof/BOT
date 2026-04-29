import ws from 'ws';
import moment from 'moment';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import gradient from 'gradient-string';
import seeCommands from './core/system/commandLoader.js';
import initDB from './core/system/initDB.js';
import config from './config.js';
import antilink from './cmds/group/antilink.js';
import level from './cmds/level.js';
import { getGroupAdmins } from './core/message.js';
import Logger from './utils/logger.js';

seeCommands();

export default async (client, m) => {
  console.log(chalk.yellow("[DEBUG] Mensaje recibido:"), m.text, " | Sender:", m.sender);
  const sender = m.sender;
  let body = m.message.conversation || m.message.extendedTextMessage?.text || m.message.imageMessage?.caption || m.message.videoMessage?.caption || m.message.buttonsResponseMessage?.selectedButtonId || m.message.listResponseMessage?.singleSelectReply?.selectedRowId || m.message.templateButtonReplyMessage?.selectedId || '';
  if ((m.id.startsWith("3EB0") || (m.id.startsWith("BAE5") && m.id.length === 16) || (m.id.startsWith("B24E") && m.id.length === 20))) return
  initDB(m, client)
  antilink(client, m);

  const from = m.key.remoteJid;
  const botJid = client.user.id.split(':')[0] + '@s.whatsapp.net' || client.user.lid;
  const chat = global.db.data.chats[m.chat] || {}
  const settings = global.db.data.settings[botJid] || {}
  const user = global.db.data.users[sender] ||= {}
  const users = chat.users[sender] || {}
  const pushname = m.pushName || 'Sin nombre';

  let groupMetadata = null
  let groupAdmins = []
  let groupName = ''
  if (m.isGroup) {
    groupMetadata = await client.groupMetadata(m.chat).catch(() => null)
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
        await plugin.all.call(client, m, { client });
      } catch (err) {
        console.error(`Error en plugin.all -> ${name}`, err);
      }
    }
  }

  const today = new Date().toLocaleDateString('es-CO', { timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').reverse().join('-');
  if (!users.stats) users.stats = {};
  if (!users.stats[today]) users.stats[today] = { msgs: 0, cmds: 0 };
  users.stats[today].msgs++;

  if (!settings._prefixCache || settings._prefixCache.namebot !== settings.namebot || settings._prefixCache.type !== settings.type || JSON.stringify(settings._prefixCache.prefixSettings) !== JSON.stringify(settings.prefix)) {
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

  for (const name in global.plugins) {
    const plugin = global.plugins[name];
    if (!plugin) continue;
    if (plugin.disabled) continue;
    if (typeof plugin.before === "function") {
      try {
        if (await plugin.before.call(client, m, { client })) {
          continue;
        }
      } catch (err) {
        console.error(`Error en plugin.all -> ${name}`, err);
      }
    }
  }

  if (!match) {
    if (global.queueSaveDatabase) global.queueSaveDatabase();
    return;
  }
  let usedPrefix = (match[0] || [])[0] || '';
  let args = m.text.slice(usedPrefix.length).trim().split(" ");
  let command = (args.shift() || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  let text = args.join(' ');
  if (!command) return;

  if (m.message) {
    console.log(chalk.bold.blue(`╭────────────────────────────···\n│ ${chalk.cyan('Bot')}: ${gradient('lime', 'green')(botJid)}\n│ ${chalk.bold.yellow('Fecha')}: ${gradient('orange', 'yellow')(moment().format('DD/MM/YY HH:mm:ss'))}\n│ ${chalk.bold.blueBright('Usuario')}: ${gradient('cyan', 'blue')(pushname)}\n│ ${chalk.bold.magentaBright('Remitente')}: ${gradient('deepskyblue', 'darkorchid')(sender)}\n${m.isGroup ? '│' + chalk.bold.green(' Grupo') + ': ' + gradient('green', 'lime')(groupName) : '│' + chalk.bold.green(' Privado') + ': ' + gradient('pink', 'magenta')('Chat Privado')}\n${'│' + chalk.bold.magenta(' ID') + ': ' + gradient('violet', 'midnightblue')(m.isGroup ? from : 'Chat Privado')}\n│ ${chalk.bold.cyanBright('Comando usado')}: ${chalk.gray(command ? command : 'No Command')}\n╰────────────────────────────···\n`));
  }

  const hasPrefix = settings.prefix === true ? true : (Array.isArray(settings.prefix) ? settings.prefix : typeof settings.prefix === 'string' ? [settings.prefix] : []).some(p => m.text?.startsWith(p));
  if (!isOwners && settings.self) return;
  if (m.chat && !m.chat.endsWith('g.us')) {
    const allowedInPrivateForUsers = [
      'play', 'mp3', 'play2', 'mp4', 'facebook', 'fb', 'tiktok', 'tt', 'instagram', 'ig', 'pinterest', 'pin', 'imagen', 'img',
      'chatgpt', 'ia', 'humanizar', 'hd', 'remini', 'read', 'readviewonce', 'ocr', 'texto', 'ssweb', 'ss', 'inspect', 'get', 'fetch', 'apa', 'citar',
      'tts', 'audio', 'decir', 'clima', 'weather', 'tiny', 'shorturl', 'acortar', 'recordar', 'remind', 'trad', 'traducir', 'tr', 'qr', 'qrcode', 'yts', 'ytsr',
      'wiki', 'wikipedia', 'math', 'calcular', 'resumir', 'resumen', 'pomodoro', 'estudio', 'trivia', 'preguntados', 'frase', 'motivacion', 'quote',
      'corregir', 'ortografia', 'parafrasear', 'reescribir', 'def', 'significado', 'diccionario', 'ruleta', 'sorteo', 'asignar',
      'menu', 'help', 'allmenu', 'ping', 'p', 'status'
    ];
    if (!isOwners && !allowedInPrivateForUsers.includes(command)) return;
  }
  if (chat?.isBanned && !(command === 'bot' && text === 'on') && !isOwners) {
    await m.reply(`El bot *${settings.botname}* está desactivado en este grupo.\n\nUn *administrador* puede activarlo con el comando:\n*${usedPrefix}bot on*`);
    return;
  }
  if (m.text && user.banned && !isOwners) {
    await m.reply(`Estas ${user.genre === 'Mujer' ? 'baneada' : user.genre === 'Hombre' ? 'baneado' : 'baneado/a'}, no puedes usar comandos en este bot!\n\n● *Razón ›* ${user.bannedReason || 'Sin especificar'}\n\n● Si este Bot es cuenta oficial y tienes evidencia que respalde que este mensaje es un error, puedes exponer tu caso con un moderador.`);
    return;
  }

  if (!users.stats) users.stats = {};
  if (!users.stats[today]) users.stats[today] = { msgs: 0, cmds: 0 };
  if (m.isGroup && chat.adminonly && !isAdmins && !isOwners) return;
  const cmdData = global.comandos.get(command);
  if (!cmdData) {
    if (settings.prefix === true) return;
    await client.readMessages([m.key]);
    return m.reply(`ꕤ El comando *${command}* no existe.\nUsa *${usedPrefix}help* para ver la lista de comandos disponibles.`);
  }
  if (cmdData.isOwner && !isOwners) {
    if (settings.prefix === true) return;
    return m.reply(`ꕤ El comando *${command}* no existe.\nUsa *${usedPrefix}help* para ver la lista de comandos disponibles.`);
  }
  if (cmdData.isAdmin && !isAdmins) return client.reply(m.chat, mess.admin, m);
  if (cmdData.botAdmin && !isBotAdmins) return client.reply(m.chat, mess.botAdmin, m);

  // --- Anti-Spam Global ---
  const now = Date.now();
  const globalSpamDelay = 1500; // 1.5 seconds
  if (!user.lastMessageTime) user.lastMessageTime = 0;
  if (now - user.lastMessageTime < globalSpamDelay && !isOwners) {
    if (!user.warnedSpam) {
      user.warnedSpam = true;
      user.lastMessageTime = now + 3000;
      return m.reply(`*¡No hagas spam!* Espera un momento antes de enviar otro comando.`);
    }
    return;
  }
  user.warnedSpam = false;
  user.lastMessageTime = now;

  // --- Cooldown por Comando ---
  const cmdCooldown = (cmdData.cooldown || 0) * 1000;
  if (cmdCooldown > 0 && !isOwners) {
    if (!user.cooldowns) user.cooldowns = {};
    if (user.cooldowns[command] && now < user.cooldowns[command]) {
      if (!user.warnedCooldowns) user.warnedCooldowns = {};
      if (!user.warnedCooldowns[command] || now > user.warnedCooldowns[command]) {
        const timeLeft = Math.ceil((user.cooldowns[command] - now) / 1000);
        user.warnedCooldowns[command] = now + 5000;
        return m.reply(`⏳ *Cooldown activo.*\nDebes esperar *${timeLeft}s* para volver a usar *${command}*.`);
      }
      return;
    }
    user.cooldowns[command] = now + cmdCooldown;
  }

  try {
    await client.readMessages([m.key]);
    user.usedcommands = (user.usedcommands || 0) + 1;
    settings.commandsejecut = (settings.commandsejecut || 0) + 1;
    users.usedTime = new Date();
    users.lastCmd = Date.now();
    user.exp = (user.exp || 0) + Math.floor(Math.random() * 100);
    user.name = m.pushName;
    users.stats[today].cmds++;
    await cmdData.run(client, m, args, usedPrefix, command, text);
  } catch (error) {
    Logger.error(`Error al ejecutar el comando ${command}:`, error);
    await client.sendMessage(m.chat, { text: ` Error al ejecutar el comando\n${error}` }, { quoted: m });
  } finally {
    if (global.queueSaveDatabase) global.queueSaveDatabase();
  }
  level(m);
};
