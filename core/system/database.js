import path from 'path'
import fs from 'fs'
import _ from 'lodash'
import yargs from 'yargs/yargs'
import Logger from '../../utils/logger.js'

global.opts = Object(yargs(process.argv.slice(2)).exitProcess(false).parse())

const dbFile = path.join(process.cwd(), 'core', 'database.json')

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
  _snapshot: '{}'
}
global.DATABASE = global.db
global.loadDatabase = function loadDatabase() {
  if (global.db.READ) return global.db.data
  global.db.READ = true
  
  if (fs.existsSync(dbFile)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(dbFile, 'utf8'))
      global.db.data = Object.assign(global.db.data, parsed)
    } catch {}
  }
  global.db.chain = _.chain(global.db.data)
  global.db.READ = false
  global.db._snapshot = JSON.stringify(global.db.data)
  return global.db.data
}

function hasPendingChanges(newDataStr) {
  return global.db._snapshot !== newDataStr
}

let isSaving = false
global.saveDatabaseAsync = async function saveDatabaseAsync() {
  if (isSaving) return
  const dataStr = JSON.stringify(global.db.data, null, 2)
  if (!hasPendingChanges(dataStr)) return
  
  isSaving = true
  try {
    const tmpFile = dbFile + '.tmp'
    await fs.promises.writeFile(tmpFile, dataStr)
    await fs.promises.rename(tmpFile, dbFile)
    global.db._snapshot = dataStr
  } catch (error) {
    Logger.error("Error al guardar database.json", error)
  } finally {
    isSaving = false
  }
}

global.saveDatabase = function saveDatabase() {
  const dataStr = JSON.stringify(global.db.data, null, 2)
  if (!hasPendingChanges(dataStr)) return
  const tmpFile = dbFile + '.tmp'
  fs.writeFileSync(tmpFile, dataStr)
  fs.renameSync(tmpFile, dbFile)
  global.db._snapshot = dataStr
}

// Queue save function triggered by main.js
global.queueSaveDatabase = _.debounce(async () => {
  await global.saveDatabaseAsync()
}, 10000, { maxWait: 60000 })

export default global.db