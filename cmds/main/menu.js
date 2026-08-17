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
 ⊳ *${prefix}p* ➭ Audio/Video de YouTube
 ⊳ *${prefix}fb* ➭ Videos de Facebook
 ⊳ *${prefix}fbsearch* ➭ Buscar videos/fotos en FB
 ⊳ *${prefix}tt* ➭ Videos de TikTok
 ⊳ *${prefix}ig* ➭ Reels de Instagram
 ⊳ *${prefix}pin* ➭ Imágenes de Pinterest
 ⊳ *${prefix}twitter* ➭ Videos de Twitter/X
 ⊳ *${prefix}img* ➭ Búsqueda de imágenes
 ⊳ *${prefix}apk* ➭ Aplicaciones Android
 ⊳ *${prefix}studocu* ➭ Documentos de Studocu
 ⊳ *${prefix}scribd* ➭ Documentos de Scribd
 ⊳ *${prefix}grive* ➭ Archivos de Google Drive
 ⊳ *${prefix}mf* ➭ Archivos de Mediafire
 _Tip: Cita un mensaje con enlace para descargar_

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
 ⊳ *${prefix}yts* ➭ Buscar en YouTube

> 🎓  *A C A D E M I A*
> _Asistencia Académica con IA_
 ⊳ *${prefix}wiki* ➭ Wikipedia Search
 ⊳ *${prefix}vis* ➭ Análisis visual IA
 ⊳ *${prefix}pdf* ➭ Analizador de PDFs
 ⊳ *${prefix}solve* ➭ Solver matemático
 ⊳ *${prefix}res* ➭ Resumidor de textos
 ⊳ *${prefix}pomo* ➭ Método Pomodoro
 ⊳ *${prefix}corr* ➭ Corrector ortográfico
 ⊳ *${prefix}hum* / *${prefix}parf* ➭ Humanizar / Parafrasear
 ⊳ *${prefix}apa* ➭ Citas APA automáticas
 ⊳ *${prefix}def* ➭ Diccionario RAE
 ⊳ *${prefix}frase* ➭ Frase del día
 ⊳ *${prefix}ruleta* ➭ Selector al azar
 ⊳ *${prefix}detia* ➭ Detector de IA en textos
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
 ⊳ *${prefix}setwarnlimit* ➭ Límite de advertencias
 ⊳ *${prefix}tagall* / *${prefix}tag* ➭ Menciones grupales
 ⊳ *${prefix}link* / *${prefix}revoke* ➭ Enlace de invitación
 ⊳ *${prefix}setgpname* / *${prefix}setgpdesc* ➭ Ajustes de textos
 ⊳ *${prefix}setgpbanner* ➭ Cambiar foto del grupo
 ⊳ *${prefix}setwelcome* / *${prefix}setgoodbye* ➭ Textos bienvenida
 ⊳ *${prefix}welcome* / *${prefix}goodbye* ➭ Activar avisos
 ⊳ *${prefix}antilink* ➭ Activar detector de enlaces
 ⊳ *${prefix}alerts* / *${prefix}adminonly* ➭ Alertas / Solo admins
 ⊳ *${prefix}economy* ➭ Activar economía RPG

> 👤  *P E R F I L   Y   N I V E L*
> _Cuenta y Rangos_
 ⊳ *${prefix}profile* ➭ Mi perfil
 ⊳ *${prefix}setdesc* / *${prefix}setgenre* / *${prefix}sethobby* ➭ Configurar
 ⊳ *${prefix}setbirth* ➭ Fecha de nacimiento
 ⊳ *${prefix}marry* / *${prefix}divorce* ➭ Matrimonio
 ⊳ *${prefix}cita* / *${prefix}mimos* / *${prefix}regalo* ➭ Parejas
 ⊳ *${prefix}desayuno* / *${prefix}celos* / *${prefix}haceramor* ➭ Parejas
 ⊳ *${prefix}afk* ➭ Modo inactivo
 ⊳ *${prefix}lboard* / *${prefix}level* ➭ Niveles

