import { getDevice } from '@whiskeysockets/baileys';
import moment from 'moment-timezone';

export default {
  command: ['allmenu', 'help', 'menu'],
  category: 'info',
  desc: 'Muestra el menú de comandos del bot (versión estética).',
  run: async (client, m, args, usedPrefix, command) => {
    try {
      const botId = client?.user?.id.split(':')[0] + '@s.whatsapp.net';
      const botSettings = global.db.data.settings[botId] || {};
      const namebot = botSettings.namebot || 'YukiBot';
      const prefix = Array.isArray(botSettings.prefix) ? botSettings.prefix[0] : (botSettings.prefix || usedPrefix || '.');
      const time = client.uptime ? formatearMs(Date.now() - client.uptime) : 'Desconocido';
      const senderName = global.db.data.users[m.sender]?.name || m.sender.split('@')[0];

      // Construcción del Menú Estático Premium
      const menu = `
⛥ ───「  *${namebot}*  」─── ⛥
│
├ 👑 *Usuario:* @${m.sender.split('@')[0]}
├ 🤖 *Prefijo:* [ ${prefix} ]
├ ⏱️ *Actividad:* ${time}
│
⛥ ─────────────────── ⛥

🚀 *Explorando el menú. *(˶ᵔ ᵕ ᵔ˶)*:*


> 📥  *D E S C A R G A S*
> _Multimedia y Documentos_
 ⊳ *${prefix}p* ➭ Audio/Video de YT
 ⊳ *${prefix}fb* ➭ Videos de Facebook
 ⊳ *${prefix}tt* ➭ Videos de TikTok
 ⊳ *${prefix}ig* ➭ Reels de Instagram
 ⊳ *${prefix}pin* ➭ Bajar de Pinterest
 ⊳ *${prefix}img* ➭ Búsqueda de imágenes
 ⊳ *${prefix}studocu* ➭ Documentos de Studocu
 ⊳ *${prefix}scribd* ➭ Documentos de Scribd

> 🎨  *S T I C K E R S*
> _Creación Interactiva_
 ⊳ *${prefix}s* ➭ Crear sticker básico
 ⊳ *${prefix}q* ➭ Sticker de cita textual
 ⊳ *${prefix}brat* ➭ Crear sticker brat
 ⊳ *${prefix}bratv* ➭ Brat animado
 ⊳ *${prefix}getpack* ➭ Bajar pack de stickers

> 🛠️  *H E R R A M I E N T A S*
> _Utilidades y Productividad_
 ⊳ *${prefix}ia* ➭ Inteligencia Artificial
 ⊳ *${prefix}read* ➭ Ver mensaje View Once
 ⊳ *${prefix}ocr* ➭ Extraer texto de imagen
 ⊳ *${prefix}ss* ➭ Captura a web
 ⊳ *${prefix}clima* ➭ Estado meteorológico
 ⊳ *${prefix}tiny* ➭ Acortar enlace
 ⊳ *${prefix}tr* ➭ Traductor de idiomas
 ⊳ *${prefix}qr* ➭ Creador de QR
 ⊳ *${prefix}rec* ➭ Recordatorios
 ⊳ *${prefix}music* ➭ Identificador musical
 ⊳ *${prefix}yts* ➭ Buscar en YT

> 🎓  *A C A D E M I A*
> _Asistencia Universitaria_
 ⊳ *${prefix}wiki* ➭ Wikipedia Search
 ⊳ *${prefix}vis* ➭ Análisis visual IA
 ⊳ *${prefix}pdf* ➭ Analizador de PDFs
 ⊳ *${prefix}math* ➭ Solver matemático
 ⊳ *${prefix}res* ➭ Resumidor de textos
 ⊳ *${prefix}pomo* ➭ Método Pomodoro
 ⊳ *${prefix}corr* ➭ Corrector ortográfico
 ⊳ *${prefix}hum* / *${prefix}parf* ➭ Humanizar / Parafrasear
 ⊳ *${prefix}apa* ➭ Citas APA automáticas
 ⊳ *${prefix}def* ➭ Diccionario virtual
 ⊳ *${prefix}frase* ➭ Frase inspiradora
 ⊳ *${prefix}ruleta* ➭ Selector al azar
 ⊳ *${prefix}detia* ➭ Escáner IA
 ⊳ *${prefix}plagio* ➭ Detector de plagio

> 👥  *A D M I N I S T R A C I Ó N*
> _Gestión Grupal_
 ⊳ *${prefix}gp* ➭ Info del grupo
 ⊳ *${prefix}bot* ➭ Standby del bot
 ⊳ *${prefix}open* / *${prefix}close* ➭ Configuración del chat
 ⊳ *${prefix}promote* / *${prefix}demote* ➭ Configurar rangos
 ⊳ *${prefix}kick* ➭ Expulsar
 ⊳ *${prefix}warn* / *${prefix}delwarn* ➭ Advertencias
 ⊳ *${prefix}warns* ➭ Ver infractores
 ⊳ *${prefix}tagall* ➭ Llamado general
 ⊳ *${prefix}tag* ➭ Llamado silencioso
 ⊳ *${prefix}link* ➭ Enlace de invitación
 ⊳ *${prefix}setgpbanner* ➭ Cambiar portada
 ⊳ *${prefix}options* ➭ Ajustes de grupo

> 👤  *P E R F I L   Y   N I V E L*
> _Cuenta y Rangos_
 ⊳ *${prefix}profile* ➭ Mi perfil
 ⊳ *${prefix}setdesc* / *${prefix}setgenre* / *${prefix}setbirth* ➭ Configurar
 ⊳ *${prefix}marry* / *${prefix}divorce* ➭ Matrimonio
 ⊳ *${prefix}afk* ➭ Modo inactivo
 ⊳ *${prefix}lboard* / *${prefix}level* ➭ Niveles

> 💰  *E C O N O M Í A*
> _RPG Virtual_
 ⊳ *${prefix}daily* / *${prefix}weekly* / *${prefix}monthly* ➭ Cobrar
 ⊳ *${prefix}work* / *${prefix}mine* / *${prefix}hunt* ➭ Acciones
 ⊳ *${prefix}balance* / *${prefix}deposit* / *${prefix}withdraw* ➭ Banco
 ⊳ *${prefix}slots* / *${prefix}roulette* / *${prefix}casino* ➭ Azar
 ⊳ *${prefix}steal* / *${prefix}crime* / *${prefix}slut* ➭ Ilegal
 ⊳ *${prefix}economyboard* ➭ Tabla de economía
 ⊳ *${prefix}givecoins* ➭ Transferir
 ⊳ *${prefix}shop* ➭ 🏪 Tienda del bot
 ⊳ *${prefix}buy* ➭ Comprar artículos
 ⊳ *${prefix}inventory* ➭ Ver tu mochila
 ⊳ *${prefix}settitle* ➭ Equipar un título

> 🎮  *E N T R E T E N I M I E N T O*
> _Juegos Interactivos_
 ⊳ *${prefix}tictactoe* ➭ Tres en raya
 ⊳ *${prefix}connect4* ➭ Conecta 4
 ⊳ *${prefix}blackjack* ➭ Blackjack (21)
 ⊳ *${prefix}wordle* ➭ Adivina la palabra
 ⊳ *${prefix}trivia* ➭ Preguntas y respuestas
 ⊳ *${prefix}ahorcado* ➭ El ahorcado
 ⊳ *${prefix}ppt* ➭ Piedra, papel, tijeras
 ⊳ *${prefix}adivinanza* ➭ Acertijos
 ⊳ *${prefix}inter* ➭ Emociones anime

> ✦ _Desarrollado con ❤️ para ti._
`.trim();

      await client.sendMessage(m.chat, {
        text: menu,
        contextInfo: { mentionedJid: [m.sender] }
      }, { quoted: m });
    } catch (e) {
      await m.reply(`> Error al cargar el menú.\n[Error: *${e.message}*]`);
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
