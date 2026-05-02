import { httpGet, httpPost, httpAxios as axios } from '../../utils/http.js';
import { getDevice } from '@whiskeysockets/baileys';
import fs from 'fs';
import moment from 'moment-timezone';

const bodyMenu = `
⛥ ───「  *$namebot*  」─── ⛥
│
├ 👑 *Usuario:* @$sender
├ 🤖 *Prefijo:* [ $prefix ]
├ ⏱️ *Actividad:* $uptime
│
⛥ ─────────────────── ⛥

🚀 *Explorando el menú$cat:*`;

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
      const isOficialBot = true;
      const botType = 'Bot Oficial';
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
        return m.reply(` La categoria *${args[0]}* no existe.`);
      }
      const staticMenu = `
> 📥  *D E S C A R G A S*
> _Multimedia y Documentos_
 ⊳ *$prefix p* ➭ Audio/Video de YT
 ⊳ *$prefix fb* ➭ Videos de Facebook
 ⊳ *$prefix tt* ➭ Videos de TikTok
 ⊳ *$prefix ig* ➭ Reels de Instagram
 ⊳ *$prefix pin* ➭ Bajar de Pinterest
 ⊳ *$prefix img* ➭ Búsqueda de imágenes
 ⊳ *$prefix studocu* ➭ Documentos de Studocu
 ⊳ *$prefix scribd* ➭ Documentos de Scribd

> 🎨  *S T I C K E R S*
> _Creación Interactiva_
 ⊳ *$prefix s* ➭ Crear sticker básico
 ⊳ *$prefix brat* ➭ Crear sticker brat
 ⊳ *$prefix bratv* ➭ Brat animado
 ⊳ *$prefix getpack* ➭ Bajar pack de stickers

> 🛠️  *H E R R A M I E N T A S*
> _Utilidades y Productividad_
 ⊳ *$prefix ia* ➭ Inteligencia Artificial
 ⊳ *$prefix read* ➭ Ver mensaje View Once
 ⊳ *$prefix ocr* ➭ Extraer texto de imagen
 ⊳ *$prefix ss* ➭ Captura a web
 ⊳ *$prefix clima* ➭ Estado meteorológico
 ⊳ *$prefix tiny* ➭ Acortar enlace
 ⊳ *$prefix tr* ➭ Traductor de idiomas
 ⊳ *$prefix qr* ➭ Creador de QR
 ⊳ *$prefix rec* ➭ Recordatorios
 ⊳ *$prefix music* ➭ Identificador musical
 ⊳ *$prefix yts* ➭ Buscar en YT

> 🎓  *A C A D E M I A*
> _Asistencia Universitaria_
 ⊳ *$prefix wiki* ➭ Wikipedia Search
 ⊳ *$prefix vis* ➭ Análisis visual IA
 ⊳ *$prefix pdf* ➭ Analizador de PDFs
 ⊳ *$prefix math* ➭ Solver matemático
 ⊳ *$prefix res* ➭ Resumidor de textos
 ⊳ *$prefix pomo* ➭ Método Pomodoro
 ⊳ *$prefix corr* ➭ Corrector ortográfico
 ⊳ *$prefix hum* / *$prefix parf* ➭ Humanizar / Parafrasear
 ⊳ *$prefix apa* ➭ Citas APA automáticas
 ⊳ *$prefix def* ➭ Diccionario virtual
 ⊳ *$prefix frase* ➭ Frase inspiradora
 ⊳ *$prefix ruleta* ➭ Selector al azar
 ⊳ *$prefix detia* ➭ Escáner IA
 ⊳ *$prefix plagio* ➭ Detector de plagio

> 👥  *A D M I N I S T R A C I Ó N*
> _Gestión Grupal_
 ⊳ *$prefix gp* ➭ Info del grupo
 ⊳ *$prefix bot* ➭ Standby del bot
 ⊳ *$prefix open* / *$prefix close* ➭ Configuración del chat
 ⊳ *$prefix promote* / *$prefix demote* ➭ Configurar rangos
 ⊳ *$prefix kick* ➭ Expulsar
 ⊳ *$prefix warn* / *$prefix delwarn* ➭ Advertencias
 ⊳ *$prefix warns* ➭ Ver infractores
 ⊳ *$prefix tagall* ➭ Llamado general
 ⊳ *$prefix tag* ➭ Llamado silencioso
 ⊳ *$prefix link* ➭ Enlace de invitación
 ⊳ *$prefix setgpbanner* ➭ Cambiar portada
 ⊳ *$prefix options* ➭ Ajustes de grupo

> 👤  *P E R F I L   Y   N I V E L*
> _Cuenta y Rangos_
 ⊳ *$prefix profile* ➭ Mi perfil
 ⊳ *$prefix setdesc* / *$prefix setgenre* / *$prefix setbirth* ➭ Configurar
 ⊳ *$prefix marry* / *$prefix divorce* ➭ Matrimonio
 ⊳ *$prefix afk* ➭ Modo inactivo
 ⊳ *$prefix lboard* / *$prefix level* ➭ Niveles

> 💰  *E C O N O M Í A*
> _RPG Virtual_
 ⊳ *$prefix daily* / *$prefix weekly* / *$prefix monthly* ➭ Cobrar
 ⊳ *$prefix work* / *$prefix mine* / *$prefix hunt* ➭ Acciones
 ⊳ *$prefix balance* / *$prefix deposit* / *$prefix withdraw* ➭ Banco
 ⊳ *$prefix slots* / *$prefix roulette* / *$prefix casino* ➭ Azar
 ⊳ *$prefix steal* / *$prefix crime* / *$prefix slut* ➭ Ilegal
 ⊳ *$prefix economyboard* ➭ Tabla de economía
 ⊳ *$prefix givecoins* ➭ Transferir

> 🎮  *E N T R E T E N I M I E N T O*
> _Juegos Interactivos_
 ⊳ *$prefix tictactoe* ➭ Tres en raya
 ⊳ *$prefix connect4* ➭ Conecta 4
 ⊳ *$prefix blackjack* ➭ Blackjack (21)
 ⊳ *$prefix wordle* ➭ Adivina la palabra
 ⊳ *$prefix trivia* ➭ Preguntas y respuestas
 ⊳ *$prefix ahorcado* ➭ El ahorcado
 ⊳ *$prefix ppt* ➭ Piedra, papel, tijeras
 ⊳ *$prefix adivinanza* ➭ Acertijos
 ⊳ *$prefix inter* ➭ Emociones anime
 ⊳ *$prefix ppcouple* ➭ Iconos de pareja`;

      const content = staticMenu;
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
