import { resolveLidToRealJid } from "../../core/utils.js"

export default {
  command: ['pfp', 'getpic'],
  category: 'utils',
  run: async (client, m, args, usedPrefix, command) => {
    const mentioned = m.mentionedJid
    const who2 = mentioned.length > 0 ? mentioned[0] : m.quoted ? m.quoted.sender : false
    if (!who2) return m.reply(`Etiqueta o menciona al usuario del que quieras ver su foto de perfil.`)
    const who = who2.endsWith('@lid') ? await resolveLidToRealJid(who2, client, m.chat) : who2;
    try {
      const img = await client.profilePictureUrl(who, 'image').catch(() => null)
      if (!img)
        return client.sendMessage(m.chat, { text: `No se pudo obtener la foto de perfil de @${who.split('@')[0]}.`, mentions: [who] }, { quoted: m })
      await client.sendMessage(m.chat, { image: { url: img }, caption: null }, { quoted: m })
    } catch (e) {
      await m.reply(`Ha ocurrido un error al intentar obtener la foto de perfil.\n[Error: ${e.message}]`)
    }
  },
};
