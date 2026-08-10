// Global TLS bypass for Termux environments (must be FIRST)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import config from "./config.js";

// Bridge for legacy plugin globals
global.owner = config.owner;
global.botNumber = config.botNumber;
global.sessionName = config.sessionName;
global.version = config.version;
global.dev = config.dev;
global.links = config.links;
global.my = config.my;
global.mess = config.mess;
global.APIs = config.APIs;
global.config = config;
import main, { initCommands } from './main.js';
import events from './core/system/events.js';
import { Browsers, makeWASocket, makeCacheableSignalKeyStore, useMultiFileAuthState, fetchLatestBaileysVersion, jidDecode, DisconnectReason } from "@whiskeysockets/baileys";
import cfonts from 'cfonts';
import pino from "pino";
import qrcode from "qrcode-terminal";
import chalk from "chalk";
import fs from "fs";
import path from "path";
import readlineSync from "readline-sync";
import NodeCache from "node-cache";
import { smsg, decorateClient, getCachedMeta, setCachedMeta, deleteCachedMeta, setCachedPushName, patchGroupMetadata } from "./core/message.js";
import db from "./core/system/database.js";
import { exec } from "child_process";

import Logger from './utils/logger.js';

// Anti-crash handlers are at the bottom of this file
// ---------------------------
const log = {
  ...Logger,
  warning: Logger.warn
};

const maxCache = 100;
let phoneNumber = global.botNumber || "";
let phoneInput = "";
const methodCodeQR = process.argv.includes("--qr");
const methodCode = process.argv.includes("code");
const DIGITS = (s = "") => String(s).replace(/\D/g, "");

function normalizePhoneForPairing(input) {
  let s = DIGITS(input);
  if (!s) return "";
  if (s.startsWith("0")) s = s.replace(/^0+/, "");
  if (s.length === 10 && s.startsWith("3")) s = "57" + s;
  if (s.startsWith("52") && !s.startsWith("521") && s.length >= 12) s = "521" + s.slice(2);
  if (s.startsWith("54") && !s.startsWith("549") && s.length >= 11) s = "549" + s.slice(2);
  return s;
}

const { say } = cfonts
console.log(chalk.magentaBright('\nIniciando...'))
say('Yuki Suou', {
  align: 'center',
  gradient: ['red', 'blue']
})
say('Made with love by Destroy', {
  font: 'console',
  align: 'center',
  gradient: ['blue', 'magenta']
})

if (!fs.existsSync('./tmp')) fs.mkdirSync('./tmp', { recursive: true });
const reconnecting = new Set();
const msgRetryCounterCache = new NodeCache();

async function cleanCache() {
  try {
    const tmpFolder = './tmp';
    if (fs.existsSync(tmpFolder)) {
      const files = await fs.promises.readdir(tmpFolder);
      let cleaned = 0;
      const now = Date.now();
      for (const file of files) {
        try { 
          const filePath = path.join(tmpFolder, file);
          const stat = await fs.promises.stat(filePath);
          // Borrar solo archivos que tengan más de 10 minutos de antigüedad
          if (now - stat.mtimeMs > 10 * 60 * 1000) {
            await fs.promises.unlink(filePath); 
            cleaned++; 
          }
        } catch { }
      }
      if (cleaned > 0) console.log(chalk.gray(`[ 🗑️ ] Cache tmp: ${cleaned} archivos expirados eliminados`));
    }
    const sessionsFolder = './Sessions';
    if (fs.existsSync(sessionsFolder)) {
      const getFolderSizeMB = async (dir) => {
        let total = 0;
        const files = await fs.promises.readdir(dir);
        for (const file of files) {
          try {
            const filePath = path.join(dir, file);
            const stat = await fs.promises.stat(filePath);
            total += stat.isDirectory() ? await getFolderSizeMB(filePath) : stat.size;
          } catch { }
        }
        return total / (1024 * 1024);
      };
      const sizeMB = await getFolderSizeMB(sessionsFolder);
      if (sizeMB > maxCache) {
        console.log(chalk.yellow(`[ ⚠ ] Sessions ${sizeMB.toFixed(1)}MB — limpiando...`));
        const safeDelete = async (dir) => {
          const files = await fs.promises.readdir(dir);
          for (const file of files) {
            const filePath = path.join(dir, file);
            const stat = await fs.promises.stat(filePath);
            if (stat.isDirectory()) {
              await safeDelete(filePath);
            } else if (!file.includes('creds') && !file.startsWith('session-')) {
              try { await fs.promises.unlink(filePath); } catch { }
            }
          }
        };
        const botFolder = path.join(sessionsFolder, 'Owner');
        if (fs.existsSync(botFolder)) await safeDelete(botFolder);
      }
    }
  } catch (e) {
    console.error(chalk.red('Error en cleanCache: '), e);
  }
}
let opcion = "2";
if (methodCodeQR) {
  opcion = "1";
} else if (!fs.existsSync("./Sessions/Owner/creds.json")) {
  console.log(chalk.bold.cyan(`\nPor favor, ingrese el número de WhatsApp para vincular por código de texto:\n${chalk.bold.yellow("Ejemplo: +57301******")}`));
  phoneInput = readlineSync.question(chalk.bold.magenta('---> '));
  phoneNumber = normalizePhoneForPairing(phoneInput);
  while (!phoneNumber) {
    console.log(chalk.bold.redBright("Número no válido. Ingrese nuevamente:"));
    phoneInput = readlineSync.question(chalk.bold.magenta('---> '));
    phoneNumber = normalizePhoneForPairing(phoneInput);
  }
}

