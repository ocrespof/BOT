import axios from 'axios';
import https from 'https';

async function fetchGifUrl(query) {
  try {
    const tenorKey = 'LIVDSRZULELA';
    const agent = new https.Agent({ rejectUnauthorized: false });
    const res = await axios.get(`https://api.tenor.com/v1/search`, {
      params: { key: tenorKey, q: query, limit: 10 },
      timeout: 10000,
      httpsAgent: agent
    });

    if (!res.data?.results?.length) return null;
    const randomGif = res.data.results[Math.floor(Math.random() * res.data.results.length)];
    const media = randomGif.media?.[0];
    return media?.mp4?.url || media?.tinymp4?.url || null;
  } catch (error) {
    return null;
  }
}

export default {
  command: ['cita', 'date', 'mimos', 'celos', 'pelearpareja', 'regalo', 'desayuno', 'haceramor', 'abrazarpareja', 'besarpareja'],
  category: 'profile',
  desc: 'Interacciones románticas y divertidas exclusivas para parejas.',
  cooldown: 10,
  run: async (client, m, args, usedPrefix, command) => {
    const db = global.db.data;
    const user = db.users[m.sender];
    const spouseId = user?.marry;
    
    if (!spouseId) return m.reply(`❌ No tienes pareja actualmente. ¡Usa \`${usedPrefix}marry\` para casarte primero!`);
    
    const isRealUser = spouseId.includes('@');
    const spouseName = isRealUser ? (db.users[spouseId]?.name || spouseId.split('@')[0]) : spouseId;
    const mentions = isRealUser ? [m.sender, spouseId] : [m.sender];
    const fromName = user.name || m.sender.split('@')[0];

    let caption = '';
    let gifQuery = '';

    if (['cita', 'date'].includes(command)) {
      const lastDate = user.lastDate || 0;
      if (Date.now() - lastDate < 3600000) {
        const timeLeft = Math.ceil((3600000 - (Date.now() - lastDate)) / 60000);
        return m.reply(`⏳ Debes esperar ${timeLeft} minutos antes de tener otra cita.`);
      }

      const escenarios = [
        "Fueron a cenar a la luz de las velas 🕯️", "Caminaron por la playa al atardecer 🏖️",
        "Vieron una película abrazados 🍿", "Tuvieron un picnic bajo las estrellas 🌌"
      ];
      const randomScenario = escenarios[Math.floor(Math.random() * escenarios.length)];
      const gainedXp = Math.floor(Math.random() * 500) + 200;
      user.exp = (user.exp || 0) + gainedXp;
      user.lastDate = Date.now();
      if (isRealUser && db.users[spouseId]) db.users[spouseId].exp = (db.users[spouseId].exp || 0) + gainedXp;

      caption = `💖 *¡CITA ROMÁNTICA!* 💖\n\n@${m.sender.split('@')[0]} y *${spouseName}* ${randomScenario}.\n🎁 Ambos ganaron *${gainedXp} XP*.`;
      gifQuery = "anime couple date";
    }

    else if (command === 'mimos') {
      caption = `🥰 *${fromName}* está dándole muchos mimos y cariñitos a *${spouseName}*. ¡Qué viva el amor! 💕`;
      gifQuery = "anime couple sweet";
    }

    else if (command === 'celos') {
      caption = `😤 *${fromName}* se puso celos@ de *${spouseName}*... ¡Alguien necesita atención! 🚩❤️`;
      gifQuery = "anime couple jealous";
    }

    else if (command === 'pelearpareja') {
      caption = `🥊 *${fromName}* y *${spouseName}* están teniendo una pelea de casados... ¡Seguro se reconcilian pronto! 😠❤️`;
      gifQuery = "anime couple fight funny";
    }

    else if (command === 'regalo') {
      const regalos = ["un ramo de rosas 🌹", "un collar de diamantes 💎", "una caja de chocolates 🍫", "un peluche gigante 🧸"];
      const regalo = regalos[Math.floor(Math.random() * regalos.length)];
      caption = `🎁 *${fromName}* le ha regalado ${regalo} a *${spouseName}*. ¡Qué detalle tan lindo! ✨`;
      gifQuery = "anime give gift";
    }

    else if (command === 'desayuno') {
      caption = `🍳 *${fromName}* le preparó un delicioso desayuno en la cama a *${spouseName}*. ☕🥞`;
      gifQuery = "anime cooking couple";
    }

    else if (command === 'haceramor') {
      caption = `🔥 *${fromName}* y *${spouseName}* están compartiendo un momento de pasión e intimidad... 🌹🕯️`;
      gifQuery = "anime couple hot kiss";
    }

    else if (command === 'abrazarpareja') {
      caption = `🫂 *${fromName}* abraza fuertemente a su pareja *${spouseName}*. Sintiéndose segur@s juntos.`;
      gifQuery = "anime couple hug";
    }

    else if (command === 'besarpareja') {
      caption = `💋 Un beso apasionado entre *${fromName}* y *${spouseName}*. El tiempo se detiene...`;
      gifQuery = "anime couple kiss";
    }

    // Enviar con GIF si es posible
    const gifUrl = await fetchGifUrl(gifQuery);
    if (gifUrl) {
      return client.sendMessage(m.chat, { 
        video: { url: gifUrl }, 
        gifPlayback: true, 
        caption, 
        mentions,
        mimetype: 'video/mp4' 
      }, { quoted: m });
    } else {
      return client.sendMessage(m.chat, { text: caption, mentions }, { quoted: m });
    }
  }
};
