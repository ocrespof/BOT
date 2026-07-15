/**
 * ⚠️ group_warns.js — Sistema de advertencias (warns) del grupo.
 * Reúne: warn, warns, delwarn, setwarnlimit
 */
import { resolveLidToRealJid } from "../../core/utils.js";

const cmdWarn = {
  command: ['warn'],
  category: 'grupo', desc: 'Advertir usuario.', isAdmin: true,
  run: async (client, m, args) => {
    const chat = global.db.data.chats[m.chat];
    const mentioned = m.mentionedJid;
    const who2 = mentioned.length > 0 ? mentioned[0] : m.quoted ? m.quoted.sender : false;
    if (!who2) return m.reply(' Debes mencionar o responder al usuario que deseas advertir.');
    const targetId = await resolveLidToRealJid(who2, client, m.chat);
    const reason = mentioned.length > 0 ? args.slice(1).join(' ') || 'Sin razón.' : args.slice(0).join(' ') || 'Sin razón.';
    try {
      if (!chat.users[targetId]) chat.users[targetId] = {};
      const user = chat.users[targetId];
      if (!user.warnings) user.warnings = [];
      const now = new Date();
      const timestamp = now.toLocaleString('es-CO', {
        timeZone: 'America/Bogota',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      user.warnings.unshift({ reason, timestamp, by: m.sender });
      const total = user.warnings.length;
      const warningList = user.warnings.map((w, i) => {
          const index = total - i;
          return `\`#${index}\` ${w.reason}\nFecha: ${w.timestamp}`;
        }).join('\n');
      let message = `✐ Se ha añadido una advertencia a @${targetId.split('@')[0]}.\n✿ Advertencias totales \`(${total})\`:\n\n${warningList}`;
      const warnLimit = chat.warnLimit || 3;
      const expulsar = chat.expulsar === true;
      if (total >= warnLimit && expulsar) {
        try {
          await client.groupParticipantsUpdate(m.chat, [targetId], 'remove');
          delete chat.users[targetId];
          delete global.db.data.users[targetId];
          message += `\n\nEl usuario ha alcanzado el límite de advertencias y fue expulsado del grupo.`;
        } catch {
          message += `\n\nEl usuario alcanzó el límite, pero no se pudo expulsar automáticamente.`;
        }
      } else if (total >= warnLimit && !expulsar) {
        message += `\n\nEl usuario ha alcanzado el límite de advertencias.`;
      }
      await client.reply(m.chat, message, m, { mentions: [targetId] });
    } catch (e) {
      return m.reply(`> Error al ejecutar el comando.\n[Error: *${e.message}*]`);
    }
  }
};

const cmdWarns = {
  command: ['warns'],
  category: 'grupo', desc: 'Ver infractores.', isAdmin: true,
  run: async (client, m, args) => {
    const chat = global.db.data.chats[m.chat];
    const mentioned = m.mentionedJid;
    const who2 = mentioned.length > 0 ? mentioned[0] : m.quoted ? m.quoted.sender : false;
    if (!who2) return m.reply(' Menciona o responde a un usuario válido para ver sus advertencias.');
    const userId = await resolveLidToRealJid(who2, client, m.chat);
    if (!chat.users[userId]) {
      return m.reply(' Menciona o responde a un usuario válido para ver sus advertencias.');
    }
    const user = chat.users[userId];
    const total = user.warnings?.length || 0;
    if (total === 0) {
      return client.reply(m.chat, ` @${userId.split('@')[0]} no tiene advertencias registradas.`, m, { mentions: [userId] });
    }
    const name = global.db.data.users[userId]?.name || 'Usuario';
    const warningList = user.warnings.map((w, i) => {
        const index = total - i;
        const author = w.by ? `\nPor: @${w.by.split('@')[0]}` : '';
        return `\`#${index}\` ${w.reason}\nFecha: ${w.timestamp}${author}`;
      }).join('\n');
    await client.reply(m.chat, `✐ Advertencias de @${userId.split('@')[0]} (${name}):\n✧ Total de advertencias: \`${total}\`\n\n${warningList}`, m, { mentions: [userId, ...user.warnings.map(w => w.by).filter(Boolean)] });
  }
};

const cmdDelWarn = {
  command: ['delwarn'],
  category: 'grupo', desc: 'Eliminar advertencias.', isAdmin: true,
  run: async (client, m, args) => {
    const chat = global.db.data.chats[m.chat];
    const mentioned = m.mentionedJid || [];
    const who2 = mentioned.length > 0 ? mentioned[0] : (m.quoted ? m.quoted.sender : false);
    if (!who2) return m.reply(' Debes mencionar o responder al usuario cuya advertencia deseas eliminar.');
    const targetId = await resolveLidToRealJid(who2, client, m.chat);
    const user = chat.users[targetId];
    if (!user) return m.reply(' No se encontró al usuario en la base de datos.');
    const total = user?.warnings?.length || 0;
    if (total === 0) {
      return client.reply(m.chat, ` El usuario @${targetId.split('@')[0]} no tiene advertencias registradas.`, m, { mentions: [targetId] });
    }
    const name = global.db.data.users[targetId]?.name || 'Usuario';
    const rawIndex = mentioned.length > 0 ? args[1] : args[0];
    if (rawIndex?.toLowerCase() === 'all') {
      user.warnings = [];
      return client.reply(m.chat, `✐ Se han eliminado todas las advertencias del usuario @${targetId.split('@')[0]} (${name}).`, m, { mentions: [targetId] });
    }
    const index = parseInt(rawIndex);
    if (isNaN(index)) {
      return m.reply(' Debes especificar el índice de la advertencia que deseas eliminar o usar all para borrar todas.');
    }
    if (index < 1 || index > total) {
      return m.reply(`El índice debe ser un número entre 1 y ${total}.`);
    }
    const realIndex = total - index;
    user.warnings.splice(realIndex, 1);
    await client.reply(m.chat, `Se ha eliminado la advertencia #${index} del usuario @${targetId.split('@')[0]} (${name}).`, m, { mentions: [targetId] });
  }
};

const cmdSetWarnLimit = {
  command: ['setwarnlimit'],
  category: 'grupo', desc: 'Configurar límite de warns.', isAdmin: true,
  run: async (client, m, args, usedPrefix) => {
    const chat = global.db.data.chats[m.chat];
    const raw = args[0];
    const limit = parseInt(raw);
    if (isNaN(limit) || limit < 0 || limit > 10) {
      return m.reply(`✐ El límite de advertencias debe ser un número entre \`1\` y \`10\`, o \`0\` para desactivar.\nEjemplo 1 › *${usedPrefix}setwarnlimit 5*\nEjemplo 2 › *${usedPrefix}setwarnlimit 0*\n\nSi usas \`0\`, se desactivará la función de eliminar usuarios al alcanzar el límite de advertencias.\nEstado actual: ${chat.expulsar ? `\`${chat.warnLimit}\` advertencias` : '`Desactivado`'}`);
    }
    if (limit === 0) {
      chat.warnLimit = 0;
      chat.expulsar = false;
      return m.reply(`✐ Has desactivado la función de eliminar usuarios al alcanzar el límite de advertencias.`);
    }
    chat.warnLimit = limit;
    chat.expulsar = true;
    await m.reply(`✐ Límite de advertencias establecido en \`${limit}\` para este grupo.\nLos usuarios serán eliminados automáticamente al alcanzar este límite.`);
  }
};

export default [cmdWarn, cmdWarns, cmdDelWarn, cmdSetWarnLimit];
