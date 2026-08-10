<div align="center">

# ✧ Bot ✧

**Bot de WhatsApp Ultrarrápido con SQLite y Middleware Pipeline · Baileys Multi-Device**

[![Termux Ready](https://img.shields.io/badge/Optimized_for-Termux-7e57c2?style=for-the-badge&logo=android)](https://termux.com/)
[![Baileys](https://img.shields.io/badge/Powered_by-Baileys-25D366?style=for-the-badge&logo=whatsapp)](https://github.com/WhiskeySockets/Baileys)
[![NodeJS](https://img.shields.io/badge/Node.js-%3E%3D22.5.0-43853D?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![Database](https://img.shields.io/badge/Database-SQLite-003B57?style=for-the-badge&logo=sqlite)](https://www.sqlite.org/)
[![ESM](https://img.shields.io/badge/Pure-ESM-blue?style=for-the-badge)](https://nodejs.org/api/esm.html)

*Bot de WhatsApp de última generación diseñado para alto rendimiento en dispositivos móviles y VPS de bajos recursos. Cuenta con base de datos transaccional SQLite, tubería de middlewares avanzada, suite de descargas protegida contra hotlinking, comandos académicos con IA y moderación inteligente.*

</div>

---

## ⚡ Arquitectura

```
bot/
├── index.js              # Boot + inicialización de DB + anti-crash + conexión Baileys
├── main.js               # Hot path: ejecución del pipeline de middlewares + routing
├── config.js             # Configuración de APIs, propietarios y prefijos
├── core/
│   ├── message.js        # Message shimming (m.reply, m.quoted.download, isBot)
│   ├── exif.js           # Metadatos de Stickers (EXIF/WebP)
│   └── system/
│       ├── commandLoader.js   # Descubrimiento automático de plugins (named & default exports)
│       ├── database.js        # Motor SQLite + Proxy Reactivo (Unit of Work) para persistencia JSON transparente
│       ├── initDB.js          # Inicialización pasiva de estructuras (Usuario, Grupo, Ajustes) en SQLite
│       ├── antilink.js        # Moderador de enlaces de WhatsApp y URLs sospechosas (Anti-Phishing)
│       ├── antistatus.js      # Moderador automático de menciones de estado grupal spam (Anti-Status)
│       └── events.js          # Gestión de bienvenida, despedida y monitoreo de eventos silenciosos de WhatsApp
├── cmds/
│   ├── downloads/        # Descargas unificadas (resiliente con fallback de buffers y APIs prioritarias)
│   ├── academia/         # Suite académica con IA
│   ├── economia/         # Sistema RPG unificado
│   ├── juegos/           # Juegos (Ahorcado, Adivinanzas, Trivia, Wordle, TTT, Connect4)
│   ├── stickers/         # Creación y utilidades de stickers (brat, getpack, emojimix)
│   ├── group/            # Configuración y administración avanzada de grupos
│   ├── profile/          # Perfiles de usuario, nivelación y tablas de clasificación (leaderboards)
│   └── Reactions/        # Más de 60 reacciones animadas con GIFs integrados
└── utils/
    ├── ai.js             # Cliente de Inteligencia Artificial con cadena de fallbacks
    ├── tools.js          # Utilidades compartidas (formateo, cálculo de XP, etc.)
    └── gameEngine.js     # Motor transaccional de juegos concurrentes en tiempo real
```

---

## 🔧 Optimizaciones y Tecnologías Core

| Optimización | Descripción / Impacto |
|:---|:---|
| **Base de Datos SQLite** | Reemplazo total del sistema legacy de archivos JSON por SQLite. Utiliza un **Proxy Reactivo transaccional (Unit of Work)** por mensaje que permite escribir en base de datos usando la sintaxis nativa de objetos JSON (`global.db.data.users[...]`), sincronizando las diferencias de forma atómica al terminar de procesar el mensaje. |
| **Limpieza Programada (clearDB)** | Mantenimiento diario automático al arranque del bot. Detecta y elimina de la base de datos registros de usuarios con más de 20 días de inactividad, evitando el consumo innecesario de almacenamiento. |
| **Migrador Automático** | Rutina de migración integrada que transforma e importa de forma transparente bases de datos legacy de formato JSON (`db_users.json`, `db_chats.json`, `database.json`) a SQLite en el primer arranque. |
| **Descarga Directa a Buffer** | Solución al fallo clásico de carga en teléfonos para recursos protegidos (Instagram/Facebook CDN). El bot pre-descarga localmente la imagen o video en un buffer de memoria antes de entregarlo a Baileys, evitando el envío de mensajes corruptos. |
| **APIs de YouTube Lempi** | Integración prioritaria del endpoint privado de `YukiBot` para descargas de YouTube (MP3 y MP4), acelerando drásticamente el procesamiento de descargas multimedia. |
| **Pipeline de Middlewares** | Sistema asíncrono estilo Express/Koa que procesa autorizaciones, spam y juegos en turnos secuenciales ordenados. |
| **Precarga y Caché de Grupos** | Sistema asíncrono de precarga (`warmupGroups`) de metadatos para hasta 50 grupos activos en el arranque del socket, con invalidación en tiempo real ante eventos de cambio de participantes. Evita llamadas redundantes a la red de WhatsApp. |
| **Almacén `msgStore` Liviano** | Bounded Map circular en memoria limitado a 100 mensajes para alimentar `getMessage`. Asegura la correcta desencriptación de mensajes antiguos y citados sin sobrecargar la RAM. |
| **Caché de Versión de Baileys** | Obtención eficiente de la versión de Baileys con expiración de 1 hora y fallback de emergencia local, previniendo bloqueos de inicio por caídas en repositorios remotos. |
| **Prefijos Dinámicos y `customPrefix`** | Soporte integrado en el pipeline para procesar comandos con prefijos de expresión regular personalizados o palabras clave exactas. |
| **Álbumes Nativos** | Agrupa resultados de búsquedas de imágenes (Pinterest/Google Images) en álbumes nativos de WhatsApp, eliminando el spam de burbujas en el chat. |

---

## ✨ Características Principales

### 📥 Descargas Resilientes (Quote-to-Download)
Todos los comandos de descarga soportan **citar un mensaje que contenga un enlace** en lugar de requerir que escribas la URL:
- **YouTube**: `.play` (audio) / `.play2` (video) con metadatos extendidos y fallbacks rápidos (APIs de Lempi, Opik, Ryze y scrapers internos).
- **Instagram**: Descarga de Reels, Historias y Carruseles enviándolos como álbumes nativos de WhatsApp.
- **Facebook / TikTok / Pinterest / Twitter**: Descargadores ultra estables optimizados.
- **Documentos**: Soporte para Scribd, Google Drive, Mediafire y Studocu (con pre-búsqueda integrada).

### 👥 Moderación Avanzada de Grupos
- **Expulsión Masiva (`.kick @all`)**: Permite expulsar masivamente a los miembros del grupo en lotes seguros. **Exclusivo para el creador del bot** para prevenir abusos. Protege automáticamente al propietario del grupo y al bot.
- **Llamado a Administradores (`admins` / `reportar`)**: Escribiendo la palabra `admins` o `.admins <motivo>` en el chat, menciona automáticamente a todos los administradores del grupo notificándoles el motivo o reporte solicitado.
- **Anti-Link**: Eliminación de mensajes y expulsión de usuarios que compartan enlaces de otros grupos o canales de WhatsApp.
- **Anti-Phishing**: Detección inteligente de URLs sospechosas o fraudes comunes y expulsión del remitente.
- **Anti-Status**: Control y eliminación automática de reenvíos maliciosos de menciones de estado grupal que puedan colgar el chat de grupo.
- **Detector de Eventos Silenciosos**: Monitoreo y reporte en tiempo real en el chat cuando se modifica la **Aprobación de nuevos miembros** por administradores o ajustes de seguridad del grupo.
- **Panel de Ajustes Rápido**: Control inmediato a través de los comandos de administración `.nsfw enable/disable` y `.antistatus enable/disable`.

### 🎓 Academia (IA Modo Absoluto)
Prompts optimizados y secuencias de fallback con respuestas limpias y estructuradas:
- **Solver**: Guía de resolución analítica paso a paso.
- **Resumir**: Análisis estructural rápido de textos.
- **Humanizar**: Modificaciones sintácticas avanzadas para evadir detectores de IA.
- **Detector IA/Plagio**: Análisis forense de patrones de redacción artificial.
- **ChatPDF**: Consulta inteligente basada únicamente en documentos adjuntos.

### 💰 Economía RPG & JUEGOS
Mazmorras, trabajo, casino, aventuras, slots, ruleta, minería, y robo de monedas. Incluye juegos interactivos como Ahorcado visual, Wordle, Tres en raya (TTT), Trivia, Blackjack y Connect4 integrados directamente con las estadísticas y recompensas de economía del bot.

---

## 🚀 Instalación y Despliegue

### Requisitos Previos
* Node.js **>= 22.5.0** (Requerido para el soporte nativo de `node:sqlite`).
* FFmpeg instalado en el sistema.

### Instalación en Termux (Android)
```bash
# 1. Preparar el entorno de almacenamiento y actualizar paquetes
termux-setup-storage
apt update && apt upgrade -y
pkg install -y git nodejs ffmpeg

# 2. Clonar el repositorio y entrar
git clone https://github.com/ocrespof/BOT.git
cd BOT

# 3. Instalar dependencias e iniciar el bot
npm install
npm start
```
> Escanea el código QR en pantalla o solicita la vinculación usando el código de 8 dígitos.

### Despliegue 24/7 con PM2
Para mantener el bot encendido en segundo plano sin importar que cierres la sesión:
```bash
termux-wake-lock
npm i -g pm2
pm2 start index.js --name "Bot" --max-memory-restart 512M
pm2 save
```

| Comando PM2 | Acción |
|:---|:---|
| `pm2 stop Bot` | Pausar ejecución |
| `pm2 restart Bot` | Reiniciar el bot |
| `pm2 logs Bot` | Visualizar los registros y logs en tiempo real |

---

## 🛠️ Solución de Problemas Comunes

| Problema | Causa Común / Solución |
|:---|:---|
| **Bot Desconectado** | Comprueba que el proceso de Node siga activo. Reinicia con `npm start` o `pm2 restart Bot`. |
| **Vincular nuevo número** | Elimina la carpeta de credenciales ejecutando `rm -rf Sessions/Owner` e inicia el bot nuevamente para generar un nuevo QR/Código. |
| **Falta librería de imágenes** | Si el bot alerta sobre el procesamiento de imágenes (para cambiar banners), ejecuta `npm install jimp@0.16.1`. |
| **Error de memoria en Termux** | Si Termux mata el proceso por falta de RAM, inicia Node limitando el espacio: `node --max-old-space-size=450 index.js`. |

---

<div align="center">

*Hecho con dedicación para la comunidad de desarrolladores y administradores de comunidades de WhatsApp.*

</div>
