/**
 * 📢 group_announcements.js — Comandos de mención masiva, anuncios y estado del bot.
 * Reúne: hidetag, tagall, bot
 */
import { getGroupMeta, getBotSettings } from '../../utils/tools.js';

const cmdHideTag = {
  command: ['hidetag', 'tag'],
  category: 'grupo', desc: 'Mensaje oculto para todos.', isAdmin: true,
  run: async (client, m, args) => {
    const groupMetadata = m.isGroup ? await getGroupMeta(client, m.chat) : null;
    const groupParticipants = groupMetadata?.participants || [];
    const mentions = groupParticipants.map(p => p.jid || p.id || p.lid || p.phoneNumber).filter(Boolean).map(id => client.decodeJid(id));
    const userText = (args.join(' ') || '').trim();
    const src = m.quoted || m;
    const hasImage = Boolean(src.message?.imageMessage || src.mtype === 'imageMessage' || src.mimetype === 'image' || src.mediaType === 'image');
    const hasVideo = Boolean(src.message?.videoMessage || src.mtype === 'videoMessage' || src.mimetype === 'video' || src.mediaType === 'video');
    const hasAudio = Boolean(src.message?.audioMessage || src.mtype === 'audioMessage' || src.mimetype === 'audio' || src.mediaType === 'audio');
    const hasSticker = Boolean(src.message?.stickerMessage || src.mtype === 'stickerMessage' || src.mimetype === 'sticker' || src.mediaType === 'sticker');
    const isQuoted = Boolean(m.quoted);
    const originalText = (src.caption || src.text || src.body || '').trim();
    try {
      if (hasImage || hasVideo) {
        const media = await src.download();
        const options = { quoted: null, mentions };
        if (isQuoted) {
          if (hasImage) {
            return client.sendMessage(m.chat, { image: media, ...(originalText ? { caption: originalText } : {}), ...options });
          } else {
            return client.sendMessage(m.chat, { video: media, mimetype: 'video/mp4', ...(originalText ? { caption: originalText } : {}), ...options });
          }
        } else {
          if (hasImage) {
            return client.sendMessage(m.chat, { image: media, ...(userText ? { caption: userText } : {}), ...options });
          } else {
            return client.sendMessage(m.chat, { video: media, mimetype: 'video/mp4', ...(userText ? { caption: userText } : {}), ...options });
          }
        }
      }
      if (hasAudio) {
        const media = await src.download();
        return client.sendMessage(m.chat, { audio: media, mimetype: 'audio/mp4', fileName: 'hidetag.mp3', mentions }, { quoted: null });
      }
      if (hasSticker) {
        const media = await src.download();
        return client.sendMessage(m.chat, { sticker: media, mentions }, { quoted: null });
      }
      if (isQuoted && originalText) {
        return client.sendMessage(m.chat, { text: originalText, mentions }, { quoted: null });
      }
      if (userText) {
        return client.sendMessage(m.chat, { text: userText, mentions }, { quoted: null });
      }
      return m.reply(` *Ingresa* un texto o *responde* a uno`);
    } catch (e) {
      return m.reply(`> Error al ejecutar el comando.\n[Error: *${e.message}*]`);
    }
  }
};

const cmdTagAll = {
  command: ['todos', 'invocar', 'tagall'],
  category: 'grupo', desc: 'Mencionar a todos.', isAdmin: true,
  run: async (client, m, args) => {
    const groupInfo = await getGroupMeta(client, m.chat);
    const participants = groupInfo.participants;
    const pesan = args.join(' ');
    const botVersion = global.version || '1.0.0';
    let teks = `﹒⌗﹒🌱 .ৎ˚₊‧  ${pesan || 'Revivan 🪴'}\n\n𐚁 ֹ ִ \`GROUP TAG\` ! ୧ ֹ ִ🍃\n\n🍄 \`Miembros :\` ${participants.length}\n🌿 \`Solicitado por :\` @${m.sender.split('@')[0]}\n\n` +
      `╭┄ ꒰ \`Lista de usuarios:ׄ\` ꒱ ┄\n`;
    for (const mem of participants) {
      teks += `┊@${mem.id.split('@')[0]}\n`;
    }
    teks += `╰⸼ ┄ ┄ ꒰ \`${botVersion}\` ꒱ ┄ ┄⸼`;
    return client.reply(m.chat, teks, m, { mentions: [m.sender, ...participants.map(p => p.id)] });
  }
};

const cmdBot = {
  command: ['bot'],
  category: 'grupo', desc: 'Activar/desactivar bot.', isAdmin: true,
  run: async (client, m, args) => {
    const chat = global.db.data.chats[m.chat];
    const estado = chat.isBanned ?? false;
    const botname = getBotSettings(client)?.namebot || 'Bot';

    if (args[0] === 'off') {
      if (estado) return m.reply(' El *Bot* ya estaba *desactivado* en este grupo.');
      chat.isBanned = true;
      return m.reply(` Has *Desactivado* a *${botname}* en este grupo.`);
    }

    if (args[0] === 'on') {
      if (!estado) return m.reply(` *${botname}* ya estaba *activado* en este grupo.`);
      chat.isBanned = false;
      return m.reply(` Has *Activado* a *${botname}* en este grupo.`);
    }

    return m.reply(`*✿ Estado de ${botname} (｡•́‿•̀｡)*\n✐ *Actual ›* ${estado ? '✗ Desactivado' : '✓ Activado'}\n\nPuedes cambiarlo con:\n● _Activar ›_ *bot on*\n● _Desactivar ›_ *bot off*`);
  }
};

export default [cmdHideTag, cmdTagAll, cmdBot];
