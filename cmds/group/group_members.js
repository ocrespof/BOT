/**
 * 👥 group_members.js — Comandos de gestión de miembros de grupo.
 * Reúne: kick, promote, demote
 */
import { getGroupMeta } from '../../utils/tools.js';
import { resolveLidToRealJid } from '../../core/utils.js';
import config from '../../config.js';

const cmdKick = {
  command: ['kick', 'echar', 'sacar'],
  category: 'grupo', desc: 'Expulsar miembro o usar .kick @all (Solo Creador).', isAdmin: true, botAdmin: true,
  run: async (client, m, args) => {
    const text = (args.join(' ') || '').toLowerCase().trim();
    const isKickAll = text.includes('@all') || text === 'all';
    const groupInfo = await getGroupMeta(client, m.chat);
    if (!groupInfo) return m.reply('❌ No se pudo obtener la información del grupo.');

    const botJid = client.decodeJid(client.user.id);
    const ownerBotList = [
      botJid,
      ...(global.owner || []).map(num => num + '@s.whatsapp.net'),
      ...(config.owner || []).map(num => num + '@s.whatsapp.net')
    ];
    const isOwner = ownerBotList.includes(client.decodeJid(m.sender));

    if (isKickAll) {
      if (!isOwner) {
        return m.reply('❌ Solo el *creador del bot* puede usar el comando *.kick @all*.');
      }

      const ownerGroup = groupInfo.owner || m.chat.split('-')[0] + '@s.whatsapp.net';
      const targets = (groupInfo.participants || []).filter(p => {
        const jid = client.decodeJid(p.id || p.jid || p.phoneNumber);
        return !ownerBotList.includes(jid) && jid !== ownerGroup;
      });

      if (!targets.length) {
        return m.reply('⚠️ No hay miembros elegibles para expulsar en este grupo.');
      }

      await m.reply(`🚨 *INICIANDO EXPULSIÓN MASIVA (@all)* 🚨\n\n👥 *Miembros a expulsar:* ${targets.length}\n⏳ Procesando en lotes seguros...`);

      const targetJids = targets.map(p => client.decodeJid(p.id || p.jid || p.phoneNumber));
      let kickedCount = 0;
      for (let i = 0; i < targetJids.length; i += 10) {
        const batch = targetJids.slice(i, i + 10);
        try {
          await client.groupParticipantsUpdate(m.chat, batch, 'remove');
          kickedCount += batch.length;
          await new Promise(r => setTimeout(r, 1000));
        } catch (err) {
          console.error('[kickAll batch error]', err);
        }
      }

      return client.sendMessage(m.chat, {
        text: `✅ *Expulsión masiva completada.*\n\n🗑️ *Total expulsados:* ${kickedCount} de ${targetJids.length} miembros.`
      }, { quoted: m });
    }

    if (!m.mentionedJid[0] && !m.quoted) {
      return m.reply(' Etiqueta o responde al *mensaje* de la *persona* que quieres eliminar (o usa *.kick @all* si eres el creador)');
    }
    let user = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted.sender;
    user = client.decodeJid(user);
    const ownerGroup = groupInfo.owner || m.chat.split('-')[0] + '@s.whatsapp.net';
    const participant = groupInfo.participants.find((p) => {
      const pJid = client.decodeJid(p.phoneNumber || p.jid || p.id || p.lid);
      return pJid === user || p.phoneNumber === user || p.jid === user || p.id === user || p.lid === user;
    });

    if (!participant) {
      return client.reply(m.chat, ` *@${user.split('@')[0]}* ya no está en el grupo.`, m, { mentions: [user] });
    }
    if (user === botJid) {
      return m.reply(' No puedo eliminar al *bot* del grupo');
    }
    if (user === ownerGroup) {
      return m.reply(' No puedo eliminar al *propietario* del grupo');
    }
    if (ownerBotList.includes(user)) {
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
