import path from 'path'
import fs from 'fs'
import _ from 'lodash'
import yargs from 'yargs/yargs'

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

global.saveDatabaseAsync = async function saveDatabaseAsync() {
  const dataStr = JSON.stringify(global.db.data, null, 2)
  if (!hasPendingChanges(dataStr)) return
  
  try {
    await fs.promises.writeFile(dbFile, dataStr)
    global.db._snapshot = dataStr
  } catch (error) {
    console.error("Error al guardar database.json: ", error)
  }
}

global.saveDatabase = function saveDatabase() {
  const dataStr = JSON.stringify(global.db.data, null, 2)
  if (!hasPendingChanges(dataStr)) return
  fs.writeFileSync(dbFile, dataStr)
  global.db._snapshot = dataStr
}

let isSaving = false
setInterval(async () => {
  if (isSaving) return;
  isSaving = true
  await global.saveDatabaseAsync()
  isSaving = false
}, 30000)

export default global.db