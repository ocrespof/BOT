import path from 'path'
import fs from 'fs'
import _ from 'lodash'
import yargs from 'yargs/yargs'
import Logger from '../../utils/logger.js'

global.opts = Object(yargs(process.argv.slice(2)).exitProcess(false).parse())

const dbDir = path.join(process.cwd(), 'core')
const partitions = {
  users: path.join(dbDir, 'db_users.json'),
  chats: path.join(dbDir, 'db_chats.json'),
  settings: path.join(dbDir, 'db_settings.json'),
}
// Legacy monolithic file — used for migration only
const legacyFile = path.join(dbDir, 'database.json')

global.db = {
  data: {
    users: {},
    chats: {},
    settings: {},
    characters: {},
    stickerspack: {}
  },
  chain: null,
  READ: false,
  _snapshots: { users: '{}', chats: '{}', settings: '{}' }
}
global.DATABASE = global.db

global.loadDatabase = function loadDatabase() {
  if (global.db.READ) return global.db.data
  global.db.READ = true

  // 1. Try loading from partitioned files first
  let loaded = false
  for (const [key, filePath] of Object.entries(partitions)) {
    if (fs.existsSync(filePath)) {
      try {
        global.db.data[key] = JSON.parse(fs.readFileSync(filePath, 'utf8'))
        loaded = true
      } catch {}
    }
  }

  // 2. Fallback: migrate from legacy monolithic database.json
  if (!loaded && fs.existsSync(legacyFile)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(legacyFile, 'utf8'))
      global.db.data = Object.assign(global.db.data, parsed)
      Logger.info('[DB] Migrated from legacy database.json to partitioned files.')
    } catch {}
  }

  global.db.chain = _.chain(global.db.data)
  global.db.READ = false
  
  // Take initial snapshots
  for (const key of Object.keys(partitions)) {
    global.db._snapshots[key] = JSON.stringify(global.db.data[key])
  }
  return global.db.data
}

let isSaving = false
global.saveDatabaseAsync = async function saveDatabaseAsync() {
  if (isSaving) return
  isSaving = true
  try {
    for (const [key, filePath] of Object.entries(partitions)) {
      const dataStr = JSON.stringify(global.db.data[key])
      if (global.db._snapshots[key] === dataStr) continue // Skip unchanged partitions
      const tmpFile = filePath + '.tmp'
      await fs.promises.writeFile(tmpFile, dataStr)
      await fs.promises.rename(tmpFile, filePath)
      global.db._snapshots[key] = dataStr
    }
  } catch (error) {
    Logger.error("Error al guardar particiones de BD", error)
  } finally {
    isSaving = false
  }
}

global.saveDatabase = function saveDatabase() {
  for (const [key, filePath] of Object.entries(partitions)) {
    const dataStr = JSON.stringify(global.db.data[key])
    if (global.db._snapshots[key] === dataStr) continue
    const tmpFile = filePath + '.tmp'
    fs.writeFileSync(tmpFile, dataStr)
    fs.renameSync(tmpFile, filePath)
    global.db._snapshots[key] = dataStr
  }
}

// Queue save function triggered by main.js — debounced to reduce writes
global.queueSaveDatabase = _.debounce(async () => {
  await global.saveDatabaseAsync()
}, 10000, { maxWait: 60000 })

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
}

// Run GC 30 seconds after startup
setTimeout(garbageCollect, 30000)

export default global.db