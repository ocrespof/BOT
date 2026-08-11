/**
 * ⚙️ group_config.js — Comandos de configuración, información y enlaces del grupo.
 * Reúne: setgpname, setgpdesc, setgpbanner, open, closet, gp, link, revoke
 */
import { getGroupMeta, getBotSettings, msParser, clockStringHuman } from '../../utils/tools.js';

const cmdSetGpName = {
  command: ['setgpname'],
  category: 'grupo', desc: 'Configurar nombre del grupo.', isAdmin: true, botAdmin: true,
  run: async (client, m, args) => {
    const newName = args.join(' ').trim();
    if (!newName) return m.reply(' Por favor, ingrese el nuevo nombre que desea ponerle al grupo.');
    try {
      await client.groupUpdateSubject(m.chat, newName);
      m.reply(`✿ El nombre del grupo se modificó correctamente.`);
    } catch (e) {
      return m.reply(`> Error al ejecutar el comando.\n[Error: *${e.message}*]`);
    }
  }
};

const cmdSetGpDesc = {
  command: ['setgpdesc'],
  category: 'grupo', desc: 'Cambiar descripción del grupo.', isAdmin: true, botAdmin: true,
  run: async (client, m, args) => {
    const newDesc = args.join(' ').trim();
    if (!newDesc) return m.reply(' Por favor, ingrese la nueva descripción que desea ponerle al grupo.');
    try {
      await client.groupUpdateDescription(m.chat, newDesc);
      m.reply('✿ La descripción del grupo se modificó correctamente.');
    } catch (e) {
      return m.reply(`> Error al ejecutar el comando.\n[Error: *${e.message}*]`);
    }
  }
};

const cmdSetGpBanner = {
  command: ['setgpbanner', 'setgpp', 'setgppic', 'setgpfoto', 'grouppp', 'setgrouppic', 'gpicture', 'grouppicture'],
  category: 'grupo', desc: 'Cambiar la foto o portada del grupo (imagen o sticker).', isAdmin: true, botAdmin: true,
  run: async (client, m, args, usedPrefix, command) => {
    const q = m.quoted ? m.quoted : m;
    const mime = (q.msg || q).mimetype || q.mediaType || '';
    const isImage = /image/.test(mime) || q.type === 'imageMessage';
    const isSticker = /webp/.test(mime) || q.type === 'stickerMessage';

    if (!isImage && !isSticker) {
      return m.reply('🖼️ *Por favor, envía o responde a una imagen o sticker que quieras usar como foto del grupo.*');
    }

    await m.react('🕒');

    let imgBuffer = null;
    try {
      if (typeof q.download === 'function') {
        imgBuffer = await q.download();
      } else {
        const { downloadContentFromMessage } = await import('@whiskeysockets/baileys');
        const msgContent = q.msg || q;
        const mediaType = isSticker ? 'sticker' : 'image';
        const stream = await downloadContentFromMessage(msgContent, mediaType);
        const chunks = [];
        for await (const chunk of stream) chunks.push(chunk);
        imgBuffer = Buffer.concat(chunks);
      }
    } catch (e) {
      console.error('[setgpbanner download error]', e);
    }

    if (!imgBuffer || !imgBuffer.length) {
      await m.react('❌');
      return m.reply('❌ No se pudo descargar la imagen o sticker seleccionado.');
    }

    // Intento 1: Actualización directa por Buffer
    try {
      await client.updateProfilePicture(m.chat, imgBuffer);
      await m.react('✔️');
      return m.reply('✅ ¡La foto de perfil del grupo se actualizó con éxito!');
    } catch (e1) {
      // Intento 2: Fallback guardando archivo temporal en ./tmp/gpp_...
      try {
        const tmpDir = path.join(process.cwd(), 'tmp');
        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
        const imgPath = path.join(tmpDir, `gpp_${Date.now()}.jpg`);
        fs.writeFileSync(imgPath, imgBuffer);

        await client.updateProfilePicture(m.chat, { url: imgPath });

        try { fs.unlinkSync(imgPath); } catch {}
        await m.react('✔️');
        return m.reply('✅ ¡La foto de perfil del grupo se actualizó con éxito!');
      } catch (e2) {
        await m.react('❌');
        const errMsg = e2?.message || e1?.message || String(e2 || e1 || '');
        if (errMsg.includes('No image processing library available')) {
          return m.reply('❌ *ERROR CRÍTICO:* Falta la librería para procesar imágenes.\nPor favor ejecuta en la terminal:\n\n`npm install jimp@0.16.1`');
        }
        if (errMsg.includes('not-authorized')) {
          return m.reply('❌ El bot no tiene permisos de administrador reales para cambiar la foto del grupo.');
        }
        return m.reply(`❌ *Error al cambiar la foto del grupo:*\n[${errMsg}]`);
      }
    }
  }
};

