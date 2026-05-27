import path from 'path'
import fs from 'fs'
import Logger from '../../utils/logger.js'

// Native argv parsing — eliminates yargs dependency
global.opts = Object.fromEntries(
  process.argv.slice(2).filter(a => a.startsWith('--')).map(a => {
    const [k, v] = a.slice(2).split('=');
    return [k, v ?? true];
  })
);

// Native debounce — eliminates lodash dependency
function debounce(fn, wait, { maxWait = 0 } = {}) {
  let timerId = null, lastCallTime = 0;
  return function (...args) {
    const now = Date.now();
    if (!lastCallTime) lastCallTime = now;
    clearTimeout(timerId);
    if (maxWait > 0 && now - lastCallTime >= maxWait) {
      lastCallTime = now;
      return fn.apply(this, args);
    }
    timerId = setTimeout(() => {
      lastCallTime = 0;
      fn.apply(this, args);
    }, wait);
  };
}

const dbDir = path.join(process.cwd(), 'core')
const partitions = {
  users: path.join(dbDir, 'db_users.json'),
  chats: path.join(dbDir, 'db_chats.json'),
  settings: path.join(dbDir, 'db_settings.json'),
}
// Legacy monolithic file — used for migration only
const legacyFile = path.join(dbDir, 'database.json')

export const db = {
  data: {
    users: {},
    chats: {},
    settings: {},
    stickerspack: {}
  },
  READ: false,
  _snapshots: { users: '{}', chats: '{}', settings: '{}' },
  isDirty: false,
  dirtyPartitions: { users: true, chats: true, settings: true }
}
global.db = db
global.DATABASE = db

export function markPartitionDirty(partition) {
  if (global.db && global.db.dirtyPartitions) {
    global.db.dirtyPartitions[partition] = true;
    global.db.isDirty = true;
  }
}
global.markPartitionDirty = markPartitionDirty;

export function loadDatabase() {
  if (global.db.READ) return global.db.data
  global.db.READ = true

  // Try loading from partitioned files first
  for (const [key, filePath] of Object.entries(partitions)) {
    if (fs.existsSync(filePath)) {
      try {
        const fileContent = fs.readFileSync(filePath, 'utf8').trim()
        if (!fileContent) throw new Error('Empty database file')
        global.db.data[key] = JSON.parse(fileContent)
      } catch (err) {
        Logger.error(`[DB] Archivo corrupto detectado en: ${filePath}. Error: ${err.message}`)
        
        // Intentar cargar desde respaldo (.bak)
        const backupPath = filePath + '.bak'
        if (fs.existsSync(backupPath)) {
          try {
            Logger.warn(`[DB] Intentando restaurar desde el respaldo: ${backupPath}`)
            const backupContent = fs.readFileSync(backupPath, 'utf8').trim()
            if (!backupContent) throw new Error('Empty backup file')
            global.db.data[key] = JSON.parse(backupContent)
            
            // Si funciona, restauramos el archivo principal con el respaldo
            fs.copyFileSync(backupPath, filePath)
            Logger.info(`[DB] Restauración exitosa. Se recuperaron los datos de la partición '${key}'.`)
            continue
          } catch (bakErr) {
            Logger.error(`[DB] El archivo de respaldo también está corrupto o vacío: ${backupPath}`)
          }
        }
        
        // Si no hay respaldo o falló, renombramos el corrupto para preservarlo y lanzamos error fatal
        const corruptPath = filePath + '.corrupt'
        try {
          fs.renameSync(filePath, corruptPath)
          Logger.warn(`[DB] Archivo corrupto renombrado a: ${corruptPath}`)
        } catch {}
        
        Logger.error(`[DB] ERROR FATAL: No se pudo cargar ni recuperar la partición de base de datos '${key}'. El bot se detendrá para proteger tus datos.`)
        process.exit(1)
      }
    }
  }

  // Fallback: migrate from legacy monolithic database.json
  const partitionsExist = Object.values(partitions).some(fp => fs.existsSync(fp))
  if (!partitionsExist && fs.existsSync(legacyFile)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(legacyFile, 'utf8'))
      global.db.data = Object.assign(global.db.data, parsed)
      Logger.info('[DB] Migrated from legacy database.json to partitioned files.')
      global.db.isDirty = true
    } catch (err) {
      Logger.error('[DB] Error al migrar desde database.json legacy:', err)
    }
  }

  global.db.READ = false
  
  // Take initial snapshots
  for (const key of Object.keys(partitions)) {
    global.db._snapshots[key] = JSON.stringify(global.db.data[key] || {})
    global.db.dirtyPartitions[key] = false
  }
  global.db.isDirty = false
  return global.db.data
}
global.loadDatabase = loadDatabase

