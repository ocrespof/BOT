export default {
  command: ['cita', 'date', 'mimos', 'celos', 'pelearpareja'],
  category: 'profile',
  desc: 'Interacciones y comandos exclusivos para usuarios casados.',
  cooldown: 10,
  run: async (client, m, args, usedPrefix, command) => {
    const db = global.db.data;
    const user = db.users[m.sender];
    const spouseId = user?.marry;
    
    if (!spouseId) return m.reply(`❌ No tienes pareja actualmente. ¡Usa \`${usedPrefix}marry\` para casarte primero!`);
    
    const isRealUser = spouseId.includes('@');
    const spouseName = isRealUser ? (db.users[spouseId]?.name || spouseId.split('@')[0]) : spouseId;
    const mentions = isRealUser ? [m.sender, spouseId] : [m.sender];

    if (['cita', 'date'].includes(command)) {
      // Cooldown exclusivo para citas (1 hora)
      const lastDate = user.lastDate || 0;
      if (Date.now() - lastDate < 3600000) {
        const timeLeft = Math.ceil((3600000 - (Date.now() - lastDate)) / 60000);
        return m.reply(`⏳ Debes esperar ${timeLeft} minutos antes de tener otra cita romántica.`);
      }

      const escenarios = [
        "Fueron a cenar a un restaurante elegante a la luz de las velas 🕯️🍷",
        "Fueron al cine a ver una película de terror y se abrazaron toda la noche 🍿🎬",
        "Fueron al parque de diversiones y ganaron un peluche gigante 🎢🎡",
        "Tuvieron un picnic bajo las estrellas 🌌🍱",
        "Se quedaron en casa jugando videojuegos y pidiendo pizza 🍕🎮",
        "Fueron a la playa a ver el atardecer juntos 🏖️🌅",
        "Visitaron un acuario y se tomaron fotos con los pingüinos 🐧📸",
        "Tuvieron una pequeña discusión por qué lugar visitar, pero se reconciliaron con un helado 🍦❤️"
      ];
      
      const randomScenario = escenarios[Math.floor(Math.random() * escenarios.length)];
      const gainedXp = Math.floor(Math.random() * 500) + 200;
      const gainedCoins = Math.floor(Math.random() * 200) + 50;
      
      user.exp = (user.exp || 0) + gainedXp;
      user.coins = (user.coins || 0) + gainedCoins;
      user.lastDate = Date.now();
      
      if (isRealUser && db.users[spouseId]) {
          db.users[spouseId].exp = (db.users[spouseId].exp || 0) + gainedXp;
          db.users[spouseId].coins = (db.users[spouseId].coins || 0) + gainedCoins;
          db.users[spouseId].lastDate = Date.now();
      }
      
      const recompensaTxt = isRealUser 
        ? `Ambos han ganado *${gainedXp} XP* y *${gainedCoins} Monedas* por fortalecer su relación.` 
        : `Has ganado *${gainedXp} XP* y *${gainedCoins} Monedas* por la hermosa velada.`;
      
      const msg = `💖 *¡CITA ROMÁNTICA!* 💖\n\n@${m.sender.split('@')[0]} y *${spouseName}* han tenido una cita.\n\n${randomScenario}\n\n🎁 ${recompensaTxt}`;
      return client.sendMessage(m.chat, { text: msg, mentions }, { quoted: m });
    }

    if (command === 'mimos') {
      const msg = `🥰 @${m.sender.split('@')[0]} se acurrucó con *${spouseName}* y le dio muchos mimos y besitos. ¡Qué tiernos! 💕`;
      return client.sendMessage(m.chat, { text: msg, mentions }, { quoted: m });
    }

    if (command === 'celos') {
      const msg = `😤 @${m.sender.split('@')[0]} le hizo una escena de celos a *${spouseName}* porque alguien más le dio like a su foto. ¡Tóxicos pero felices! 🚩❤️`;
      return client.sendMessage(m.chat, { text: msg, mentions }, { quoted: m });
    }

    if (command === 'pelearpareja') {
      const escenariosPelea = [
        "por no lavar los platos de anoche 🍽️😠",
        "porque uno se comió el último trozo de pizza 🍕🤬",
        "por culpa de un malentendido con un mensaje de texto 📱🙄",
        "porque alguien no bajó la tapa del inodoro 🚽🤦‍♂️",
        "por decidir qué serie ver en Netflix 📺🥊"
      ];
      const motivo = escenariosPelea[Math.floor(Math.random() * escenariosPelea.length)];
      const msg = `🥊 *¡PROBLEMAS EN EL PARAÍSO!* 🥊\n\n@${m.sender.split('@')[0]} y *${spouseName}* están peleando ${motivo}.\n\n_(Seguro se reconcilian en 5 minutos...)_`;
      return client.sendMessage(m.chat, { text: msg, mentions }, { quoted: m });
    }
  }
};
