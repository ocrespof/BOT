// Menú estático de comandos
import { getBotId, getBotSettings } from '../../utils/tools.js';

export default {
  command: ['allmenu', 'help', 'menu'],
  category: 'info',
  desc: 'Muestra el menú de comandos del bot.',
  run: async (client, m, args, usedPrefix, command) => {
    try {
      const botId = getBotId(client);
      const botSettings = getBotSettings(client);
      const namebot = botSettings.namebot || 'YukiBot';
      const prefix = Array.isArray(botSettings.prefix) ? botSettings.prefix[0] : (botSettings.prefix || usedPrefix || '.');
      const time = client.uptime ? formatearMs(Date.now() - client.uptime) : 'Desconocido';
      const senderName = global.db.data.users[m.sender]?.name || m.sender.split('@')[0];

      const menu = `
──「  *${namebot}*  」─── 
│
├ 👑 *Usuario:* @${m.sender.split('@')[0]}
├ 🤖 *Prefijo:* [ ${prefix} ]
├ ⏱️ *Actividad:* ${time}
│
 ─────────────────

> 📥  *D E S C A R G A S*
> _Multimedia y Documentos_
 ⊳ *${prefix}play* / *${prefix}p* ➭ Audio de YouTube (.mp3)
 ⊳ *${prefix}play2* / *${prefix}mp4* ➭ Video de YouTube (.mp4)
 ⊳ *${prefix}fb* ➭ Videos y Reels de Facebook
 ⊳ *${prefix}fbsearch* ➭ Buscar videos/fotos en FB
 ⊳ *${prefix}tt* / *${prefix}tiktok* ➭ Videos de TikTok sin marca
 ⊳ *${prefix}ig* / *${prefix}reels* ➭ Posts, Reels y Carruseles de IG
 ⊳ *${prefix}pin* ➭ Imágenes y videos de Pinterest
 ⊳ *${prefix}twitter* / *${prefix}x* ➭ Videos de Twitter/X
 ⊳ *${prefix}img* ➭ Búsqueda de imágenes en Google
 ⊳ *${prefix}apk* ➭ Descargar aplicaciones Android
 ⊳ *${prefix}studocu* ➭ Documentos de Studocu
 ⊳ *${prefix}scribd* ➭ Documentos de Scribd
 ⊳ *${prefix}gdrive* ➭ Archivos de Google Drive
 ⊳ *${prefix}mf* ➭ Archivos de Mediafire
 _Tip: Cita un mensaje con enlace para descargar_

> 🎨  *S T I C K E R S*
> _Creación Interactiva_
 ⊳ *${prefix}s* ➭ Crear sticker de foto, video o GIF
 ⊳ *${prefix}q* ➭ Sticker de cita estilo Telegram
 ⊳ *${prefix}q reply* / *${prefix}qr* ➭ Cita con recuadro de respuesta
 ⊳ *${prefix}q2* ... *${prefix}q10* ➭ Citar múltiples mensajes
 ⊳ *${prefix}brat* ➭ Sticker estilo Brat
 ⊳ *${prefix}bratv* ➭ Sticker Brat animado
 ⊳ *${prefix}getpack* ➭ Bajar pack completo de stickers

> 🛠️  *H E R R A M I E N T A S*
> _Utilidades y Productividad_
 ⊳ *${prefix}ia* ➭ Asistente de Inteligencia Artificial
 ⊳ *${prefix}read* / *${prefix}vv* ➭ Desbloquear fotos/videos ViewOnce
 ⊳ *${prefix}ocr* ➭ Extraer texto de una imagen
 ⊳ *${prefix}ss* ➭ Captura de pantalla de sitio web
 ⊳ *${prefix}clima* ➭ Consulta meteorológica en tiempo real
 ⊳ *${prefix}tiny* ➭ Acortador de URLs
 ⊳ *${prefix}tr* ➭ Traductor multilingüe
 ⊳ *${prefix}qr* ➭ Generador de códigos QR
 ⊳ *${prefix}rec* ➭ Recordatorios automáticos
 ⊳ *${prefix}music* ➭ Reconocimiento musical Shazam
 ⊳ *${prefix}yts* ➭ Búsqueda de videos en YouTube

> 🎓  *A C A D E M I A*
> _Asistencia Académica con IA_
 ⊳ *${prefix}wiki* ➭ Búsqueda enciclopédica en Wikipedia
 ⊳ *${prefix}vis* ➭ Análisis visual y resolución con IA
 ⊳ *${prefix}pdf* ➭ Lector y analizador de PDFs
 ⊳ *${prefix}solve* ➭ Resolución matemática paso a paso
 ⊳ *${prefix}res* ➭ Resumidor de textos largos
 ⊳ *${prefix}pomo* ➭ Temporizador Pomodoro de estudio
 ⊳ *${prefix}corr* ➭ Corrector ortográfico y gramatical
 ⊳ *${prefix}hum* / *${prefix}parf* ➭ Humanizar / Parafrasear
 ⊳ *${prefix}apa* ➭ Generador de citas APA 7ma edición
 ⊳ *${prefix}def* ➭ Diccionario de la RAE
 ⊳ *${prefix}frase* ➭ Frase célebre motivacional
 ⊳ *${prefix}detia* ➭ Detector de texto generado por IA
 ⊳ *${prefix}plagio* ➭ Detector de plagio en textos

> 👥  *A D M I N I S T R A C I Ó N*
> _Gestión y Moderación Grupal_
 ⊳ *${prefix}gp* ➭ Información completa del grupo
 ⊳ *${prefix}bot* ➭ Pausar/reactivar el bot en el chat
 ⊳ *${prefix}open* / *${prefix}close* ➭ Abrir o cerrar el chat grupal
 ⊳ *${prefix}promote* / *${prefix}demote* ➭ Asignar o quitar admin
 ⊳ *${prefix}kick* ➭ Expulsar miembros del grupo
 ⊳ *${prefix}warn* / *${prefix}delwarn* ➭ Añadir o quitar advertencias
 ⊳ *${prefix}warns* ➭ Ver lista de usuarios advertidos
 ⊳ *${prefix}setwarnlimit* ➭ Establecer límite de advertencias
 ⊳ *${prefix}tagall* / *${prefix}tag* ➭ Mención a todos los miembros
 ⊳ *${prefix}link* / *${prefix}revoke* ➭ Ver o restablecer enlace
 ⊳ *${prefix}setgpname* / *${prefix}setgpdesc* ➭ Modificar datos
 ⊳ *${prefix}setgpbanner* ➭ Cambiar foto de perfil del grupo
 ⊳ *${prefix}setwelcome* / *${prefix}setgoodbye* ➭ Mensajes de bienvenida
 ⊳ *${prefix}welcome* / *${prefix}goodbye* ➭ Activar o desactivar avisos
 ⊳ *${prefix}antilink* ➭ Filtro automático de enlaces
 ⊳ *${prefix}adminonly* ➭ Modo exclusivo para administradores
 ⊳ *${prefix}economy* ➭ Habilitar/deshabilitar economía en el grupo

> 👤  *P E R F I L   Y   N I V E L*
> _Cuenta, Rangos y Parejas_
 ⊳ *${prefix}profile* ➭ Ver ficha de perfil de usuario
 ⊳ *${prefix}getpic* ➭ Obtener foto de perfil en alta calidad
 ⊳ *${prefix}setdesc* / *${prefix}setgenre* / *${prefix}sethobby* ➭ Personalizar
 ⊳ *${prefix}setbirth* ➭ Registrar fecha de cumpleaños
 ⊳ *${prefix}marry* / *${prefix}divorce* ➭ Sistema de matrimonio
 ⊳ *${prefix}cita* / *${prefix}mimos* / *${prefix}regalo* ➭ Acciones de pareja
 ⊳ *${prefix}afk* ➭ Modo ausente con aviso automático
 ⊳ *${prefix}level* / *${prefix}lboard* ➭ Nivel actual y ranking global

> 💰  *E C O N O M Í A*
> _RPG Financiero_
 ⊳ *${prefix}daily* / *${prefix}weekly* / *${prefix}monthly* ➭ Recompensas
 ⊳ *${prefix}work* / *${prefix}mine* / *${prefix}hunt* / *${prefix}fish* ➭ Empleos
 ⊳ *${prefix}math* ➭ Resolver retos matemáticos por monedas
 ⊳ *${prefix}balance* / *${prefix}deposit* / *${prefix}withdraw* ➭ Banco
 ⊳ *${prefix}slots* / *${prefix}roulette* / *${prefix}casino* ➭ Apuestas
 ⊳ *${prefix}steal* / *${prefix}crime* / *${prefix}slut* ➭ Acciones de riesgo
 ⊳ *${prefix}economyboard* ➭ Tabla de líderes financieros
 ⊳ *${prefix}givecoins* ➭ Transferir dinero a otro usuario
 ⊳ *${prefix}shop* / *${prefix}buy* ➭ Tienda y compra de ítems
 ⊳ *${prefix}use* / *${prefix}heal* ➭ Usar objetos del inventario
 ⊳ *${prefix}inventory* / *${prefix}trade* ➭ Inventario y trueques
 ⊳ *${prefix}settitle* ➭ Equipar títulos con buffs pasivos
 ⊳ *${prefix}cooldowns* ➭ Consultar tiempos de espera

> ⚔️  *A V E N T U R A S   R P G*
> _Combates y Mazmorras_
 ⊳ *${prefix}adventure* ➭ Exploración por recompensas
 ⊳ *${prefix}dungeon* ➭ Explorar mazmorras peligrosas
 ⊳ *${prefix}raid* ➭ Batalla cooperativa contra jefe de incursión
 ⊳ *${prefix}ritual* ➭ Invocar espíritus para mejoras temporales
 ⊳ *${prefix}logros* ➭ Ver medallas y logros desbloqueados

> 🎮  *E N T R E T E N I M I E N T O*
> _Juegos Interactivos_
 ⊳ *${prefix}ahorcado* ➭ Ahorcado Visual 2.0
 ⊳ *${prefix}tictactoe* / *${prefix}ttt* ➭ Tres en raya con tablero HD
 ⊳ *${prefix}connect4* / *${prefix}c4* ➭ Conecta 4 interactivo
 ⊳ *${prefix}blackjack* / *${prefix}bj* ➭ Blackjack 21 con apuestas
 ⊳ *${prefix}wordle* ➭ Adivina la palabra de 5 letras
 ⊳ *${prefix}trivia* ➭ Preguntas de cultura general
 ⊳ *${prefix}ppt* ➭ Piedra, papel o tijeras
 ⊳ *${prefix}adivinanza* ➭ Acertijos y adivinanzas
 ⊳ *${prefix}gameboard* ➭ Clasificación de jugadores
 ⊳ *${prefix}delgame* ➭ Cancelar partida activa

> 📖  *B I B L I A*
> _Versículos automáticos_
 _Escribe cualquier cita como_ *Juan 3:16* _o_ *Salmos 23:1-4*
 _y el bot responderá con el texto bíblico (RV 1909)._
 ⊳ *${prefix}bible* ➭ Activar/desactivar en el grupo

> 📊  *M O N I T O R E O*
> _Estado del Sistema_
 ⊳ *${prefix}botstats* ➭ RAM, uptime, base de datos y tareas
 ⊳ *${prefix}ping* ➭ Latencia y velocidad de respuesta

> 🎭  *R E A C C I O N E S   D I S P O N I B L E S*
> _Usa ${prefix}<reacción> [@tag / responder]_
_abrazar, acurrucar, acurrucarse, amor, aplaudir, asustado, asustada, aburrido, aburrida, bañarse, bofetada, comer, nom, besar, muak, sonrojarse, morder, molestar, choca, golpear, golpe, llorar, bailar, tomar, lamer, cantar, reír, acariciar, puchero, presumir, sonreír, cosquillas, gritar, empujar, saltar, calor, llamar, beso, seducir, tímido, tímida, dormir, fumar, escupir, pisar, pensar, caminar, guiñar, enojado, enojada, mueca, drama, preñar, embarazar, correr, triste, curioso, curiosa, oler, tropezar, espiar_
`.trim();

      await client.sendMessage(m.chat, { text: menu, mentions: [m.sender] }, { quoted: m });
    } catch (e) {
      await client.sendMessage(m.chat, { text: `> Error al cargar el menú.\n[Error: *${e.message}*]` }, { quoted: m });
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
