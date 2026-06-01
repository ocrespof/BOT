let proposals = {}
import { resolveLidToRealJid } from "../../core/utils.js"
import axios from "axios";

export default {
  command: ['marry', 'casarse'],
  category: 'profile',
  desc: 'Casarte con alguien.',
  run: async (client, m, args) => {
    const db = global.db.data
    const chatId = m.chat
    const proposer = m.sender
    const mentioned = m.mentionedJid
    const who2 = mentioned.length > 0 ? mentioned[0] : (m.quoted ? m.quoted.sender : false)
    
    // Matrimonio Ficticio
    if (!who2 && args.length > 0) {
      const personajeQuery = args.join(' ').trim();
      const currentSpouse = db.users[proposer]?.marry;
      if (currentSpouse) return m.reply(`Ya estás casado/a con *${db.users[currentSpouse]?.name || currentSpouse}*.`);

      await m.reply(`Buscando a *${personajeQuery}* en el multiverso anime... 🌌`);

      try {
        const { data } = await axios.get(`https://api.jikan.moe/v4/characters?q=${encodeURIComponent(personajeQuery)}&limit=1`);
        const result = data.data && data.data[0];
        
        let imageUrl = null;
        let finalName = personajeQuery;
        let aboutText = '';
        
        if (result) {
          finalName = result.name;
          imageUrl = result.images?.jpg?.image_url;
          aboutText = result.about ? result.about.substring(0, 150) + '...' : '';
        }

        db.users[proposer].marry = finalName;
        
        const caption = `💍 *¡QUÉ ROMÁNTICO!* 💍\n\n@${proposer.split('@')[0]} se ha casado oficialmente con el personaje ficticio:\n\n✨ *${finalName}* ✨\n${aboutText ? `\n📖 _${aboutText}_\n` : ''}\n¡Que sean muy felices! ❤️`;
        
        if (imageUrl) {
          return client.sendMessage(chatId, { image: { url: imageUrl }, caption, mentions: [proposer] }, { quoted: m });
        } else {
          return client.sendMessage(chatId, { text: caption, mentions: [proposer] }, { quoted: m });
        }
      } catch (err) {
        // Fallback si la API falla o no encuentra nada
        db.users[proposer].marry = personajeQuery;
        return m.reply(`💍 ¡Qué romántico! Te has casado oficialmente con el personaje: *${personajeQuery}* ❤️`);
      }
    }

    if (!who2) return m.reply(' Menciona a un usuario o escribe el nombre de un personaje para casarte.')
    
    const proposee = await resolveLidToRealJid(who2, client, m.chat);
    if (proposer === proposee)
      return m.reply(' No puedes proponerte matrimonio a ti mismo.')
    if (db.users[proposer]?.marry) return m.reply(` Ya estás casado con *${db.users[db.users[proposer].marry]?.name || db.users[proposer].marry}*.`)
    if (db.users[proposee]?.marry) return m.reply(` *${db.users[proposee].name || proposee.split('@')[0]}* ya está casado con *${db.users[db.users[proposee].marry]?.name || db.users[proposee].marry}*.`)
    setTimeout(() => {
      delete proposals[proposer]
    }, 120000)
    if (proposals[proposee] === proposer) {
      delete proposals[proposee]
      db.users[proposer].marry = proposee
      db.users[proposee].marry = proposer
      return m.reply(`Felicidades, *${db.users[proposer].name || proposer.split('@')[0]}* y *${db.users[proposee].name || proposee.split('@')[0]}* ahora están casados.`)
    } else {
      proposals[proposer] = proposee
      return client.sendMessage(chatId, { text: `${db.users[proposee].name || proposee.split('@')[0]}, el usuario ${db.users[proposer].name || proposer.split('@')[0]} te ha enviado una propuesta de matrimonio.\n\n⚘ *Responde con:*\n*_marry ${db.users[proposer].name || proposer.split('@')[0]}_* para confirmar.\nLa propuesta expirará en 2 minutos.`, mentions: [proposer, proposee] }, { quoted: m })
    }
  }
};