import ws from 'ws';

export default {
  command: ['gp', 'groupinfo'],
  category: 'grupo',
  run: async (client, m, args, usedPrefix, command) => {
    const from = m.chat
    if (!m.isGroup) return m.reply('《✧》 Este comando solo se puede usar en grupos.')
    const groupMetadata = await client.groupMetadata(from).catch((e) => {}) || {}
    const groupName = groupMetadata.subject;
    const groupBanner = await client.profilePictureUrl(m.chat, 'image').catch(() => 'https://cdn.yuki-wabot.my.id/files/2PVh.jpeg')
    const groupCreator = groupMetadata.owner ? '@' + groupMetadata.owner.split('@')[0] : 'Desconocido';
    const groupAdmins = groupMetadata?.participants.filter(p => (p.admin === 'admin' || p.admin === 'superadmin')) || []
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
      welcome: chat.welcome ? '✓ Activado' : '✘ Desactivado',
      goodbye: chat.goodbye ? '✓ Activado' : '✘ Desactivado',
      alerts: chat.alerts ? '✓ Activado' : '✘ Desactivado',
      adminmode: chat.adminonly ? '✓ Activado' : '✘ Desactivado',
      botprimary: botprimary
    };
    
    const botname = global.db.data.settings[client.user.id.split(':')[0] + "@s.whatsapp.net"]?.botname || 'YukiBot';

    try {
      let message = `*「✿」Grupo ◢ ${groupName} ◤*\n\n`;
      message += `➪ *Creador ›* ${groupCreator}\n`;
      message += `❖ Bot Principal › *${settings.botprimary}*\n`;
      message += `♤ Admins › *${groupAdmins.length}*\n`;
      message += `❒ Usuarios › *${totalParticipants}*\n`;
      message += `ꕥ Registrados › *${registeredUsersInGroup}*\n\n`;
      message += `➪ *Configuraciones:*\n`;
      message += `✐ ${botname} › *${settings.bot}*\n`;
      message += `✐ AntiLinks › *${settings.antilinks}*\n`;
      message += `✐ Bienvenida › *${settings.welcome}*\n`;
      message += `✐ Despedida › *${settings.goodbye}*\n`;
      message += `✐ Alertas › *${settings.alerts}*\n`;
      message += `✐ ModoAdmin › *${settings.adminmode}*`;
      
      const mentionOw = groupMetadata.owner ? groupMetadata.owner : '';
      const mentions = [rawPrimary, mentionOw].filter(Boolean);
      await client.sendContextInfoIndex(m.chat, message.trim(), {}, null, false, mentions, { banner: groupBanner, title: groupName, body: global.dev, redes: global.db.data.settings[client.user.id.split(':')[0] + "@s.whatsapp.net"].link })
    } catch (e) {
      await m.reply(`> An unexpected error occurred while executing command *${usedPrefix + command}*. Please try again or contact support if the issue persists.\n> [Error: *${e.message}*]`)
    }
  }
};
