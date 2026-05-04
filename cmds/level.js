import { xpRange, canLevelUp } from '../utils/tools.js';
import { checkAchievements } from './economia/achievements.js';


export default async (m) => {
  const user = global.db.data.users[m.sender]
  let before = user.level
  while (canLevelUp(user.level, user.exp, global.multiplier)) {
    user.level++
  }
  if (before !== user.level) {
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