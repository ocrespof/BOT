import { xpRange, findLevel } from './tools.js';
import { checkAchievements } from '../cmds/economia/rpg_adventure.js';


export default async (m) => {
  const user = global.db.data.users[m.sender]
  const before = user.level
  const currentLevel = findLevel(user.exp, global.multiplier)

  if (currentLevel > before) {
    user.level = currentLevel
    const coinBonus = Math.floor(Math.random() * (8000 - 5000 + 1)) + 5000
    const expBonus = Math.floor(Math.random() * (500 - 100 + 1)) + 100
    if (user.level % 5 === 0) {
      user.coins = (user.coins || 0) + coinBonus
      user.exp = (user.exp || 0) + expBonus
    }
    const { min, max } = xpRange(user.level, global.multiplier)
    user.minxp = min
    user.maxxp = max
    // Auto-check achievements on level up
    checkAchievements(m.sender)
  }
}
