<div align="center">

# ✦ BOT — High-Performance WhatsApp Bot ✦

**Bot de WhatsApp de Alta Velocidad con Motor SQLite · Baileys Multi-Device · Pure ESM**

[![Termux Ready](https://img.shields.io/badge/Optimized_for-Termux-7e57c2?style=for-the-badge&logo=android)](https://termux.com/)
[![Baileys](https://img.shields.io/badge/Powered_by-Baileys_v7-25D366?style=for-the-badge&logo=whatsapp)](https://github.com/WhiskeySockets/Baileys)
[![NodeJS](https://img.shields.io/badge/Node.js-%3E%3D22.5.0-43853D?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![Database](https://img.shields.io/badge/Database-SQLite_WAL-003B57?style=for-the-badge&logo=sqlite)](https://www.sqlite.org/)
[![Quotly](https://img.shields.io/badge/Stickers-Telegram_Quotly-0088cc?style=for-the-badge&logo=telegram)](https://telegram.org/)

*BOT es un framework de bot de WhatsApp de última generación optimizado para alto rendimiento en Termux (Android) y servidores VPS de bajos recursos. Cuenta con base de datos transaccional SQLite en modo WAL, auto-reparación de llaves de cifrado Signal, motor híbrido de reacciones, suite de juegos interactivos en tiempo real, economía RPG completa, herramientas académicas con IA y moderación inteligente de grupos.*

</div>

---

## ⚡ Arquitectura del Proyecto

```
BOT-main/
├── index.js              # Arranque del bot, SQLite sync, Signal Key Store wrapper y auto-reconexión
├── main.js               # Pipeline de middlewares y enrutamiento principal de comandos
├── config.js             # Configuración centralizada de APIs, APIKeys y accesos
├── package.json          # Dependencias y configuración ESM
├── core/
│   ├── message.js        # Serialización de mensajes, JID decoders y helpers de envío seguro
│   ├── utils.js          # Resolución segura de LIDs a números de WhatsApp reales
│   ├── exif.js           # Generación de metadatos EXIF para Stickers WebP
│   └── system/
│       ├── commandLoader.js   # Carga y descubrimiento automático de plugins en /cmds
│       ├── database.js        # Motor SQLite (node:sqlite) + TTL Cache + Unit of Work
│       ├── initDB.js          # Estructuras por defecto de usuarios, chats y ajustes
│       ├── antilink.js        # Detector y moderador automático de enlaces sospechosos
│       ├── antistatus.js      # Detector de spam por menciones de estado grupal
│       └── events.js          # Gestor de bienvenida, despedida y avisos del sistema
├── cmds/
│   ├── academia/         # Herramientas académicas asistidas por IA (APA, Solver, Wiki, etc.)
│   ├── downloads/        # Descargas multimedia (YouTube, IG, TikTok, FB, Pinterest, Docs)
│   ├── economia/         # Sistema RPG, Banco, Tienda, Trabajo, Títulos y Trueques
│   ├── group/            # Configuración grupal, foto de grupo, expulsiones y moderación
│   ├── herramientas/     # Utilidades de red, traducción, IA, captura web, ViewOnce (.read) y OCR
│   ├── juegos/           # Juegos interactivos (TicTacToe 2.0, Ahorcado 2.0, Wordle, C4, Blackjack)
│   ├── main/             # Menú principal (.menu) e información del bot
│   ├── owner/            # Comandos de mantenimiento y administración del bot
│   ├── profile/          # Perfiles de usuario, fotos de perfil (.getpic), matrimonios y nivelación
│   ├── reactions/        # Motor de 60+ reacciones animadas híbridas
│   └── stickers/         # Creación de stickers (básico, citas .q, .q reply, brat, getpack)
└── utils/
    ├── ai.js             # Cliente de IA con cadena de fallbacks
    ├── gameEngine.js     # Motor transaccional de juegos concurrentes en tiempo real
    ├── healthChecker.js  # Monitoreo continuo de salud y estado de las APIs
    └── tools.js          # Formateadores de tiempo, monedas y utilidades compartidas
```

---

## 🔧 Optimizaciones y Tecnologías Core

| Optimización | Descripción e Impacto |
|:---|:---|
| **Signal Keystore Auto-Repair** | Envoltorio bidireccional sobre `makeCacheableSignalKeyStore` que convierte automáticamente objetos deserializados de JSON a `Buffer` nativo de Node.js, eliminando fallos criptográficos (`Expected Buffer instead of: Object`). |
| **Limpieza de Ratchets Antiguos** | Función de auto-purga en arranque (`purgeSenderKeys`) para resolver desfases de descifrado en sesiones inactivas sin perder las credenciales principales (`creds.json`). |
| **Base de Datos SQLite (WAL)** | Persistencia ultrarrápida usando `node:sqlite` en modo WAL (`journal_mode = WAL`). Los datos de usuarios y chats se sincronizan de forma atómica y sin bloquear el hilo principal. |
| **Pipeline de Descargas con Buffering** | Descarga previa en memoria a través de `Buffer` para evitar fallos de streaming y rechazos de CDN en WhatsApp (`.play`, `.play2`, `.ig`, `.tt`, `.fb`, `.pin`). |
| **Stickers de Citas (.q & .q reply)** | Generación de citas estilo Telegram con dimensionamiento adaptativo en 5 niveles para textos largos y soporte de burbujas de respuesta con `.q reply` / `.qr`. |
| **Recuperador ViewOnce (.read)** | Desencriptación de fotos, videos y audios de vista única vinculando los IDs con la memoria en tiempo real (`msgBuffer` y `msgStore`) para extraer la `mediaKey` original. |
| **Limpieza Autolimpiante** | Tarea en segundo plano que purga archivos temporales expirados de la carpeta `./tmp`, manteniendo el consumo de espacio en disco al mínimo en Termux. |

---

## ✨ Módulos y Funcionalidades Destacadas

### 📥 Descargas Multimedia & Documentos
- **YouTube (`.play` / `.play2` / `.mp3` / `.mp4`)**: Descarga directa de audios y videos con multi-proveedor y fallback a scrapers internos.
- **Redes Sociales**: TikTok sin marca de agua (`.tt`), Instagram Reels y Carruseles (`.ig`), Facebook Videos (`.fb`), Pinterest (`.pin`) y Twitter/X (`.x`).
- **Documentos Académicos**: Studocu (`.studocu`), Scribd (`.scribd`), Google Drive (`.gdrive`) y Mediafire (`.mf`).

### 🎨 Stickers & Citas Personalizadas
- **Citas Telegram (`.q` / `.qr`)**: Genera citas individuales o grupales (`.q2` a `.q10`) con fondos personalizables (`--dark`, `--red`, `--blue`, etc.).
- **Modo Respuesta (`.q reply [texto]`)**: Agrega el recuadro superior del mensaje citado para conversaciones contextualizadas.
- **Stickers Brat (`.brat` / `.bratv`)**: Generador de stickers con la estética característica en versiones estática y animada.

### 👥 Administración Grupal & Moderación
- **Foto de Grupo (`.setgpbanner`)**: Cambia la foto del grupo respondiendo a una imagen.
- **Obtener Foto (`.getpic`)**: Descarga la foto de perfil en alta resolución de cualquier miembro o grupo.
- **Moderación Automática**: Anti-Link, Anti-Phishing y Anti-Status.
- **Advertencias (`.warn` / `.delwarn` / `.warns`)**: Control de sanciones con límite configurable.

### 💰 Economía RPG & Juegos
- **Finanzas**: Cartera, Banco (`.deposit` / `.withdraw`), empleos (`.work`, `.mine`, `.hunt`, `.fish`) y retos matemáticos (`.math`).
- **Juegos**: TicTacToe 2.0 (`.ttt`), Ahorcado 2.0 (`.ahorcado`), Conecta 4 (`.c4`), Blackjack 21 (`.bj`), Wordle y Trivia.
- **Aventuras**: Mazmorras (`.dungeon`), Incursiones de Jefe (`.raid`) y Títulos equipables con mejoras pasivas (`.settitle`).

### 🎓 Academia Asistida por IA
- **Referencias Bibliográficas (`.apa`)**: Generación en formato APA 7ma edición.
- **Resolución Matemática (`.solve`)**: Paso a paso de ecuaciones y problemas.
- **Herramientas de Texto**: Resumidor (`.res`), corrector (`.corr`), humanizador (`.hum`) y detector de IA (`.detia`).

---

## 🚀 Instalación y Despliegue

### Requisitos Previos
- **Node.js >= 22.5.0** (Requerido para soporte nativo de `node:sqlite`).
- **FFmpeg** instalado en el sistema.

### Instalación en Termux (Android)
```bash
# 1. Actualizar paquetes y conceder permisos de almacenamiento
termux-setup-storage
apt update && apt upgrade -y
pkg install -y git nodejs ffmpeg

# 2. Clonar el repositorio
git clone https://github.com/ocrespof/BOT.git
cd BOT

# 3. Instalar dependencias
npm install

# 4. Iniciar el bot
npm start
```

### Despliegue 24/7 con PM2
```bash
termux-wake-lock
npm i -g pm2
pm2 start index.js --name "BOT" --max-memory-restart 400M
pm2 save
```

---

## 🛠️ Comandos de Gestión y Mantenimiento

```bash
pm2 logs BOT      # Ver logs en tiempo real
pm2 restart BOT   # Reiniciar el bot
pm2 stop BOT      # Detener el bot
```

---

<div align="center">

*Desarrollado con dedicación para la comunidad de administradores de WhatsApp.*

</div>
