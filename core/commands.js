export const bodyMenu = `
> 🌟 *¡Hola *@$sender*!*
> _Soy *$namebot*, list@ para ayudarte con todo.$cat_

╭───────────────────────
│   📊 *ESTADÍSTICAS DEL BOT*
│
│ 👑 *Dueño:* $owner
│ 🏷️ *Tipo:* $botType
│ ⏱️ *Activo:* $uptime
│ 📱 *Host:* $device
│ 🕒 *Hora:* $tempo
│ 👥 *Usuarios:* $users
╰───────────────────────`

export const menuObject = {

    downloads: `> 📥 *D E S C A R G A S*
> _Descarga tu contenido multimedia favorito._

╭───────────────────────
├ ‣ *$prefix play* \`[texto]\`
│ _(Descarga música/audio de YouTube)_
├ ‣ *$prefix play2* \`[texto]\`
│ _(Descarga videos de YouTube)_
├ ‣ *$prefix facebook* \`[url]\`
│ _(Descarga reels/videos de Facebook)_
├ ‣ *$prefix tiktok* \`[url]\`
│ _(Descarga videos de TikTok)_
├ ‣ *$prefix instagram* \`[url]\`
│ _(Baja publicaciones de Instagram)_
├ ‣ *$prefix pinterest* \`[texto]\`
│ _(Busca y descarga imágenes)_
├ ‣ *$prefix imagen* \`[texto]\`
│ _(Búsquedas visuales en Google)_
╰───────────────────────`,

    stickers: `> 🖼️ *S T I C K E R S*
> _Crea y personaliza stickers rápidamente._

╭───────────────────────
├ ‣ *$prefix sticker* \`[imagen/vdeo]\`
│ _(Convierte multimedia en sticker)_
├ ‣ *$prefix brat* \`[texto]\`
│ _(Crea un sticker estilo brat)_
├ ‣ *$prefix bratv* \`[texto]\`
│ _(Sticker brat animado en video)_
├ ‣ *$prefix spack* \`[nombre]\`
│ _(Descarga un pack de stickers)_
╰───────────────────────`,

    utils: `> 🛠️ *U T I L I D A D E S*
> _Herramientas útiles para el día a día._

╭───────────────────────
├ ‣ *$prefix ia* \`[pregunta]\`
│ _(Interactúa con IA avanzada)_
├ ‣ *$prefix humanizar* \`[texto]\`
│ _(Dale tono humano a textos de IA)_
├ ‣ *$prefix hd* \`[imagen]\`
│ _(Mejora y aumenta la calidad)_
├ ‣ *$prefix read* \`[mensaje 1-view]\`
│ _(Visualiza fotos/videos de una sola vez)_
├ ‣ *$prefix ocr* \`[imagen]\`
│ _(Extrae y copia texto de una foto)_
├ ‣ *$prefix ss* \`[url]\`
│ _(Toma captura de pantalla a webs)_
├ ‣ *$prefix clima* \`[ciudad]\`
│ _(Consulta el estado del tiempo)_
├ ‣ *$prefix tiny* \`[url]\`
│ _(Acorta enlaces largos)_
├ ‣ *$prefix trad* \`[idioma] [texto]\`
│ _(Traduce textos a otros idiomas)_
├ ‣ *$prefix qr* \`[texto/link]\`
│ _(Genera un código QR rápidamente)_
╰───────────────────────`,

    academia: `> 🎓 *A C A D E M I A*
> _Tu mejor apoyo para el área de estudio._

╭───────────────────────
├ ‣ *$prefix wiki* \`[tema]\`
│ _(Busca información en Wikipedia)_
├ ‣ *$prefix math* \`[expresión]\`
│ _(Resuelve operaciones numéricas)_
├ ‣ *$prefix resumir* \`[texto]\`
│ _(Extrae los puntos más importantes)_
├ ‣ *$prefix pomodoro*
│ _(Inicia temporizador de estudio)_
├ ‣ *$prefix corregir* \`[texto]\`
│ _(Corrige errores ortográficos)_
├ ‣ *$prefix parafrasear* \`[texto]\`
│ _(Reescribe tus textos inteligentemente)_
├ ‣ *$prefix def* \`[palabra]\`
│ _(Busca significados en el diccionario)_
├ ‣ *$prefix trivia*
│ _(Juega y aprende con preguntas)_
├ ‣ *$prefix frase*
│ _(Recibe inspiración para hoy)_
├ ‣ *$prefix ruleta* \`[nombres]\`
│ _(Crea un sorteo o decision al azar)_
╰───────────────────────`,

    grupo: `> 👥 *G R U P O S*
> _Comandos dedicados a la administración._

╭───────────────────────
├ ‣ *$prefix gp*
│ _(Ver la info general del grupo)_
├ ‣ *$prefix bot* \`[on/off]\`
│ _(Activar o desactivar el bot en el chat)_
├ ‣ *$prefix open* / *$prefix close*
│ _(Permite que todos/solo admins hablen)_
├ ‣ *$prefix promote* / *$prefix demote* \`[@]\`
│ _(Maneja permisos de administrador)_
├ ‣ *$prefix kick* \`[@]\`
│ _(Expulsa a un usuario rebelde)_
├ ‣ *$prefix warn* / *$prefix delwarn* \`[@]\`
│ _(Pon o quita una advertencia)_
├ ‣ *$prefix warns*
│ _(Ver la lista de amonestados)_
├ ‣ *$prefix tagall*
│ _(Menciona a todos en el grupo)_
├ ‣ *$prefix hidetag* \`[texto]\`
│ _(Aviso general con mención invisible)_
├ ‣ *$prefix link*
│ _(Te muestra el enlace de invitación)_
├ ‣ *$prefix setgoodbye* \`[texto]\`
│ _(Configura un mensaje de despedida)_
├ ‣ *$prefix setgpbanner* \`[img]\`
│ _(Cambia la foto de perfil del grupo)_
╰───────────────────────`,

    main: `> ⚙️ *P R I N C I P A L*
> _Control total sobre mis funciones core._

╭───────────────────────
├ ‣ *$prefix menu*
│ _(Muestra esta misma lista de ayuda)_
├ ‣ *$prefix ping*
│ _(Comprueba mi estado de latencia)_
├ ‣ *$prefix status*
│ _(Estadísticas internas del host)_
├ ‣ *$prefix restart*
│ _(Reinicia y refresca todos los procesos)_
├ ‣ *$prefix update*
│ _(Adquiere el nuevo código disponible)_
├ ‣ *$prefix clear*
│ _(Limpia todos los logs del terminal)_
╰───────────────────────`
}