> 💰  *E C O N O M Í A*
> _RPG Virtual_
 ⊳ *${prefix}daily* / *${prefix}weekly* / *${prefix}monthly* ➭ Cobrar
 ⊳ *${prefix}work* / *${prefix}mine* / *${prefix}hunt* / *${prefix}fish* ➭ Empleos
 ⊳ *${prefix}math* ➭ Resolver retos matemáticos
 ⊳ *${prefix}balance* / *${prefix}deposit* / *${prefix}withdraw* ➭ Banco
 ⊳ *${prefix}slots* / *${prefix}roulette* / *${prefix}casino* ➭ Juegos de azar
 ⊳ *${prefix}steal* / *${prefix}crime* / *${prefix}slut* ➭ Acciones ilegales
 ⊳ *${prefix}economyboard* ➭ Ranking financiero
 ⊳ *${prefix}givecoins* ➭ Transferir dinero
 ⊳ *${prefix}shop* / *${prefix}buy* ➭ Tienda y compra
 ⊳ *${prefix}use* / *${prefix}heal* ➭ Usar ítems / Curarse
 ⊳ *${prefix}inventory* / *${prefix}trade* ➭ Inventario / Trueques
 ⊳ *${prefix}settitle* ➭ Equipar títulos
 ⊳ *${prefix}einfo* / *${prefix}cooldowns* ➭ Tiempos de espera

> ⚔️  *A V E N T U R A S   R P G*
> _Combates y Mazmorras_
 ⊳ *${prefix}adventure* ➭ Ir de aventura por botines
 ⊳ *${prefix}dungeon* ➭ Explorar una mazmorra
 ⊳ *${prefix}raid* ➭ Batalla contra el jefe de incursión
 ⊳ *${prefix}ritual* ➭ Invocar espíritus para buffs
 ⊳ *${prefix}logros* ➭ Ver medallas y logros

> 🎮  *E N T R E T E N I M I E N T O*
> _Juegos Interactivos_
 ⊳ *${prefix}ahorcado* ➭ Ahorcado Visual
 ⊳ *${prefix}tictactoe* ➭ Tres en raya (apuestas)
 ⊳ *${prefix}connect4* ➭ Conecta 4 (apuestas)
 ⊳ *${prefix}blackjack* ➭ Blackjack 21 contra el Bot
 ⊳ *${prefix}wordle* ➭ Adivinar la palabra de 5 letras
 ⊳ *${prefix}trivia* ➭ Preguntas de cultura general
 ⊳ *${prefix}ppt* ➭ Piedra, papel, tijeras
 ⊳ *${prefix}adivinanza* ➭ Resolver acertijos
 ⊳ *${prefix}gameboard* ➭ Clasificación de jugadores
 ⊳ *${prefix}gamestats* ➭ Estadísticas individuales
 ⊳ *${prefix}delgame* ➭ Cancelar juego activo


> 📖  *B I B L I A*
> _Versículos automáticos_
 _Escribe una referencia como_ *Mateo 3:16* _o_ *Juan 3:16-18*
 _y el bot responderá con el versículo (RV 1909)._
 ⊳ *${prefix}bible* ➭ Activar/desactivar en el grupo

> 📊  *M O N I T O R E O*
> _Estado del Sistema_
 ⊳ *${prefix}botstats* ➭ RAM, uptime, usuarios, BD
 ⊳ *${prefix}ping* ➭ Velocidad de respuesta

> 🎭  *R E A C C I O N E S   D I S P O N I B L E S*
> _Usa ${prefix}<reacción> [@tag / responder]_
_abrazar, acurrucar, acurrucarse, amor, aplaudir, asustado, asustada, aburrido, aburrida, bañarse, bofetada, comer, nom, besar, muak, sonrojarse, morder, molestar, choca, golpear, golpe, llorar, bailar, tomar, lamer, cantar, reír, acariciar, puchero, presumir, sonreír, cosquillas, gritar, empujar, saltar, calor, llamar, beso, seducir, tímido, tímida, dormir, fumar, escupir, pisar, pensar, caminar, guiñar, enojado, enojada, mueca, drama, preñar, embarazar, correr, triste, asustado, curioso, curiosa, oler, tropezar, espiar_
`.trim();

      const pp = botSettings.icon && !botSettings.icon.includes('yuki-wabot.my.id') ? botSettings.icon : null;
      const redes = botSettings.link || "https://whatsapp.com/channel/0029Vb64nWqLo4hb8cuxe23n";

      await client.sendContextInfoIndex(m.chat, menu, {}, m, true, [m.sender], {
        banner: pp,
        title: namebot,
        body: 'Menú de Comandos',
        redes: redes
      });
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
