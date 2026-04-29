import config from '../../config.js';

let isNumber = (x) => typeof x === 'number' && !isNaN(x)

function initDB(m, client) {
  const jid = client.user.id.split(':')[0] + '@s.whatsapp.net'

  const settings = global.db.data.settings[jid] ||= {}
  settings.self ??= false
  settings.prefix ??= ['/', '!', '.', '#']
  settings.commandsejecut ??= isNumber(settings.commandsejecut) ? settings.commandsejecut : 0
  settings.id ??= config.my.ch || '120363401404146384@newsletter'
  settings.nameid ??= "'ೃ࿔ Pinkanema.ೃ࿐"
  settings.link ??= config.links.api || 'https://api.yuki-wabot.my.id'
  settings.banner ??= 'https://vignette.wikia.nocookie.net/mlp/images/1/17/Pinkie_Pie_starts_rapping_EGS1.png/revision/latest?cb=20170811024135'
  settings.icon ??= 'https://cdn.twibooru.org/img/2024/3/1/3173192/medium.jpeg'
  settings.currency ??= 'Yenes'
  settings.namebot ??= config.my.name || 'PinkieBot'
  settings.botname ??= config.my.name || 'PinkieBot'
  settings.owner ??= ''

  const user = global.db.data.users[m.sender] ||= {}
  user.name ??= m.pushName
  user.usedcommands = isNumber(user.usedcommands) ? user.usedcommands : 0

  const chat = global.db.data.chats[m.chat] ||= {}
  chat.users ||= {}
  chat.isBanned ??= false
  chat.alerts ??= true
  chat.adminonly ??= false
  chat.primaryBot ??= null
  chat.antilinks ??= true

  chat.users[m.sender] ||= {}
  chat.users[m.sender].stats ||= {}
  chat.users[m.sender].usedTime ??= null
  chat.users[m.sender].lastCmd = isNumber(chat.users[m.sender].lastCmd) ? chat.users[m.sender].lastCmd : 0
  chat.users[m.sender].afk = isNumber(chat.users[m.sender].afk) ? chat.users[m.sender].afk : -1
  chat.users[m.sender].afkReason ??= ''
}

export default initDB;