const cmdOpen = {
  command: ['open', 'abrir'],
  category: 'grupo', desc: 'Abrir el grupo.', isAdmin: true, botAdmin: true,
  run: async (client, m, args) => {
    try {
      const timeout = args[0] ? msParser(args[0]) : 0;
      if (args[0] && !timeout) {
        return client.reply(m.chat, 'Formato inválido. Usa por ejemplo: 10s, 5m, 2h, 1d', m);
      }
      const groupMetadata = await getGroupMeta(client, m.chat);
      if (groupMetadata.announce === false) {
        return client.reply(m.chat, `El grupo ya está abierto.`, m);
      }
      const applyAction = async () => {
        await client.groupSettingUpdate(m.chat, 'not_announcement');
        return client.reply(m.chat, `✅ El grupo ha sido abierto.`, m);
      };
      if (timeout > 0) {
        await client.reply(m.chat, `El grupo se abrirá en ${clockStringHuman(timeout)}.`, m);
        setTimeout(async () => {
          try {
            const md = await getGroupMeta(client, m.chat);
            if (md.announce === false) return;
            await applyAction();
          } catch {}
        }, timeout);
      } else {
        await applyAction();
      }
    } catch (e) {
      return m.reply(`❌ Error al abrir el grupo.\n[Error: *${e.message}*]`);
    }
  }
};

const cmdCloset = {
  command: ['closet', 'close', 'cerrar'],
  category: 'grupo', desc: 'Cerrar el grupo.', isAdmin: true, botAdmin: true,
  run: async (client, m, args) => {
    try {
      const timeout = args[0] ? msParser(args[0]) : 0;
      if (args[0] && !timeout) {
        return client.reply(m.chat, 'Formato inválido. Usa por ejemplo: 10s, 5m, 2h, 1d', m);
      }
      const groupMetadata = await getGroupMeta(client, m.chat);
      if (groupMetadata.announce === true) {
        return client.reply(m.chat, `El grupo ya está cerrado.`, m);
      }
      const applyAction = async () => {
        await client.groupSettingUpdate(m.chat, 'announcement');
        return client.reply(m.chat, `✅ El grupo ha sido cerrado.`, m);
      };
      if (timeout > 0) {
        await client.reply(m.chat, `El grupo se cerrará en ${clockStringHuman(timeout)}.`, m);
        setTimeout(async () => {
          try {
            const md = await getGroupMeta(client, m.chat);
            if (md.announce === true) return;
            await applyAction();
          } catch {}
        }, timeout);
      } else {
        await applyAction();
      }
    } catch (e) {
      return m.reply(`❌ Error al cerrar el grupo.\n[Error: *${e.message}*]`);
    }
  }
};

