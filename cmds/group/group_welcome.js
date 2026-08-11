/**
 * 🚪 group_welcome.js — Comandos de bienvenida, despedida y configuración de ajustes del grupo.
 * Reúne: setwelcome, setgoodbye, options
 */

const cmdSetWelcome = {
  command: ['setwelcome'],
  category: 'grupo', desc: 'Establecer un mensaje de bienvenida personalizado.', isAdmin: true,
  run: async (client, m, args, usedPrefix, command, text) => {
    if (!global?.db?.data?.chats) global.db.data.chats = {};
    if (!global.db.data.chats[m.chat]) global.db.data.chats[m.chat] = {};
    const chat = global.db.data.chats[m.chat];

    if (!args.length) {
      return m.reply(`*Configuración de Bienvenida* ࣭𑁯ᰍ܃܃

*❒ Variables disponibles:*
*@user* o *{usuario}*  ➔ Mención del usuario que ingresa
*@group* o *{grupo}* ➔ Nombre del grupo
*@desc* o *{desc}*   ➔ Descripción del grupo
*@members* o *{miembros}* ➔ Número de miembros actuales
*@time* o *{hora}*    ➔ Fecha y hora actual

💡 *Ejemplo:*
\`${usedPrefix + command} ¡Hola @user! Bienvenido a @group. Somos @members miembros.\`

✿ Si ya tienes un mensaje configurado y quieres borrarlo usa: *${usedPrefix + command} clear*`);
    }

    if (args[0].toLowerCase() === 'clear') {
      if (!chat.sWelcome || !chat.sWelcome.trim()) {
        return m.reply('✎ No tienes ningún mensaje de bienvenida personalizado configurado.');
      }
      chat.sWelcome = '';
      return m.reply('✐ Mensaje de bienvenida personalizado eliminado. Se usará la plantilla por defecto.');
    }

    const value = text ? text.trim() : '';
    chat.sWelcome = value;
    return m.reply(`ꕥ Has establecido el mensaje de bienvenida correctamente.`);
  }
};

const cmdSetGoodbye = {
  command: ['setgoodbye'],
  category: 'grupo', desc: 'Establecer un mensaje de despedida personalizado.', isAdmin: true,
  run: async (client, m, args, usedPrefix, command, text) => {
    if (!global?.db?.data?.chats) global.db.data.chats = {};
    if (!global.db.data.chats[m.chat]) global.db.data.chats[m.chat] = {};
    const chat = global.db.data.chats[m.chat];

    if (!args.length) {
      return m.reply(`*Configuración de Despedida* ࣭𑁯ᰍ܃܃

*❒ Variables disponibles:*
*@user* o *{usuario}*  ➔ Mención del usuario que sale
*@group* o *{grupo}* ➔ Nombre del grupo
*@desc* o *{desc}*   ➔ Descripción del grupo
*@members* o *{miembros}* ➔ Número de miembros actuales
*@time* o *{hora}*    ➔ Fecha y hora actual

💡 *Ejemplo:*
\`${usedPrefix + command} Adiós @user, te extrañaremos en @group.\`

✿ Si ya tienes un mensaje configurado y quieres borrarlo usa: *${usedPrefix + command} clear*`);
    }

    if (args[0].toLowerCase() === 'clear') {
      if (!chat.sGoodbye || !chat.sGoodbye.trim()) {
        return m.reply('✎ No tienes ningún mensaje de despedida personalizado configurado.');
      }
      chat.sGoodbye = '';
      return m.reply('✐ Mensaje de despedida personalizado eliminado. Se usará la plantilla por defecto.');
    }

    const value = text ? text.trim() : '';
    chat.sGoodbye = value;
    return m.reply(`ꕥ Has establecido el mensaje de despedida correctamente.`);
  }
};

const cmdOptions = {
  command: [
    'alerts', 'alertas',
    'antilink', 'antienlaces', 'antilinks',
    'adminonly', 'onlyadmin',
    'welcome', 'bienvenida', 'memberwelcome', 'memberwc',
    'goodbye', 'despedida',
    'economy', 'economia',
    'nsfw',
    'antistatus', 'antiestados'
  ],
  category: 'grupo', desc: 'Ajustes del grupo.', isAdmin: true,
  run: async (client, m, args, usedPrefix, command) => {
    const chatData = global.db.data.chats[m.chat];
    const stateArg = args[0]?.toLowerCase();
    const validStates = ['on', 'off', 'enable', 'disable'];
    const mapTerms = {
      antilinks: 'antilinks',
      antienlaces: 'antilinks',
      antilink: 'antilinks',
      alerts: 'alerts',
      alertas: 'alerts',
      adminonly: 'adminonly',
      onlyadmin: 'adminonly',
      welcome: 'welcome',
      bienvenida: 'welcome',
      goodbye: 'goodbye',
      despedida: 'goodbye',
      economy: 'economy',
      economia: 'economy',
      nsfw: 'nsfw',
      antistatus: 'antistatus',
      antiestados: 'antistatus'
    };
    const featureNames = {
      antilinks: 'el *AntiEnlace*',
      alerts: 'las *Alertas*',
      adminonly: 'el modo *Solo Admin*',
      welcome: 'la *Bienvenida*',
      goodbye: 'la *Despedida*',
      economy: 'la *Economía (RPG)*',
      nsfw: 'los comandos *NSFW*',
      antistatus: 'el *AntiEstado*'
    };
    const featureTitles = {
      antilinks: 'AntiEnlace',
      alerts: 'Alertas',
      adminonly: 'AdminOnly',
      welcome: 'Welcome',
      goodbye: 'Goodbye',
      economy: 'Economía',
      nsfw: 'NSFW',
      antistatus: 'AntiEstado'
    };
    const normalizedKey = mapTerms[command] || command;
    const current = chatData[normalizedKey] === true || chatData[normalizedKey] === 1;
    const estado = current ? '✓ Activado' : '✗ Desactivado';
    const nombreBonito = featureNames[normalizedKey] || `la función *${normalizedKey}*`;
    const titulo = featureTitles[normalizedKey] || normalizedKey;
    if (!stateArg) {
      return client.reply(m.chat, `*✩ ${titulo} (✿❛◡❛)*\n\nUn administrador puede activar o desactivar ${nombreBonito} utilizando:\n\n● _Habilitar ›_ *${usedPrefix + normalizedKey} enable*\n● _Deshabilitar ›_ *${usedPrefix + normalizedKey} disable*\n\n❒ *Estado actual ›* ${estado}`, m);
    }
    if (!validStates.includes(stateArg)) {
      return m.reply(`Estado no válido. Usa *on*, *off*, *enable* o *disable*\n\nEjemplo:\n${usedPrefix}${normalizedKey} enable`);
    }
    const enabled = ['on', 'enable'].includes(stateArg);
    const newValue = enabled ? 1 : 0;
    if ((chatData[normalizedKey] === 1 && enabled) || (chatData[normalizedKey] === 0 && !enabled) || (chatData[normalizedKey] === true && enabled) || (chatData[normalizedKey] === false && !enabled)) {
      return m.reply(`*${titulo}* ya estaba *${enabled ? 'activado' : 'desactivado'}*.`);
    }
    chatData[normalizedKey] = newValue;
    return m.reply(`Has *${enabled ? 'activado' : 'desactivado'}* ${nombreBonito}.`);
  }
};

export default [cmdSetWelcome, cmdSetGoodbye, cmdOptions];
