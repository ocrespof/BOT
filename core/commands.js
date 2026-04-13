export const bodyMenu = `*🌟 ¡Hola *@$sender*!*
Soy *$namebot*, esta es mi lista de comandos$cat.

┌ 📊 *ESTADÍSTICAS DEL BOT*
│ 👑 *Dueño:* $owner
│ 🏷️ *Tipo:* $botType
│ ⚙️ *Versión:* v3.0 Latest
│ 📱 *Host:* $device
│ 🕒 *Hora:* $tempo
│ 👥 *Usuarios:* $users
└───────────────`

export const menuObject = {

    downloads: `╭─「 📥 *DESCARGAS* 」
│ ✐ Comandos para descargar contenido.
│
├ 🔹 *$prefixfacebook* <url>
│  ↳ Descarga videos de Facebook.
├ 🔹 *$prefixmediafire* <url>
│  ↳ Descarga archivos de MediaFire.
├ 🔹 *$prefixplay* <query>
│  ↳ Descarga audio/canción de YouTube.
├ 🔹 *$prefixplay2* <query>
│  ↳ Descarga video de YouTube.
├ 🔹 *$prefixpinterest* <query>
│  ↳ Busca y descarga imágenes de Pinterest.
├ 🔹 *$prefixreel* <url>
│  ↳ Descarga reels de Instagram.
├ 🔹 *$prefixtiktok* <url>
│  ↳ Descarga videos de TikTok.
├ 🔹 *$prefixtwitter* <url>
│  ↳ Descarga contenido de Twitter/X.
├ 🔹 *$prefiximagen* <query>
│  ↳ Descarga imágenes de Google.
╰───────────────────`,

    stickers: `╭─「 🖼️ *STICKERS* 」
│ ✐ Utilidades de conversión para pegatinas.
│
├ 🔹 *$prefixsticker* | *$prefixs* <imagen/video>
│  ↳ Convierte multimedia a sticker animado/estático.
├ 🔹 *$prefixtoimage* | *$prefixtoimg* <sticker>
│  ↳ Extrae la imagen original de un sticker.
├ 🔹 *$prefixbrat* <texto>
│  ↳ Crea un sticker con estilo texto Brat.
╰───────────────────`,

    utils: `╭─「 🛠️ *UTILIDADES* 」
│ ✐ Herramientas y funciones varias.
│
├ 🔹 *$prefixmenu* | *$prefixhelp*
│  ↳ Muestra esta lista de comandos.
├ 🔹 *$prefixbots*
│  ↳ Ve cuántos sub-bots están activos.
├ 🔹 *$prefixstatus* | *$prefixping*
│  ↳ Mide latencias y estado de salud.
├ 🔹 *$prefixreport* | *$prefixsuggest*
│  ↳ Envía mensajes a mi desarrollador.
├ 🔹 *$prefixinvitar* <link>
│  ↳ Envía petición de unión al bot.
├ 🔹 *$prefixia* | *$prefixchatgpt* <query>
│  ↳ Chat Inteligente (Inteligencia Artificial).
├ 🔹 *$prefixhumanizar* <texto>
│  ↳ Disminuye la huella robótica (IA) a estilo académico.
├ 🔹 *$prefixtourl* <multimedia>
│  ↳ Sube multimedia y extrae su link directo.
├ 🔹 *$prefixsay* <texto>
│  ↳ Pide que el bot repita un mensaje.
├ 🔹 *$prefixtrad* <idioma> <texto>
│  ↳ Traductor multilingüe automático.
├ 🔹 *$prefixhd* <imagen>
│  ↳ Remasteriza una foto pixelada.
├ 🔹 *$prefixread* <1-view>
│  ↳ Revela fotos/videos de una vista.
├ 🔹 *$prefixversiculo*
│  ↳ Recibe el versículo bíblico del día.
├ 🔹 *$prefixdevocional*
│  ↳ Lee una profunda reflexión diaria.
├ 🔹 *$prefixalegria* | *baile* | *tristeza*...
│  ↳ Envía expresiones animadas con tu nombre.
├ 🔹 *$prefixgitclone* <url>
│  ↳ Clona un repo de GitHub al chat.
╰───────────────────`,

    grupo: `╭─「 👥 *GRUPOS* 」
│ ✐ Herramientas de moderación.
│
├ 🔹 *$prefixbot* <on/off>
│  ↳ Enciende/apaga el bot temporalmente.
├ 🔹 *$prefixantilinks* <on/off>
│  ↳ Expulsa al ver enlaces sospechosos.
├ 🔹 *$prefixalerts* <on/off>
│  ↳ Maneja el sistema de notificaciones.
├ 🔹 *$prefixwelcome* | *$prefixgoodbye* <on/off>
│  ↳ Mensajes automáticos de puerta.
├ 🔹 *$prefixclose* | *$prefixopen* <tiempo>
│  ↳ Restringe quién puede chatear.
├ 🔹 *$prefixgp*
│  ↳ Información detallada del grupo.
├ 🔹 *$prefixkick* <mention>
│  ↳ Saca a un usuario del grupo.
├ 🔹 *$prefixpromote* | *$prefixdemote*
│  ↳ Asciende a Admin o lo degrada.
├ 🔹 *$prefixwarn* <mention> <motivo>
│  ↳ Da una advertencia formal.
├ 🔹 *$prefixwarns* | *$prefixdelwarn*
│  ↳ Revisa el historial o quita faltas.
├ 🔹 *$prefixsetwarnlimit* <número>
│  ↳ Expulsión automatizada tras faltas.
├ 🔹 *$prefixsetgpname / setgpdesc / setgpbaner*
│  ↳ Modificadores de la vista gráfica de grupo.
├ 🔹 *$prefixtag* <texto>
│  ↳ Emite notificaciones forzadas (Todos).
├ 🔹 *$prefixmsgcount* | *$prefixtopcount*
│  ↳ Medidores de actividad de usuarios.
├ 🔹 *$prefixtopinactive*
│  ↳ Detecta usuarios inactivos o "fantasmas".
├ 🔹 *$prefixlink*
│  ↳ Obtiene o restablece el link del grupo.
╰───────────────────`,

    academia: `╭─「 🎓 *ACADEMIA* 」
│ ✐ Herramientas de Estudio y Universidad.
│
├ 🔹 *$prefixapa* <url>
│  ↳ Extrae y genera Citaciones APA (7ma Ed).
├ 🔹 *$prefixpdf* <texto>
│  ↳ Convierte un bloque de texto a .PDF.
├ 🔹 *$prefixocr* | *$prefixtexto* <imagen>
│  ↳ Extrae copiables de los apuntes o libros.
╰───────────────────`

}