const cmdGp = {
  command: ['gp', 'groupinfo'],
  category: 'grupo', desc: 'Info del grupo.',
  run: async (client, m) => {
    const from = m.chat;
    if (!m.isGroup) return m.reply(' Este comando solo se puede usar en grupos.');
    const groupMetadata = await getGroupMeta(client, from) || {};
    const groupName = groupMetadata.subject;
    const groupBanner = await client.profilePictureUrl(m.chat, 'image').catch(() => 'https://cdn.yuki-wabot.my.id/files/2PVh.jpeg');
    const groupCreator = groupMetadata.owner ? '@' + groupMetadata.owner.split('@')[0] : 'Desconocido';
    const groupAdmins = groupMetadata?.participants.filter(p => (p.admin === 'admin' || p.admin === 'superadmin')) || [];
    const totalParticipants = groupMetadata.participants.length;

    let registeredUsersInGroup = 0;
    const resolvedUsers = await Promise.all(
      groupMetadata.participants.map(async (participant) => {
        return { ...participant, jid: participant.id || participant.jid || participant.phoneNumber };
      })
    );

    const chat = global.db.data.chats[m.chat] || {};
    const chatUsers = chat.users || {};

    resolvedUsers.forEach((participant) => {
      if (chatUsers[participant.jid]) {
        registeredUsersInGroup++;
      }
    });

    const rawPrimary = typeof chat.primaryBot === 'string' ? chat.primaryBot : '';
    const botprimary = rawPrimary.endsWith('@s.whatsapp.net') ? `@${rawPrimary.split('@')[0]}` : 'Aleatorio';

    const settings = {
      bot: chat.isBanned ? '✘ Desactivado' : '✓ Activado',
      antilinks: chat.antilinks ? '✓ Activado' : '✘ Desactivado',
      alerts: chat.alerts ? '✓ Activado' : '✘ Desactivado',
      adminmode: chat.adminonly ? '✓ Activado' : '✘ Desactivado',
      botprimary: botprimary
    };

    const botname = getBotSettings(client)?.botname || 'Bot';

    try {
      let message = `*「✿」Grupo ◢ ${groupName} ◤*\n\n`;
      message += `➪ *Creador ›* ${groupCreator}\n`;
      message += `Bot Principal › *${settings.botprimary}*\n`;
      message += `♤ Admins › *${groupAdmins.length}*\n`;
      message += `❒ Usuarios › *${totalParticipants}*\n`;
      message += `Registrados › *${registeredUsersInGroup}*\n\n`;
      message += `➪ *Configuraciones:*\n`;
      message += `✐ ${botname} › *${settings.bot}*\n`;
      message += `✐ AntiLinks › *${settings.antilinks}*\n`;
      message += `✐ Alertas › *${settings.alerts}*\n`;
      message += `✐ ModoAdmin › *${settings.adminmode}*`;

      const mentionOw = groupMetadata.owner ? groupMetadata.owner : '';
      const mentions = [rawPrimary, mentionOw].filter(Boolean);
      await client.sendContextInfoIndex(m.chat, message.trim(), {}, null, false, mentions, { banner: groupBanner, title: groupName, body: global.dev, redes: getBotSettings(client).link });
    } catch (e) {
      await m.reply(`> Error al ejecutar el comando.\n[Error: *${e.message}*]`);
    }
  }
};

const cmdLink = {
  command: ['link'],
  category: 'grupo', desc: 'Enlace de invitación.', botAdmin: true,
  run: async (client, m) => {
    try {
      const code = await client.groupInviteCode(m.chat);
      const link = `https://chat.whatsapp.com/${code}`;
      const teks = `﹒⌗﹒🌿 .ৎ˚₊‧  Aquí tienes el link del grupo:\n\n𐚁 ֹ ִ \`GROUP LINK\` ! ୧ ֹ ִ🔗\n☘️ \`Solicitado por :\` @${m.sender.split('@')[0]}\n\n🌱 \`Enlace :\` ${link}`;
      await client.reply(m.chat, teks, m, { mentions: [m.sender] });
    } catch (e) {
      await m.reply(`> Error al ejecutar el comando.\n[Error: *${e.message}*]`);
    }
  }
};

const cmdRevoke = {
  command: ['revoke', 'restablecer'],
  category: 'grupo', desc: 'Revocar enlace del grupo.', botAdmin: true,
  run: async (client, m) => {
    try {
      await client.groupRevokeInvite(m.chat);
      const code = await client.groupInviteCode(m.chat);
      const link = `https://chat.whatsapp.com/${code}`;
      const teks = `﹒⌗﹒🌿 .ৎ˚₊‧  El enlace del grupo ha sido restablecido:\n\n𐚁 ֹ ִ \`NEW GROUP LINK\` ! ୧ ֹ ִ🔗\n☘️ \`Solicitado por :\` @${m.sender.split('@')[0]}\n\n🌱 \`Enlace :\` ${link}`;
      await m.react('🕒');
      await client.reply(m.chat, teks, m, { mentions: [m.sender] });
      await m.react('✔️');
    } catch (e) {
      await m.react('✖️');
      await m.reply(`> Error al ejecutar el comando.\n[Error: *${e.message}*]`);
    }
  }
};

export default [cmdSetGpName, cmdSetGpDesc, cmdSetGpBanner, cmdOpen, cmdCloset, cmdGp, cmdLink, cmdRevoke];
