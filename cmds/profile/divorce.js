export default {
  command: ['divorce'],
  category: 'profile',
  desc: 'Divorciarte de tu pareja.',
  run: async (client, m) => {
    const db = global.db.data
    const userId = m.sender
    const partnerId = db.users[userId]?.marry
    if (!partnerId) return m.reply(' Tú no estás casado con nadie.')
    db.users[userId].marry = ''
    
    // Si la pareja es un usuario real, también le quitamos el estado
    if (partnerId.includes('@') && db.users[partnerId]) {
      db.users[partnerId].marry = ''
    }
    
    const partnerName = partnerId.includes('@') ? (db.users[partnerId]?.name || partnerId.split('@')[0]) : partnerId;
    return m.reply(`*${db.users[userId]?.name || userId.split('@')[0]}* te has divorciado de *${partnerName}*.`)
  },
};