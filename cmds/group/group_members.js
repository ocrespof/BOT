/**
 * 👥 group_members.js — Comandos de gestión de miembros de grupo.
 * Reúne: kick, promote, demote
 */
import { getGroupMeta } from '../../utils/tools.js';
import { resolveLidToRealJid } from '../../core/utils.js';

const cmdKick = {
  command: ['kick'],
  category: 'grupo', desc: 'Expulsar del grupo.', isAdmin: true, botAdmin: true,
  run: async (client, m) => {
    if (!m.mentionedJid[0] && !m.quoted) {
      return m.reply(' Etiqueta o responde al *mensaje* de la *persona* que quieres eliminar');
    }
    let user = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted.sender;
    const groupInfo = await getGroupMeta(client, m.chat);
    const ownerGroup = groupInfo.owner || m.chat.split`-`[0] + '@s.whatsapp.net';
    const ownerBot = global.owner[0] + '@s.whatsapp.net';
    const participant = groupInfo.participants.find((p) => p.phoneNumber === user || p.jid === user || p.id === user || p.lid === user);
    if (!participant) {
      return client.reply(m.chat, ` *@${user.split('@')[0]}* ya no está en el grupo.`, m, { mentions: [user] });
    }
    if (user === client.decodeJid(client.user.id)) {
      return m.reply(' No puedo eliminar al *bot* del grupo');
    }
    if (user === ownerGroup) {
      return m.reply(' No puedo eliminar al *propietario* del grupo');
    }
    if (user === ownerBot) {
      return m.reply(' No puedo eliminar al *propietario* del bot');
    }
    try {
      await client.groupParticipantsUpdate(m.chat, [user], 'remove');
      client.reply(m.chat, `@${user.split('@')[0]} *eliminado* correctamente`, m, { mentions: [user] });
    } catch (e) {
      return m.reply(`> Error al ejecutar el comando.\n[Error: *${e.message}*]`);
    }
  }
};

const cmdPromote = {
  command: ['promote', 'promover'],
  category: 'grupo', desc: 'Promover a administrador.', isAdmin: true, botAdmin: true,
  run: async (client, m, args, usedPrefix) => {
    const mentioned = m.mentionedJid || [];
    const who2 = mentioned.length > 0 ? mentioned[0] : m.quoted ? m.quoted.sender : false;
    if (!who2) return m.reply('❌ Menciona al usuario que deseas promover a administrador.');
    const who = await resolveLidToRealJid(who2, client, m.chat);
    try {
      const groupMetadata = await getGroupMeta(client, m.chat);
      const participant = groupMetadata.participants.find(p => 
        p.id === who || p.jid === who || p.lid === who || p.phoneNumber === who ||
        p.id === who2 || p.jid === who2 || p.lid === who2
      );
      if (participant?.admin)
        return client.sendMessage(m.chat, { text: `⚠️ *@${who.split('@')[0]}* ya es administrador del grupo.`, mentions: [who] }, { quoted: m });
      await client.groupParticipantsUpdate(m.chat, [participant?.id || who], 'promote');
      await client.sendMessage(m.chat, { text: `✅ *@${who.split('@')[0]}* ha sido promovido a administrador.`, mentions: [who] }, { quoted: m });
    } catch (e) {
      await m.reply(`❌ Error al promover.\n[Error: *${e.message}*]`);
    }
  }
};

const cmdDemote = {
  command: ['demote', 'degradar'],
  category: 'grupo', desc: 'Degradar administrador.', isAdmin: true, botAdmin: true,
  run: async (client, m, args, usedPrefix) => {
    const mentioned = m.mentionedJid || [];
    const who2 = mentioned.length > 0 ? mentioned[0] : m.quoted ? m.quoted.sender : false;
    if (!who2) return m.reply('❌ Menciona al usuario que deseas degradar de administrador.');
    const who = await resolveLidToRealJid(who2, client, m.chat);
    try {
      const groupMetadata = await getGroupMeta(client, m.chat);
      const participant = groupMetadata.participants.find(p => 
        p.id === who || p.jid === who || p.lid === who || p.phoneNumber === who ||
        p.id === who2 || p.jid === who2 || p.lid === who2
      );
      if (!participant?.admin) return client.sendMessage(m.chat, { text: `⚠️ *@${who.split('@')[0]}* no es administrador del grupo.`, mentions: [who] }, { quoted: m });
      if (participant.id === groupMetadata.owner) return m.reply('❌ No puedes degradar al creador del grupo.');
      await client.groupParticipantsUpdate(m.chat, [participant.id || who], 'demote');
      await client.sendMessage(m.chat, { text: `✅ *@${who.split('@')[0]}* ha sido degradado de administrador.`, mentions: [who] }, { quoted: m });
    } catch (e) {
      await m.reply(`❌ Error al degradar.\n[Error: *${e.message}*]`);
    }
  }
};

export default [cmdKick, cmdPromote, cmdDemote];
