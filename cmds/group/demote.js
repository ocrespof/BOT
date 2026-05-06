import { getGroupMeta } from '../../utils/tools.js';
import { resolveLidToRealJid } from '../../core/utils.js';

export default {
  command: ['demote', 'degradar'],
  category: 'grupo',
  desc: 'Degradar administrador.',
  isAdmin: true,
  botAdmin: true,
  run: async (client, m, args, usedPrefix, command) => {
    const mentioned = m.mentionedJid || []
    const who2 = mentioned.length > 0 ? mentioned[0] : m.quoted ? m.quoted.sender : false
    if (!who2) return m.reply('❌ Menciona al usuario que deseas degradar de administrador.')
    const who = await resolveLidToRealJid(who2, client, m.chat)
    try {
      const groupMetadata = await getGroupMeta(client, m.chat)
      const participant = groupMetadata.participants.find(p => 
        p.id === who || p.jid === who || p.lid === who || p.phoneNumber === who ||
        p.id === who2 || p.jid === who2 || p.lid === who2
      )
      if (!participant?.admin) return client.sendMessage(m.chat, { text: `⚠️ *@${who.split('@')[0]}* no es administrador del grupo.`, mentions: [who] }, { quoted: m })
      if (participant.id === groupMetadata.owner) return m.reply('❌ No puedes degradar al creador del grupo.')
      await client.groupParticipantsUpdate(m.chat, [participant.id || who], 'demote')
      await client.sendMessage(m.chat, { text: `✅ *@${who.split('@')[0]}* ha sido degradado de administrador.`, mentions: [who] }, { quoted: m })
    } catch (e) {
      await m.reply(`❌ Error al degradar.\n[Error: *${e.message}*]`)
    }
  },
};