let reconexion = 0;
const intentos = 15;
let lastActivityTimestamp = Date.now();

function cleanupSocket() {
  if (global.watchdogTimer) {
    clearInterval(global.watchdogTimer);
    global.watchdogTimer = null;
  }
  if (global.client) {
    try {
      global.client.ev.removeAllListeners();
      if (global.client.ws) {
        global.client.ws.close();
      }
    } catch {}
    global.client = null;
  }
}

function setupWatchdog(sock) {
  if (global.watchdogTimer) clearInterval(global.watchdogTimer);
  lastActivityTimestamp = Date.now();

  global.watchdogTimer = setInterval(() => {
    const now = Date.now();
    const inactiveTime = now - lastActivityTimestamp;
    const isWsOpen = sock.ws && sock.ws.readyState === 1;

    if (inactiveTime > 15 * 60 * 1000 || !isWsOpen) {
      console.log(chalk.yellow('[ ⚠ Watchdog ] Conexión inactiva o socket cerrado (>15 min). Forzando reconexión limpia...'));
      cleanupSocket();
      startBot();
    }
  }, 3 * 60 * 1000);
}

const msgStore = new Map();
const msgLimit = 100;

const versionCache = { value: null, expiresAt: 0 };
async function getVersion() {
  if (versionCache.value && Date.now() < versionCache.expiresAt) return versionCache.value;
  try {
    const latest = await fetchLatestBaileysVersion();
    versionCache.value = latest.version;
    versionCache.expiresAt = Date.now() + 60 * 60 * 1000;
  } catch (e) {
    if (!versionCache.value) versionCache.value = [2, 3000, 1033105955];
  }
  return versionCache.value;
}

async function warmupGroups(sock) {
  try {
    const allChats = db.data?.chats ? Object.keys(db.data.chats).map(id => ({ id })) : [];
    const chatIds = allChats
      .map(c => c.id || c)
      .filter(id => typeof id === 'string' && id.endsWith('@g.us'))
      .slice(0, 50);
    if (!chatIds.length) return;
    console.log(chalk.gray(`[ ✿ ] Precargando metadata de ${chatIds.length} grupos...`));
    const t = Date.now();
    const batches = [];
    for (let i = 0; i < chatIds.length; i += 10) {
      batches.push(chatIds.slice(i, i + 10));
    }
    await Promise.allSettled(batches.map(batch => Promise.allSettled(batch.map(async id => {
      try {
        const meta = await sock.groupMetadata(id);
        if (meta) setCachedMeta(id, meta);
      } catch {}
    }))));
    console.log(chalk.gray(`[ ✿ ] Warmup completado en ${Date.now() - t}ms`));
  } catch (e) {
    console.log(chalk.gray(`[ ✿ ] warmupGroups → ${e?.message || e}`));
  }
}

