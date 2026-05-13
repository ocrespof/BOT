export default {
  command: ['config', 'settings', 'ajustes'],
  category: 'owner',
  desc: 'Panel de control visual para configurar el bot en tiempo real',
  usage: '[opción] [valor]',
  isOwner: true,
  
  run: async (client, m, args, usedPrefix, command) => {
    const botId = client.user.id.split(':')[0] + '@s.whatsapp.net';
    const settings = global.db.data.settings[botId] || {};

    if (!args[0]) {
      const panel = `╭━━━━ ⚙️ *PANEL DE CONTROL* ━━━━╮
┃ 
┃ 1️⃣ *Nombre del Bot:* ${settings.namebot || 'Yuki'}
┃    Usa: *${usedPrefix + command} namebot [nuevo]*
┃
┃ 2️⃣ *Prefijo actual:* ${settings.prefix || '.'}
┃    Usa: *${usedPrefix + command} prefix [nuevo]*
┃
┃ 3️⃣ *Autoleer Mensajes:* ${settings.autoread ? '✅ Activado' : '❌ Desactivado'}
┃    Usa: *${usedPrefix + command} autoread [on/off]*
┃
┃ 4️⃣ *Modo Privado (Self):* ${settings.self ? '✅ Activado' : '❌ Desactivado'}
┃    Usa: *${usedPrefix + command} self [on/off]*
┃
╰━━━━━━━━━━━━━━━━━━━━━━━━━╯`;
      return m.reply(panel);
    }

    const opcion = args[0].toLowerCase();
    const valor = args.slice(1).join(' ');

    if (!valor && !['autoread', 'self'].includes(opcion)) {
      return m.reply(` Debes especificar un valor nuevo. Ejemplo: *${usedPrefix + command} ${opcion} NuevoValor*`);
    }

    switch (opcion) {
      case 'namebot':
        settings.namebot = valor;
        await m.reply(`✅ Nombre del bot actualizado a: *${valor}*`);
        break;
      
      case 'prefix':
        settings.prefix = valor;
        await m.reply(`✅ Prefijo actualizado a: *${valor}*`);
        break;

      case 'autoread':
        if (args[1] === 'on') settings.autoread = true;
        else if (args[1] === 'off') settings.autoread = false;
        else settings.autoread = !settings.autoread;
        await m.reply(`✅ Autoleer cambiado a: *${settings.autoread ? 'Activado' : 'Desactivado'}*`);
        break;

      case 'self':
        if (args[1] === 'on') settings.self = true;
        else if (args[1] === 'off') settings.self = false;
        else settings.self = !settings.self;
        await m.reply(`✅ Modo Privado (Self) cambiado a: *${settings.self ? 'Activado' : 'Desactivado'}*`);
        break;

      default:
        return m.reply(' Opción no válida. Usa el comando sin parámetros para ver el menú.');
    }
    
    // Guardar los cambios en la DB atómica inmediatamente
    global.saveDatabaseAsync();
  }
};
