import { getDevice } from '@whiskeysockets/baileys';
import moment from 'moment-timezone';

// ── Emojis y labels por categoría ──
const categoryMeta = {
  downloads: { emoji: '📥', label: 'D E S C A R G A S', desc: 'Multimedia y Documentos' },
  stickers: { emoji: '🎨', label: 'S T I C K E R S', desc: 'Creación Interactiva' },
  utils: { emoji: '🛠️', label: 'H E R R A M I E N T A S', desc: 'Utilidades y Productividad' },
  academia: { emoji: '🎓', label: 'A C A D E M I A', desc: 'Asistencia Universitaria' },
  grupo: { emoji: '👥', label: 'A D M I N I S T R A C I Ó N', desc: 'Gestión Grupal' },
  profile: { emoji: '👤', label: 'P E R F I L', desc: 'Cuenta y Rangos' },
  economia: { emoji: '💰', label: 'E C O N O M Í A', desc: 'RPG Virtual' },
  juegos: { emoji: '🎮', label: 'E N T R E T E N I M I E N T O', desc: 'Juegos Interactivos' },
  anime: { emoji: '🌸', label: 'R E A C C I O N E S', desc: 'GIFs Interactivos' },
  info: { emoji: '📋', label: 'I N F O R M A C I Ó N', desc: 'General y Reportes' },
  owner: { emoji: '👑', label: 'O W N E R', desc: 'Administración del Bot' },
};

// Alias de búsqueda para categorías
const categoryAlias = {
  downloads: ['downloads', 'descargas', 'dl'],
  stickers: ['stickers', 'sticker', 's'],
  utils: ['utils', 'utilidades', 'herramientas', 'tools'],
  academia: ['academia', 'estudio', 'edu'],
  grupo: ['grupo', 'group', 'grupos', 'admin'],
  profile: ['profile', 'perfil'],
  economia: ['economia', 'economy', 'rpg', 'eco'],
  juegos: ['juegos', 'games', 'juego', 'game'],
  anime: ['anime', 'reacciones', 'reactions'],
  info: ['info', 'main', 'principal', 'informacion'],
  owner: ['owner', 'dueño'],
};

function normalize(text = '') {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
}

/**
 * Genera el menú dinámicamente desde global.comandos
 */
function buildDynamicMenu(prefix, filterCat = null) {
  const categories = {};

  for (const [cmd, data] of global.comandos.entries()) {
    const cat = data.category || 'uncategorized';
    if (filterCat && cat !== filterCat) continue;
    if (cat === 'uncategorized' || cat === 'owner') continue; // No mostrar en menú público

    if (!categories[cat]) categories[cat] = new Set();
    // Solo agregar el primer alias (el comando principal)
    categories[cat].add(cmd);
  }

  // Generar por categoría en orden definido
  const orderedCats = Object.keys(categoryMeta);
  let menu = '';

  for (const cat of orderedCats) {
    if (cat === 'owner') continue;
    const cmds = categories[cat];
    if (!cmds || cmds.size === 0) continue;

    const meta = categoryMeta[cat] || { emoji: '📦', label: cat.toUpperCase(), desc: '' };
    
    // Deduplicar — comandos del mismo plugin solo aparecen una vez (el primer alias)
    // A menos que el plugin especifique un array 'help', en cuyo caso mostramos todos los de ahí.
    const pluginsSeen = new Set();
    const uniqueCmds = [];
    for (const cmd of cmds) {
      const data = global.comandos.get(cmd);
      if (!data) continue;
      
      const plugin = global.plugins[data.pluginName];
      const customHelp = plugin?.help;

      if (customHelp && Array.isArray(customHelp)) {
        if (!customHelp.includes(cmd)) continue; // Solo mostrar si está explícitamente en el array help
        uniqueCmds.push({ cmd, desc: data.desc || '' });
      } else {
        // Lógica tradicional: mostrar solo el primer alias del archivo
        if (pluginsSeen.has(data.pluginName)) continue;
        pluginsSeen.add(data.pluginName);
        uniqueCmds.push({ cmd, desc: data.desc || '' });
      }
    }

    menu += `\n> ${meta.emoji}  *${meta.label}*\n`;
    menu += `> _${meta.desc} (${uniqueCmds.length})_\n`;

    uniqueCmds.sort((a, b) => a.cmd.localeCompare(b.cmd));
    for (const { cmd, desc } of uniqueCmds) {
      menu += ` ⊳ *${prefix}${cmd}*${desc ? ` ➭ ${desc}` : ''}\n`;
    }
  }

  return menu;
}

