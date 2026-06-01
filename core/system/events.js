import chalk from 'chalk'
import { getGroupMeta, getBotId, getBotSettings } from '../../utils/tools.js';

export default async (client, m) => {
  // Remove previous listeners to prevent duplication on reconnect
  client.ev.removeAllListeners('group-participants.update');
  client.ev.on('group-participants.update', async (anu) => {
    try {
      const metadata = await getGroupMeta(client, anu.id)
      const groupAdmins = metadata?.participants.filter(p => (p.admin === 'admin' || p.admin === 'superadmin')) || []
      const chat = global?.db?.data?.chats?.[anu.id]
      const botId = getBotId(client)
      const primaryBotId = chat?.primaryBot
      const memberCount = metadata.participants.length      
      const isSelf = getBotSettings(client)?.self ?? false
      if (isSelf) return
      for (const p of anu.participants) {
        const jid = p.phoneNumber
        const phone = p.phoneNumber?.split('@')[0] || jid.split('@')[0]
        const pp = await client.profilePictureUrl(jid, 'image').catch(_ => 'https://cdn.yuki-wabot.my.id/files/2PVh.jpeg')       
        const mensajes = { add: chat.sWelcome ? `\n┊➤ ${chat.sWelcome.replace(/{usuario}/g, `@${phone}`).replace(/{grupo}/g, `*${metadata.subject}*`).replace(/{desc}/g, metadata?.desc || '✿ Sin Desc ✿')}` : '', remove: chat.sGoodbye ? `\n┊➤ ${chat.sGoodbye.replace(/{usuario}/g, `@${phone}`).replace(/{grupo}/g, `*${metadata.subject}*`).replace(/{desc}/g, metadata?.desc || '✿ Sin Desc ✿')}` : '', leave: chat.sGoodbye ? `\n┊➤ ${chat.sGoodbye.replace(/{usuario}/g, `@${phone}`).replace(/{grupo}/g, `*${metadata.subject}*`).replace(/{desc}/g, metadata?.desc || '✿ Sin Desc ✿')}` : '' }
        const botSettings = getBotSettings(client)
        const fakeContext = {
          contextInfo: {
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
              newsletterJid: botSettings.id,
              serverMessageId: '0',
              newsletterName: botSettings.nameid
            },
            externalAdReply: {
              title: botSettings.namebot,
              body: global.dev || '',
              mediaUrl: null,
              description: null,
              previewType: 'PHOTO',
              thumbnailUrl: botSettings.icon,
              sourceUrl: botSettings.link,
              mediaType: 1,
              renderLargerThumbnail: false
            },
            mentionedJid: [jid]
          }
        }
        if (anu.action === 'add' && chat?.welcome && (!primaryBotId || primaryBotId === botId)) {
          const caption = `╭┈──̇─̇─̇────̇─̇─̇──◯◝
50: ┊「 *Bienvenido (⁠ ⁠ꈍ⁠ᴗ⁠ꈍ⁠)* 」
51: ┊︶︶︶︶︶︶︶︶︶︶︶
52: ┊  *Nombre ›* @${phone}
53: ┊  *Grupo ›* ${metadata.subject}
54: ┊  *Miembros ›* ${memberCount}
55: ┊┈─────̇─̇─̇─────◯◝
56: ┊➤ *Usa /menu para ver los comandos.*
57: ┊➤ *Ahora somos ${memberCount} miembros.* ${mensajes[anu.action]}
58: ┊ ︿︿︿︿︿︿︿︿︿︿︿
59: ╰─────────────────╯`
          await client.sendMessage(anu.id, { image: { url: pp }, caption, ...fakeContext })     
        }
        if ((anu.action === 'remove' || anu.action === 'leave') && chat?.goodbye && (!primaryBotId || primaryBotId === botId)) {
          const caption = `╭┈──̇─̇─̇────̇─̇─̇──◯◝
61: ┊「 *Hasta pronto (⁠╥⁠﹏⁠╥⁠)* 」
62: ┊︶︶︶︶︶︶︶︶︶︶︶
63: ┊  *Nombre ›* @${phone}
64: ┊  *Grupo ›* ${metadata.subject}
65: ┊┈─────̇─̇─̇─────◯◝
66: ┊➤ *Ojalá que vuelva pronto.*
67: ┊➤ *Ahora somos ${memberCount} miembros.* ${mensajes[anu.action]}
68: ┊ ︿︿︿︿︿︿︿︿︿︿︿
69: ╰─────────────────╯`
          await client.sendMessage(anu.id, { image: { url: pp }, caption, ...fakeContext })
        }
        if (anu.action === 'promote' && chat?.alerts && (!primaryBotId || primaryBotId === botId)) {
          const usuario = anu.author
          await client.sendMessage(anu.id, { text: `「」 *@${phone}* ha sido promovido a Administrador por *@${usuario.split('@')[0]}.*`, mentions: [jid, usuario, ...groupAdmins.map(v => v.id)] })
        }
        if (anu.action === 'demote' && chat?.alerts && (!primaryBotId || primaryBotId === botId)) {
          const usuario = anu.author
          await client.sendMessage(anu.id, { text: `「」 *@${phone}* ha sido degradado de Administrador por *@${usuario.split('@')[0]}.*`, mentions: [jid, usuario, ...groupAdmins.map(v => v.id)] })
        }
      }
    } catch (err) {
      console.log(chalk.gray(`[ BOT  ]  → ${err}`))
    }
  })
  // Remove previous stub handler to prevent duplication on reconnect
  if (client._stubHandler) client.ev.off('messages.upsert', client._stubHandler);
  client._stubHandler = async ({ messages }) => {
    const m = messages[0]
    if (!m.messageStubType) return
    const id = m.key.remoteJid
    const chat = global.db.data.chats[id]
    const botId = getBotId(client)
    const primaryBotId = chat?.primaryBot
    if (!chat?.alerts || (primaryBotId && primaryBotId !== botId)) return
    const isSelf = getBotSettings(client)?.self ?? false
    if (isSelf) return
    const actor = m.key?.participant || m.participant || m.key?.remoteJid
    const phone = actor.split('@')[0]
    const groupMetadata = await getGroupMeta(client, id)
    const groupAdmins = groupMetadata?.participants.filter(p => (p.admin === 'admin' || p.admin === 'superadmin')) || []
    if (m.messageStubType == 21) {
      await client.sendMessage(id, { text: `「」 @${phone} cambió el nombre del grupo a *${m.messageStubParameters[0]}*`, mentions: [actor, ...groupAdmins.map(v => v.id)] })
    }
    if (m.messageStubType == 22) {
      await client.sendMessage(id, { text: `「」 @${phone} cambió el icono del grupo.`, mentions: [actor, ...groupAdmins.map(v => v.id)] })
    }
    if (m.messageStubType == 23) {
      await client.sendMessage(id, { text: `「」 @${phone} restableció el enlace del grupo.`, mentions: [actor, ...groupAdmins.map(v => v.id)] })
    }
    if (m.messageStubType == 24) {
      await client.sendMessage(id, { text: `「」 @${phone} cambió la descripción del grupo.`, mentions: [actor, ...groupAdmins.map(v => v.id)] })
    }
    if (m.messageStubType == 25) {
      await client.sendMessage(id, { text: `「」 @${phone} cambió los ajustes del grupo para permitir que ${m.messageStubParameters[0] == 'on' ? 'solo admins' : 'todos'} puedan configurar el grupo.`, mentions: [actor, ...groupAdmins.map(v => v.id)] })
    }
    if (m.messageStubType == 26) {
      await client.sendMessage(id, { text: `「」 @${phone} cambió los ajustes del grupo para permitir que ${m.messageStubParameters[0] === 'on' ? 'solo los administradores puedan enviar mensajes al grupo.' : 'todos los miembros puedan enviar mensajes al grupo.'}`, mentions: [actor, ...groupAdmins.map(v => v.id)] })
    }
  }
  client.ev.on('messages.upsert', client._stubHandler);
}
