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

  // ── Usuario Global (XP, nivel, economía, perfil) ──
  const user = global.db.data.users[m.sender] ||= {}
  user.name ??= m.pushName
  user.usedcommands = isNumber(user.usedcommands) ? user.usedcommands : 0
  // Economía global
  user.coins = isNumber(user.coins) ? user.coins : 0
  user.bank = isNumber(user.bank) ? user.bank : 0
  user.health = isNumber(user.health) ? user.health : 100
  // XP y nivel
  user.exp = isNumber(user.exp) ? user.exp : 0
  user.level = isNumber(user.level) ? user.level : 0
  // Cooldowns globales
  user.lastdaily ??= 0
  user.lastweekly ??= 0
  user.lastmonthly ??= 0
  user.lastwork ??= 0
  user.lastcrime ??= 0
  user.lastmine ??= 0
  user.lasthunt ??= 0
  user.lastfish ??= 0
  user.lastslut ??= 0
  user.laststeal ??= 0
  user.lastadventure ??= 0
  user.lastdungeon ??= 0
  user.lastinvoke ??= 0
  user.lastppt ??= 0
  user.lastslot ??= 0
  user.lastApuesta ??= 0
  // Inventario
  user.inventory ??= []
  // Streaks
  user.streak ??= 0
  user.lastDailyGlobal ??= 0
  user.weeklyStreak ??= 0
  user.lastWeeklyGlobal ??= 0
  user.monthlyStreak ??= 0
  user.lastMonthlyGlobal ??= 0

  // ── Chat/Grupo ──
  const chat = global.db.data.chats[m.chat] ||= {}
  chat.users ||= {}
  chat.isBanned ??= false
  chat.alerts ??= true
  chat.adminonly ??= false
  chat.primaryBot ??= null
  chat.antilinks ??= true
  chat.economy ??= true

  chat.users[m.sender] ||= {}
  chat.users[m.sender].stats ||= {}
  chat.users[m.sender].usedTime ??= null
  chat.users[m.sender].lastCmd = isNumber(chat.users[m.sender].lastCmd) ? chat.users[m.sender].lastCmd : 0
}

export default initDB;