let isSaving = false
export async function saveDatabaseAsync() {
  if (isSaving) return
  if (!global.db.isDirty) return // Skip completely if not dirty
  isSaving = true
  try {
    for (const [key, filePath] of Object.entries(partitions)) {
      if (!global.db.dirtyPartitions[key]) continue // Skip unchanged partitions
      const dataStr = JSON.stringify(global.db.data[key])
      if (global.db._snapshots[key] === dataStr) {
        global.db.dirtyPartitions[key] = false
        continue // Skip if snapshot matches
      }
      const tmpFile = filePath + '.tmp'
      await fs.promises.writeFile(tmpFile, dataStr)
      // Save a backup .bak before replacing the main file
      if (fs.existsSync(filePath)) {
        await fs.promises.copyFile(filePath, filePath + '.bak').catch(() => {});
      }
      await fs.promises.rename(tmpFile, filePath)
      global.db._snapshots[key] = dataStr
      global.db.dirtyPartitions[key] = false
    }
    global.db.isDirty = Object.values(global.db.dirtyPartitions).some(Boolean)
  } catch (error) {
    Logger.error("Error al guardar particiones de BD", error)
  } finally {
    isSaving = false
  }
}
global.saveDatabaseAsync = saveDatabaseAsync

export function saveDatabase() {
  if (!global.db.isDirty) return // Skip completely if not dirty
  for (const [key, filePath] of Object.entries(partitions)) {
    if (!global.db.dirtyPartitions[key]) continue // Skip unchanged partitions
    const dataStr = JSON.stringify(global.db.data[key])
    if (global.db._snapshots[key] === dataStr) {
      global.db.dirtyPartitions[key] = false
      continue
    }
    const tmpFile = filePath + '.tmp'
    fs.writeFileSync(tmpFile, dataStr)
    // Save a backup .bak before replacing the main file
    if (fs.existsSync(filePath)) {
      try { fs.copyFileSync(filePath, filePath + '.bak'); } catch {}
    }
    fs.renameSync(tmpFile, filePath)
    global.db._snapshots[key] = dataStr
    global.db.dirtyPartitions[key] = false
  }
  global.db.isDirty = Object.values(global.db.dirtyPartitions).some(Boolean)
}
global.saveDatabase = saveDatabase

// Queue save function triggered by main.js — debounced to reduce writes
export const queueSaveDatabase = debounce(async () => {
  await saveDatabaseAsync()
}, 10000, { maxWait: 60000 })
global.queueSaveDatabase = queueSaveDatabase

function limpiarRolls() {
  try {
    const chats = global.db.data.chats
    const now = Date.now()
    for (const chatId of Object.keys(chats)) {
      const chat = chats[chatId]
      if (!chat.rolls || typeof chat.rolls !== 'object') {
        chat.rolls = {}
        continue
      }
      for (const msgId of Object.keys(chat.rolls)) {
        const roll = chat.rolls[msgId]
        const expirado = roll.expiresAt && now > roll.expiresAt
        const reclamado = roll.claimed === true
        if (expirado || reclamado) {
          delete chat.rolls[msgId]
        }
      }
    }
  } catch (e) {
    Logger.error('[DB] Error limpiando rolls', e)
  }
}

// Garbage collection — runs once on startup, removes stale data
function garbageCollect() {
  const now = Date.now()
  const NINETY_DAYS = 90 * 24 * 60 * 60 * 1000
  let cleaned = 0
  
  // Remove users inactive > 90 days with 0 coins, 0 exp, no inventory
  for (const [jid, user] of Object.entries(global.db.data.users)) {
    const lastActivity = user.lastDailyGlobal || user.lastdaily || 0
    if (now - lastActivity > NINETY_DAYS && (user.exp || 0) === 0 && (user.coins || 0) === 0 && !(user.inventory?.length)) {
      delete global.db.data.users[jid]
      cleaned++
    }
  }
  
  if (cleaned > 0) Logger.info(`[GC] Cleaned ${cleaned} inactive user records.`)
  limpiarRolls()
}

// Run GC 30 seconds after startup
setTimeout(garbageCollect, 30000)
// Run roll cleaner every 30 minutes
setInterval(limpiarRolls, 30 * 60 * 1000)

export default db