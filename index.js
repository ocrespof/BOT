import "./settings.js";
import main from './main.js';
import events from './cmds/main/events.js';
import { Browsers, makeWASocket, makeCacheableSignalKeyStore, useMultiFileAuthState, fetchLatestBaileysVersion, jidDecode, DisconnectReason } from "@whiskeysockets/baileys";
import cfonts from 'cfonts';
import pino from "pino";
import qrcode from "qrcode-terminal";
import chalk from "chalk";
import fs from "fs";
import path from "path";
import readlineSync from "readline-sync";
import os from "os";
import NodeCache from "node-cache";
import { smsg } from "./core/message.js";
import db from "./core/system/database.js";
import { exec } from "child_process";

const log = {
  info: (msg) => console.log(chalk.bgBlue.white.bold(`INFO`), chalk.white(msg)),
  success: (msg) => console.log(chalk.bgGreen.white.bold(`SUCCESS`), chalk.greenBright(msg)),
  warn: (msg) => console.log(chalk.bgYellowBright.blueBright.bold(`WARNING`), chalk.yellow(msg)),
  warning: (msg) => console.log(chalk.bgYellowBright.red.bold(`WARNING`), chalk.yellow(msg)),
  error: (msg) => console.log(chalk.bgRed.white.bold(`ERROR`), chalk.redBright(msg))
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
console.log(chalk.magentaBright('\n❀ Iniciando...'))
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
global.conns = global.conns || [];
const reconnecting = new Set();
const msgRetryCounterCache = new NodeCache();

async function cleanCache() {
  try {
    const tmpFolder = './tmp';
    if (fs.existsSync(tmpFolder)) {
      const files = await fs.promises.readdir(tmpFolder);
      let cleaned = 0;
      for (const file of files) {
        try { await fs.promises.unlink(path.join(tmpFolder, file)); cleaned++; } catch {}
      }
      if (cleaned > 0) console.log(chalk.gray(`[ 🗑️ ] Cache tmp: ${cleaned} archivos eliminados`));
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
          } catch {}
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
              try { await fs.promises.unlink(filePath); } catch {}
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

let opcion;
if (methodCodeQR) {
  opcion = "1";
} else if (methodCode) {
  opcion = "2";
} else if (!fs.existsSync("./Sessions/Owner/creds.json")) {
  opcion = readlineSync.question(chalk.bold.white("\nSeleccione una opción:\n") + chalk.blueBright("1. Con código QR\n") + chalk.cyan("2. Con código de texto de 8 dígitos\n--> "));
  while (!/^[1-2]$/.test(opcion)) {
    console.log(chalk.bold.redBright(`No se permiten numeros que no sean 1 o 2, tampoco letras o símbolos especiales.`));
    opcion = readlineSync.question("--> ");
  }
  if (opcion === "2") {
    console.log(chalk.bold.redBright(`\nPor favor, Ingrese el número de WhatsApp.\n${chalk.bold.yellowBright("Ejemplo: +57301******")}\n${chalk.bold.magentaBright('---> ')}`));
    phoneInput = readlineSync.question("");
    phoneNumber = normalizePhoneForPairing(phoneInput);
  }
}

let reconexion = 0;
const intentos = 15;
async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState(global.sessionName);
  const { version } = await fetchLatestBaileysVersion();
  const logger = pino({ level: "silent" });
  console.info = () => {};
  console.debug = () => {};
  const sock = makeWASocket({
    version,
    logger,
    printQRInTerminal: false,
    browser: ['Ubuntu', 'Chrome', '20.0.04'],
    auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, logger) },
    msgRetryCounterCache,
    markOnlineOnConnect: false,
    generateHighQualityLinkPreview: false,
    syncFullHistory: false,
    getMessage: async () => "",
    defaultQueryTimeoutMs: undefined,
    emitOwnEvents: true,
    keepAliveIntervalMs: 25000,
  });
  global.client = sock;
  sock.isInit = false;
  sock.ev.on("creds.update", saveCreds);

  if (opcion === "2" && !fs.existsSync("./Sessions/Owner/creds.json")) {
    setTimeout(async () => {
      try {
        if (!state.creds.registered) {
          const pairing = await global.client.requestPairingCode(phoneNumber);
          const codeBot = pairing?.match(/.{1,4}/g)?.join("-") || pairing;
          console.log(chalk.bold.white(chalk.bgMagenta(`Código de emparejamiento:`)), chalk.bold.white(chalk.white(codeBot)));
        }
      } catch (err) {
        console.log(chalk.red("Error al generar código:"), err);
      }
    }, 3000);
  }

  sock.sendText = (jid, text, quoted = "", options) => sock.sendMessage(jid, { text, ...options }, { quoted });
  sock.ev.on("connection.update", async (update) => {
    const { qr, connection, lastDisconnect, isNewLogin, receivedPendingNotifications } = update;
    if (qr != 0 && qr != undefined || methodCodeQR) {
      if (opcion == '1' || methodCodeQR) {
        console.log(chalk.green.bold("[ ✿ ] Escanea este código QR"));
        qrcode.generate(qr, { small: true });
      }
    }

    if (connection === "close") {
      const reason = lastDisconnect?.error?.output?.statusCode || 0;
      if (reason === DisconnectReason.loggedOut) {
        log.warning("Escanee nuevamente y ejecute...");
        exec("rm -rf ./Sessions/Owner/*");
        process.exit(1);
      } else if (reason === DisconnectReason.forbidden) {
        log.error("Error de conexión, escanee nuevamente y ejecute...");
        exec("rm -rf ./Sessions/Owner/*");
        process.exit(1);
      } else if (reason === DisconnectReason.multideviceMismatch) {
        log.warning("Inicia nuevamente");
        exec("rm -rf ./Sessions/Owner/*");
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
    }
    if (isNewLogin) log.info("Nuevo dispositivo detectado");
    if (receivedPendingNotifications === true) {
      log.warn("Por favor espere aproximadamente 1 minuto...");
      sock.ev.flush();
    }
  });

  sock.ev.on('messages.upsert', async (chatUpdate) => {
    try {
      const kay = chatUpdate.messages[0];
      if (!kay?.message) return;
      if (kay.key?.remoteJid === 'status@broadcast') return;
      kay.message = Object.keys(kay.message)[0] === 'ephemeralMessage' ? kay.message.ephemeralMessage.message : kay.message;
      if (kay.key.fromMe && kay.key.id.startsWith('3EB0')) return;
      const m = await smsg(sock, kay);
      main(sock, m, chatUpdate);
    } catch (err) {
      console.log(log.error('Error:'), err);
    }
  });
  try {
    await events(sock, null);
  } catch (err) {
    console.log(chalk.gray(`[ BOT  ]  → ${err}`));
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
global.loadDatabase()
console.log(chalk.gray('[ ✿  ]  Base de datos cargada correctamente.'))
await startBot();
})();

process.on('uncaughtException', (err) => {
  const msg = err?.message || '';
  if (msg.includes('rate-overlimit') || msg.includes('timed out') || msg.includes('Connection Closed')) return;
  console.error(chalk.red('[uncaughtException]'), msg.slice(0, 120));
});

process.on('unhandledRejection', (reason) => {
  const msg = String(reason?.message || reason || '');
  if (msg.includes('rate-overlimit') || msg.includes('timed out') || msg.includes('Connection Closed')) return;
  console.error(chalk.red('[unhandledRejection]'), msg.slice(0, 120));
});