export default {
  command: ['allmenu', 'help', 'menu'],
  category: 'info',
  desc: 'Muestra el menú de comandos del bot.',
  run: async (client, m, args, usedPrefix, command) => {
    try {
      const now = new Date();
      const colombianTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Caracas' }));
      const tiempo = colombianTime.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/,/g, '');
      const tempo = moment.tz('America/Caracas').format('hh:mm A');
      const botId = client?.user?.id.split(':')[0] + '@s.whatsapp.net';
      const botSettings = global.db.data.settings[botId] || {};
      const namebot = botSettings.namebot || '';
      const prefix = botSettings.prefix;
      const device = getDevice(m.key.id);
      const sender = global.db.data.users[m.sender]?.name || m.sender.split('@')[0];
      const time = client.uptime ? formatearMs(Date.now() - client.uptime) : 'Desconocido';

      // Buscar categoría filtrada
      const input = normalize(args[0] || '');
      let filterCat = null;
      if (input) {
        filterCat = Object.keys(categoryAlias).find(k => 
          categoryAlias[k].map(normalize).includes(input)
        );
        if (!filterCat) {
          // Buscar por nombre parcial
          filterCat = Object.keys(categoryMeta).find(k => normalize(k).includes(input));
        }
        if (!filterCat) {
          const cats = Object.keys(categoryMeta).filter(k => k !== 'owner').map(k => {
            const meta = categoryMeta[k];
            return `  ⊳ *${k}* — ${meta.emoji} ${meta.desc}`;
          }).join('\n');
          return m.reply(`La categoría *${args[0]}* no existe.\n\n📋 *Categorías disponibles:*\n${cats}`);
        }
      }

      const catLabel = filterCat ? ` para \`${filterCat}\`` : '. *(˶ᵔ ᵕ ᵔ˶)*';

      const header = `
⛥ ───「  *${namebot}*  」─── ⛥
│
├ 👑 *Usuario:* @${m.sender.split('@')[0]}
├ 🤖 *Prefijo:* [ ${Array.isArray(prefix) ? prefix.join(', ') : prefix || usedPrefix} ]
├ ⏱️ *Actividad:* ${time}
├ 📡 *Dispositivo:* ${device}
│
⛥ ─────────────────── ⛥

🚀 *Explorando el menú${catLabel}:*`;

      const dynamicContent = buildDynamicMenu(usedPrefix, filterCat);

      const footer = filterCat
        ? `\n> _Usa ${usedPrefix}menu para ver todas las categorías._`
        : `\n> _Usa ${usedPrefix}menu [categoría] para filtrar._\n> _Ejemplo: ${usedPrefix}menu juegos_`;

      const menu = header + '\n' + dynamicContent + footer;

      await client.sendMessage(m.chat, {
        text: menu,
        contextInfo: { mentionedJid: [m.sender] }
      }, { quoted: m });
    } catch (e) {
      await m.reply(`> An unexpected error occurred while executing command *${usedPrefix + command}*. Please try again or contact support if the issue persists.\n[Error: *${e.message}*]`);
    }
  }
};

function formatearMs(ms) {
  const segundos = Math.floor(ms / 1000);
  const minutos = Math.floor(segundos / 60);
  const horas = Math.floor(minutos / 60);
  const dias = Math.floor(horas / 24);
  return [dias && `${dias}d`, `${horas % 24}h`, `${minutos % 60}m`, `${segundos % 60}s`].filter(Boolean).join(' ');
}
