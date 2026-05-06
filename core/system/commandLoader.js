import fs from "fs";
import path from "path";
import chalk from "chalk";
import { fileURLToPath, pathToFileURL } from "url";
import Logger from "../../utils/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
global.comandos = new Map();
global.plugins = {};
const pluginCache = new Map();
const commandsFolder = path.join(__dirname, "../../cmds");

// Shared registration logic — used by both initial load and hot-reload
function registerPlugin(imported, pluginName) {
  const comando = imported.default;
  const pluginObj = { ...imported };
  Object.defineProperty(pluginObj, 'priority', {
    value: imported.priority || comando?.priority || 0,
    writable: true, enumerable: true, configurable: true
  });
  global.plugins[pluginName] = pluginObj;
  
  if (!comando?.command || typeof comando.run !== 'function') return;
  
  const cmds = Array.isArray(comando.command) ? comando.command : [comando.command];
  for (const cmd of cmds) {
    if (cmd) global.comandos.set(cmd.toLowerCase(), {
      pluginName,
      run: comando.run,
      category: comando.category || 'uncategorized',
      isOwner: comando.isOwner || false,
      isAdmin: comando.isAdmin || false,
      botAdmin: comando.botAdmin || false,
      isPrivate: comando.isPrivate || false,
      economy: comando.economy || false,
      desc: comando.desc || comando.description || '',
      usage: comando.usage || '',
      cooldown: comando.cooldown || 0,
      before: imported.before || null,
      after: imported.after || null,
      info: comando.info || {}
    });
  }
}

async function seeCommands(dir = commandsFolder) {
  const items = fs.readdirSync(dir);
  for (const fileOrFolder of items) {
    const fullPath = path.join(dir, fileOrFolder);
    if (fs.lstatSync(fullPath).isDirectory()) {
      await seeCommands(fullPath);
      continue;
    }
    if (!fileOrFolder.endsWith(".js")) continue;
    try {
      const mtime = fs.statSync(fullPath).mtimeMs;
      const cached = pluginCache.get(fullPath);
      let imported;
      if (cached && cached.mtime === mtime) {
        imported = cached.imported;
      } else {
        const modulePath = `${pathToFileURL(path.resolve(fullPath)).href}?update=${Date.now()}`;
        imported = await import(modulePath);
        pluginCache.set(fullPath, { mtime, imported });
      }
      const pluginName = fileOrFolder.replace(".js", "");
      registerPlugin(imported, pluginName);
    } catch (e) {
      Logger.error(`Error en el plugin ${fileOrFolder}`, e);
    }
  }
  if (dir === commandsFolder) {
    console.log(chalk.cyanBright(`[ ℹ ] Total de comandos registrados: ${global.comandos.size}`));
  }
}

const debounceMap = new Map();
global.reload = async (_ev, fullPath) => {
  if (!fullPath.endsWith(".js")) return;
  if (debounceMap.has(fullPath)) clearTimeout(debounceMap.get(fullPath));
  debounceMap.set(fullPath, setTimeout(async () => {
    debounceMap.delete(fullPath);
    const filename = path.basename(fullPath);
    if (!fs.existsSync(fullPath)) {
      Logger.warn(`Plugin eliminado: ${filename}`);
      pluginCache.delete(fullPath);
      const pluginName = filename.replace(".js", "");
      for (const [cmd, data] of global.comandos.entries()) {
        if (data.pluginName === pluginName) global.comandos.delete(cmd);
      }
      delete global.plugins[pluginName];
      return;
    }
    try {
      const mtime = fs.statSync(fullPath).mtimeMs;
      const cached = pluginCache.get(fullPath);
      if (cached && cached.mtime === mtime) {
        // Logger.debug(`Sin cambios: ${filename}`);
        return;
      }
      const modulePath = `${pathToFileURL(path.resolve(fullPath)).href}?update=${Date.now()}`;
      const imported = await import(modulePath);
      pluginCache.set(fullPath, { mtime, imported });
      const pluginName = filename.replace(".js", "");
      // Remove old commands for this plugin
      for (const [cmd, data] of global.comandos.entries()) {
        if (data.pluginName === pluginName) global.comandos.delete(cmd);
      }
      registerPlugin(imported, pluginName);
      Logger.success(`Plugin recargado: ${filename}`);
    } catch (e) {
      Logger.error(`Error al recargar ${filename}`, e);
    }
  }, 300));
};

Object.freeze(global.reload);
const watchers = [];
function startWatcher() {
  for (const w of watchers) { try { w.close(); } catch {} }
  watchers.length = 0;
  function watchDir(dir) {
    try {
      const w = fs.watch(dir, (event, filename) => {
        if (filename && filename.endsWith('.js')) global.reload(event, path.join(dir, filename));
      });
      watchers.push(w);
      for (const item of fs.readdirSync(dir)) {
        const full = path.join(dir, item);
        if (fs.lstatSync(full).isDirectory()) watchDir(full);
      }
    } catch {}
  }
  watchDir(commandsFolder);
}
startWatcher();

// Auto-limpieza para carpetas eliminadas
setInterval(async () => {
  for (const fullPath of pluginCache.keys()) {
    try {
      await fs.promises.access(fullPath);
    } catch {
      global.reload('rename', fullPath);
    }
  }
}, 10000);

export default seeCommands;