async function startBot() {
  cleanupSocket();
  const { state, saveCreds } = await useMultiFileAuthState(global.sessionName);
  const version = await getVersion();
  const logger = pino({ level: "silent" });
  console.info = () => { };
  console.debug = () => { };
  const sock = makeWASocket({
    version,
    logger,
    printQRInTerminal: false,
    browser: ['Ubuntu', 'Chrome', '20.0.04'],
    auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, logger) },
    msgRetryCounterCache,
    cachedGroupMetadata: async (jid) => getCachedMeta(jid) ?? undefined,
    getMessage: async (key) => msgStore.get(key.remoteJid + ':' + key.id) || "",
    markOnlineOnConnect: false,
    generateHighQualityLinkPreview: false,
    syncFullHistory: false,
    shouldSyncHistoryMessage: () => false,
    shouldIgnoreJid: (jid) => jid?.endsWith('@newsletter') || jid?.endsWith('@broadcast'),
    defaultQueryTimeoutMs: undefined,
    emitOwnEvents: true,
    keepAliveIntervalMs: 25000,
  });
  global.client = sock;
  sock.isInit = false;
  decorateClient(sock, null);
  patchGroupMetadata(sock);
  setupWatchdog(sock);
  sock.ev.on("creds.update", saveCreds);
  sock.ev.on("group-participants.update", ({ id }) => { deleteCachedMeta(id); });
  sock.ev.on("groups.update", (updates) => { for (const update of updates) deleteCachedMeta(update.id); });

  if (opcion === "2" && !fs.existsSync("./Sessions/Owner/creds.json")) {
    setTimeout(async () => {
      try {
        if (!state.creds.registered) {
          const pairing = await global.client.requestPairingCode(phoneNumber);
          const codeBot = pairing?.match(/.{1,4}/g)?.join("-") || pairing;
          console.log(chalk.bold.white(chalk.bgMagenta(`Código de emparejamiento:`)), chalk.bold.white(chalk.white(codeBot)));
        }
      } catch (err) {
        Logger.error("Error al generar código:", err);
      }
    }, 3000);
  }

  sock.sendText = (jid, text, quoted = "", options) => sock.sendMessage(jid, { text, ...options }, { quoted });
  sock.ev.on("connection.update", async (update) => {
    lastActivityTimestamp = Date.now();
    const { qr, connection, lastDisconnect, isNewLogin, receivedPendingNotifications } = update;
    if (qr != 0 && qr != undefined || methodCodeQR) {
      if (opcion == '1' || methodCodeQR) {
        console.log(chalk.green.bold("[ ✿ ] Escanea este código QR"));
        qrcode.generate(qr, { small: true });
      }
    }

    if (connection === "close") {
      cleanupSocket();
      const reason = lastDisconnect?.error?.output?.statusCode || 0;
      if (reason === DisconnectReason.loggedOut) {
        log.warning("Escanee nuevamente y ejecute...");
        await fs.promises.rm("./Sessions/Owner", { recursive: true, force: true }).catch(() => {});
        process.exit(1);
      } else if (reason === DisconnectReason.forbidden) {
        log.error("Error de conexión, escanee nuevamente y ejecute...");
        await fs.promises.rm("./Sessions/Owner", { recursive: true, force: true }).catch(() => {});
        process.exit(1);
      } else if (reason === DisconnectReason.multideviceMismatch) {
        log.warning("Inicia nuevamente");
        await fs.promises.rm("./Sessions/Owner", { recursive: true, force: true }).catch(() => {});
        process.exit(0);
      } else if (reason === DisconnectReason.connectionReplaced) {
        log.warning("Primero cierre la sesión actual...");
        return;
      } else {
        reconexion++;
        if (reconexion > intentos) {
          log.error(`Demasiados reintentos (${intentos}). Reinicia el proceso manualmente.`);
          process.exit(1);
        }
        const delay = Math.min(3000 * reconexion, 30000);
        if (reason === DisconnectReason.connectionLost) log.warning("Se perdió la conexión al servidor, intento reconectarme..");
        else if (reason === DisconnectReason.connectionClosed) log.warning("Conexión cerrada, intentando reconectarse...");
        else if (reason === DisconnectReason.restartRequired) log.warning("Es necesario reiniciar..");
        else if (reason === DisconnectReason.timedOut) log.warning("Tiempo de conexión agotado, intentando reconectarse...");
        else if (reason === DisconnectReason.badSession) log.warning("Eliminar sesión y escanear nuevamente...");
        else log.warning(`Desconexión (${reason}), reconectando...`);
        setTimeout(startBot, delay);
      }
    }

    if (connection === "open") {
      reconexion = 0;
      const userName = sock.user.name || "Desconocido";
      console.log(chalk.green.bold(`[ ✿ ]  Conectado a: ${userName}`));
      warmupGroups(sock);
    }
    if (isNewLogin) log.info("Nuevo dispositivo detectado");
    if (receivedPendingNotifications === true) {
      log.warn("Sincronización inicial completada.");
      sock.ev.flush();
    }
  });

  sock.ev.on('messages.upsert', async (chatUpdate) => {
    try {
      lastActivityTimestamp = Date.now();

      // Bloquear explícitamente cualquier mensaje de sincronización histórica de chat ('append')
      if (chatUpdate.type !== 'notify') return;

      for (const msg of chatUpdate.messages || []) {
        if (msg?.message && msg?.key?.id) {
          const sid = msg.key.remoteJid + ':' + msg.key.id;
          msgStore.set(sid, msg.message);
          if (msgStore.size > msgLimit) msgStore.delete(msgStore.keys().next().value);
        }
        if (msg?.pushName) {
          const senderJid = msg.key.participant || msg.key.remoteJid;
          if (senderJid) setCachedPushName(senderJid, msg.pushName);
        }
      }

      const kay = chatUpdate.messages?.[0];
      if (!kay?.message) return;
      if (kay.key?.remoteJid === 'status@broadcast') return;

      kay.message = Object.keys(kay.message)[0] === 'ephemeralMessage' ? kay.message.ephemeralMessage.message : kay.message;

      // Solo filtrar mensajes generados internamente por el bot (protocolos/status)
      if (kay.key.fromMe) {
        const isBotSent = sock.sentMessageIds && sock.sentMessageIds.has(kay.key.id);
        const isInternalBaileys = kay.key.id.startsWith('BAE5') && kay.key.id.length >= 16;
        if (isBotSent || isInternalBaileys) return;
      }
      
      // No procesar mensajes antiguos de cuando el bot estaba apagado (evitar NaNs)
      const msgTime = Number(kay.messageTimestamp);
      if (!isNaN(msgTime) && msgTime > 0) {
        const messageAge = Math.floor(Date.now() / 1000) - msgTime;
        if (messageAge > 60) return;
      }

      const m = await smsg(sock, kay);
      main(sock, m, chatUpdate);
    } catch (err) {
      Logger.error('Error procesando mensaje', err);
    }
  });
  try {
    await events(sock, null);
  } catch (err) {
    Logger.error('Error al iniciar eventos', err);
  }

  sock.decodeJid = (jid) => {
    if (!jid) return jid;
    if (/:\d+@/gi.test(jid)) {
      const decode = jidDecode(jid) || {};
      return (decode.user && decode.server && decode.user + "@" + decode.server) || jid;
    }
    return jid;
  };
}

setInterval(cleanCache, 1 * 60 * 60 * 1000);
cleanCache();



(async () => {
  db.migrateJSONToSQLite();
  db.clearDB();
  console.log(chalk.gray('[ ✿  ]  Base de datos SQLite cargada, migrada y depurada correctamente.'));
  await initCommands();
  await startBot();
})();

process.on('uncaughtException', (err) => {
  const msg = err?.message || '';
  if (msg.includes('rate-overlimit') || msg.includes('timed out') || msg.includes('Connection Closed')) return;
  Logger.error('[uncaughtException] Fatal error! Estado comprometido:', err);
  if (global.saveDatabase) global.saveDatabase();
  process.exit(1); // Forzar reinicio limpio (ej. vía PM2)
});

process.on('unhandledRejection', (reason) => {
  const msg = String(reason?.message || reason || '');
  if (msg.includes('rate-overlimit') || msg.includes('timed out') || msg.includes('Connection Closed')) return;
  Logger.error('[unhandledRejection] Promesa rechazada no capturada:', reason);
});
