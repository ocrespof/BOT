import { httpGet, httpPost, httpAxios as axios } from '../../utils/http.js';
import { getDevice } from '@whiskeysockets/baileys';
import fs from 'fs';
import moment from 'moment-timezone';

const bodyMenu = `
┌───「 💻 *$namebot* 💻 」───┐
│ 🤖 *Prefijo:* [ $prefix ]
│ ⏱️ *Actividad:* $uptime
└───「 📚 ⚙️ 🚀 🧠 🔬 」───┘

🚀 *¡Hola, *@$sender*!*$cat`;

function normalize(text = '') {
  text = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
  return text.endsWith('s') ? text.slice(0, -1) : text;
}

export default {
  command: ['allmenu', 'help', 'menu'],
  category: 'info',
  desc: 'Muestra este menú de comandos.',
  run: async (client, m, args, usedPrefix, command) => {
    try {
      const now = new Date();
      const colombianTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Caracas' }));
      const tiempo = colombianTime.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/,/g, '');
      const tempo = moment.tz('America/Caracas').format('hh:mm A');
      const botId = client?.user?.id.split(':')[0] + '@s.whatsapp.net';
      const botSettings = global.db.data.settings[botId] || {};
      const botname = botSettings.botname || '';
      const namebot = botSettings.namebot || '';
      const banner = botSettings.banner || '';
      const owner = botSettings.owner || '';
      const canalId = botSettings.id || '';
      const canalName = botSettings.nameid || '';
      const prefix = botSettings.prefix;
      const link = botSettings.link || 'https://whatsapp.com/channel/xxxx';
      const isOficialBot = botId === global.client.user.id.split(':')[0] + '@s.whatsapp.net';
      const botType = isOficialBot ? 'Principal/Owner' : 'Sub Bot';
      let usersCounter = 0; for (let u in global.db.data.users) usersCounter++;
      const users = usersCounter;
      const device = getDevice(m.key.id);
      const sender = global.db.data.users[m.sender].name;
      const time = client.uptime ? formatearMs(Date.now() - client.uptime) : "Desconocido";
      const alias = {
        downloads: ['downloads', 'descargas'],
        grupo: ['grupo', 'group', 'grupos'],
        stickers: ['stickers', 'sticker'],
        utils: ['utils', 'utilidades', 'herramientas'],
        academia: ['academia', 'estudio'],
        main: ['main', 'principal']
      };
      const input = normalize(args[0] || '');
      const cat = Object.keys(alias).find(k => alias[k].map(normalize).includes(input));
      const category = `${cat ? ` para \`${cat}\`` : '. *(˶ᵔ ᵕ ᵔ˶)*'}`
      if (args[0] && !cat) {      
        return m.reply(` La categoria *${args[0]}* no existe, las categorias disponibles son: *${Object.keys(alias).join(', ')}*.\nPara ver la lista completa escribe *${usedPrefix}menu*\nPara ver los comandos de una categoría escribe *${usedPrefix}menu [categoría]*\nEjemplo: *${usedPrefix}menu anime*`);
      }
      const categoriesObj = {};
      const sortedPlugins = Object.entries(global.plugins)
        .sort((a, b) => (b[1].priority || 0) - (a[1].priority || 0));

      for (const [name, pluginModule] of sortedPlugins) {
        const plugin = pluginModule.default;
        if (!plugin || !plugin.command) continue;
        const c = plugin.category || 'otros';
        if (!categoriesObj[c]) categoriesObj[c] = [];
        
        const primaryCmd = Array.isArray(plugin.command) ? plugin.command[0] : plugin.command;
        // Solo mostramos alias si no es muy largo
        // const aliases = Array.isArray(plugin.command) && plugin.command.length > 1 ? ` (${plugin.command.slice(1).join(', ')})` : '';
        const desc = plugin.desc || plugin.description || 'Comando del sistema';
        
        let entry = `⊳ *${usedPrefix}${primaryCmd}* ➭ ${desc}`;
        
        categoriesObj[c].push(entry);
      }

      const sectionInfo = {
        info: { emj: '✨', desc: '_Comandos de información general_' },
        main: { emj: '🚀', desc: '_Menú principal y sistema_' },
        utils: { emj: '🛠️', desc: '_Herramientas y utilidades varias_' },
        downloads: { emj: '📥', desc: '_Descargadores multimedia_' },
        academia: { emj: '🎓', desc: '_Asistencia académica y universitaria_' },
        stickers: { emj: '🎨', desc: '_Creador de stickers y multimedia_' },
        group: { emj: '👥', desc: '_Gestión y control de grupos_' },
        juegos: { emj: '🎮', desc: '_Juegos y entretenimiento_' },
        owner: { emj: '👑', desc: '_Comandos de administrador_' },
        otros: { emj: '🧩', desc: '_Funciones misceláneas_' }
      };

      const sections = {};
      for (const [c, cmds] of Object.entries(categoriesObj)) {
        const info = sectionInfo[c.toLowerCase()] || { emj: '⚙️', desc: '_Categoría del sistema_' };
        const header = `> ${info.emj} *${c.toUpperCase().split('').join(' ')}*\n${info.desc}\n\n`;
        sections[c] = header + cmds.join('\n');
      }
      
      const content = cat ? String(sections[cat] || '') : Object.values(sections).join('\n\n────────────────\n\n');
      let menu = bodyMenu ? String(bodyMenu || '') + '\n\n' + content : content;
      const replacements = {
        $owner: owner ? (!isNaN(owner.replace(/@s\.whatsapp\.net$/, '')) ? global.db.data.users[owner]?.name || owner.split('@')[0] : owner) : 'Oculto por privacidad',
        $botType: botType,
        $device: device,
        $tiempo: tiempo,
        $tempo: tempo,
        $users: users.toLocaleString(),
        $cat: category,
        $sender: sender,
        $botname: botname,
        $namebot: namebot,
        $prefix: usedPrefix,
        $uptime: time
      };
      for (const [key, value] of Object.entries(replacements)) {
        menu = menu.replace(new RegExp(`\\${key}`, 'g'), value);
      }
      await client.sendMessage(m.chat, { 
        text: menu,
        contextInfo: { mentionedJid: [m.sender] }
      }, { quoted: m });
    } catch (e) {
      await m.reply(`> An unexpected error occurred while executing command *${usedPrefix + command}*. Please try again or contact support if the issue persists.\n[Error: *${e.message}*]`)
    }
  }
};

function formatearMs(ms) {
  const segundos = Math.floor(ms / 1000);
  const minutos = Math.floor(segundos / 60);
  const horas = Math.floor(minutos / 60);
  const dias = Math.floor(horas / 24);
  return [dias && `${dias}d`, `${horas % 24}h`, `${minutos % 60}m`, `${segundos % 60}s`].filter(Boolean).join(" ");
}
