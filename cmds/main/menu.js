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
      const staticMenu = `> 📥 *D E S C A R G A S*
> _Archivos, media y documentos_

⊳ *$prefix p* ➭ Audio/Video de YT
⊳ *$prefix fb* ➭ Videos de Facebook
⊳ *$prefix tt* ➭ Videos de TikTok
⊳ *$prefix ig* ➭ Reels y Post de IG
⊳ *$prefix pin* ➭ Descargar imágenes
⊳ *$prefix img* ➭ Búsqueda en Google
⊳ *$prefix studocu* ➭ Docs de Studocu

> 🎨 *S T I C K E R S*
> _Creación de multimedia interactiva_

⊳ *$prefix s* ➭ Crear sticker desde imagen/video
⊳ *$prefix brat* ➭ Crear sticker estilo brat
⊳ *$prefix bratv* ➭ Sticker brat animado
⊳ *$prefix getpack* ➭ Bajar pack de stickers

> 🛠️ *H E R R A M I E N T A S*
> _Utilidades prácticas del día a día_

⊳ *$prefix ia* ➭ Interactúa con la IA central
⊳ *$prefix read* ➭ Ver un archivo _"View Once"_
⊳ *$prefix ocr* ➭ Extraer texto de imágenes
⊳ *$prefix ss* ➭ Captura de pantalla a una URL
⊳ *$prefix clima* ➭ Estado meteorológico
⊳ *$prefix tiny* ➭ Acortador de código compacto
⊳ *$prefix tr* ➭ Traductor universal
⊳ *$prefix qr* ➭ Generador de códigos QR
⊳ *$prefix rec* ➭ Sistema de recordatorios
⊳ *$prefix music* ➭ Identificador de canciones
⊳ *$prefix yts* ➭ Buscar en base de datos YT

> 🎓 *A C A D E M I A*
> _Asistencia académica y universitaria_

⊳ *$prefix wiki* ➭ Extracción de Wikipedia
⊳ *$prefix vis* ➭ Análisis visual de imágenes
⊳ *$prefix pdf* ➭ Procesamiento IA de PDFs
⊳ *$prefix math* ➭ Solver matemático paso a paso
⊳ *$prefix res* ➭ Sintetizador de textos extensos
⊳ *$prefix pomo* ➭ Temporizador de estudio
⊳ *$prefix corr* ➭ Corrector ortográfico avanzado
⊳ *$prefix hum* / *$prefix parf* ➭ Humanizar / Parafrasear
⊳ *$prefix apa* ➭ Generador de formato APA
⊳ *$prefix def* ➭ Diccionario de definiciones
⊳ *$prefix frase* ➭ Frase o reflexión diaria
⊳ *$prefix ruleta* ➭ Sistema generador de azar
⊳ *$prefix detia* ➭ Detector de texto IA
⊳ *$prefix plagio* ➭ Escáner de plagio

> 👥 *A D M I N I S T R A C I Ó N*
> _Control absoluto para grupos_

⊳ *$prefix gp* ➭ Extraer metadata del grupo
⊳ *$prefix bot* ➭ Standby/Wakeup del bot
⊳ *$prefix open* / *$prefix close* ➭ Tráfico de mensajes
⊳ *$prefix promote* / *$prefix demote* ➭ Gestión de rangos
⊳ *$prefix kick* ➭ Executar expulsión de usuario
⊳ *$prefix warn* / *$prefix delwarn* ➭ Sistema de advertencias
⊳ *$prefix warns* ➭ Listado de infractores
⊳ *$prefix tagall* ➭ Notificación masiva general
⊳ *$prefix tag* ➭ Notificación furtiva (Admin)
⊳ *$prefix link* ➭ Extraer clave de invitación
⊳ *$prefix setgpbanner* ➭ Actualizar portada de red
⊳ *$prefix options* ➭ Panel de ajustes avanzados

> 👤 *P E R F I L   Y   N I V E L*
> _Gestión de cuenta de usuario_

⊳ *$prefix profile* ➭ Ver tu perfil de usuario
⊳ *$prefix setdesc* / *$prefix setgenre* / *$prefix setbirth* ➭ Personalizar
⊳ *$prefix marry* / *$prefix divorce* ➭ Sistema de matrimonio
⊳ *$prefix afk* ➭ Activar modo ausente
⊳ *$prefix lboard* / *$prefix level* ➭ Ranking y niveles

> 💰 *E C O N O M I A   Y   R P G*
> _Sistema financiero virtual_

⊳ *$prefix daily* / *$prefix weekly* / *$prefix monthly* ➭ Recompensas
⊳ *$prefix work* / *$prefix mine* / *$prefix hunt* ➭ Trabajar y minar
⊳ *$prefix balance* / *$prefix deposit* / *$prefix withdraw* ➭ Banco
⊳ *$prefix slots* / *$prefix roulette* / *$prefix casino* ➭ Apuestas
⊳ *$prefix steal* / *$prefix crime* / *$prefix slut* ➭ Crímenes
⊳ *$prefix economyboard* ➭ Tabla de multimillonarios
⊳ *$prefix givecoins* ➭ Transferir monedas

> 🎮 *J U E G O S*
> _Entretenimiento y desafíos_

⊳ *$prefix tictactoe* ➭ Tres en raya
⊳ *$prefix trivia* ➭ Preguntas y respuestas
⊳ *$prefix ahorcado* ➭ Juego del ahorcado
⊳ *$prefix ppt* ➭ Piedra, papel o tijera
⊳ *$prefix adivinanza* ➭ Acertijos y adivinanzas

> 🎭 *A N I M E   Y   R O L*
> _Otaku y reacciones_

⊳ *$prefix inter* ➭ Interactuar (abrazo, beso, etc.)
⊳ *$prefix ppcouple* ➭ Fotos compartidas de pareja`;

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
