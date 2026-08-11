<div align="center">

# ✦ BOT — High-Performance WhatsApp Bot ✦

**Bot de WhatsApp de Alta Velocidad con Motor SQLite · Baileys Multi-Device · Pure ESM**

[![Termux Ready](https://img.shields.io/badge/Optimized_for-Termux-7e57c2?style=for-the-badge&logo=android)](https://termux.com/)
[![Baileys](https://img.shields.io/badge/Powered_by-Baileys-25D366?style=for-the-badge&logo=whatsapp)](https://github.com/WhiskeySockets/Baileys)
[![NodeJS](https://img.shields.io/badge/Node.js-%3E%3D22.5.0-43853D?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![Database](https://img.shields.io/badge/Database-SQLite-003B57?style=for-the-badge&logo=sqlite)](https://www.sqlite.org/)
[![Giphy](https://img.shields.io/badge/Reactions-Giphy_API-FF6600?style=for-the-badge&logo=giphy)](https://giphy.com/)

*BOT es un framework de bot de WhatsApp de última generación optimizado para alto rendimiento en Termux y VPS de bajos recursos. Cuenta con base de datos transaccional SQLite en modo WAL, motor híbrido de reacciones (Giphy + Stellar), suite de juegos interactivos, economía RPG con banco y títulos equipables, comandos académicos asistidos por IA y moderación inteligente de comunidades.*

</div>

---

## ⚡ Arquitectura del Proyecto

```
BOT-main/
├── index.js              # Arranque del bot, SQLite sync, reconexión limpia y anti-crash
├── main.js               # Pipeline de middlewares y enrutamiento principal de comandos
├── config.js             # Configuración centralizada de APIs, APIKeys y accesos
├── core/
│   ├── message.js        # Shimming de mensajes (m.reply, m.quoted.download, JID decoder)
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
│   ├── group/            # Configuración, foto de grupo, expulsión masiva y moderación
│   ├── herramientas/     # Utilidades de red, traducción, IA, captura web y OCR
│   ├── juegos/           # Juegos interactivos (TicTacToe 2.0, Ahorcado 2.0, Wordle, C4, Trivia)
│   ├── main/             # Menú principal interactivo (.menu) e información del bot
│   ├── owner/            # Comandos administrativos y de gestión del bot
│   ├── profile/          # Perfiles de usuario, fotos de perfil (.getpic) y nivelación
│   ├── reactions/        # Motor híbrido de 60+ reacciones animadas (Giphy + Stellar Anime)
│   └── stickers/         # Creación de stickers (básico, cita .q, brat, bratv, getpack)
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
| **Base de Datos SQLite (WAL)** | Persistencia ultrarrápida usando `node:sqlite` en modo WAL (`journal_mode = WAL`). Los datos de usuarios y chats se sincronizan de forma atómica y sin bloquear el hilo principal de ejecución en Node.js. |
| **Motor Híbrido de Reacciones** | Consulta en tiempo real a **Giphy API** para GIFs animados variados (personas reales, cine, memes y caricaturas), con fallback automático a **Stellar API** (Anime). |
| **TicTacToe 2.0 (`.ttt`)** | Tablero HD con casillas numéricas `1️⃣..9️⃣`, soporte para salas públicas de espera, desafíos directos y comando de rendición (`surrender` / `rendirme`). |
| **Ahorcado 2.0 (`.ahorcado`)** | Adivinanza de palabras con historial de letras usadas (`.guess <letra>`), etapas visuales descargables y bonus por adivinar la palabra completa. |
| **Banca y Economía RPG** | Separación entre **Cartera** (susceptible a robos `.steal`) y **Banco** (protección 100%). Tienda con **Títulos equipables** que otorgan beneficios pasivos (+15% trabajo, inmunidad a robo, etc.). |
| **Limpieza Autolimpiante** | Tarea programada cada 15 minutos que purga archivos temporales expirados de la carpeta `./tmp`, manteniendo el consumo de espacio en disco al mínimo en Termux. |
| **Descargas Resilientes (Quote-to-Download)** | Todos los comandos de descarga (`.play`, `.ig`, `.tt`, `.pin`) permiten citar un mensaje que contenga un enlace sin requerir pegar la URL nuevamente. |

---

## ✨ Funcionalidades Destacadas

### 🎭 Reacciones Animadas (60+ Disparadores)
Soporta más de 60 reacciones dinámicas tanto en español como en inglés (`.abrazar`, `.besar`, `.bofetada`, `.dormir`, `.sonrojarse`, `.bailar`, `.hug`, `.kiss`, `.slap`, etc.).

### 👥 Administración Grupal
- **Foto de Grupo (`.setgpbanner` / `.grouppicture`)**: Cambia la foto del grupo respondiendo a una imagen.
- **Obtener Foto (`.getpic` / `.getpp`)**: Descarga la foto de perfil en alta resolución de cualquier miembro o grupo.
- **Expulsión Masiva (`.kick @all`)**: Exclusivo para el creador del bot, con protección automática para administradores.
- **Moderación Inteligente**: Anti-Link, Anti-Phishing y Anti-Status.

### 🎓 Academia Asistida por IA
- `.apa`: Generador de referencias bibliográficas en formato APA 7ma edición.
- `.solve`: Resolución matemática detallada paso a paso.
- `.res` / `.corr` / `.hum`: Resumidor de textos, corrector ortográfico y humanizador de redacción.

---

## 🚀 Instalación y Despliegue

### Requisitos Previos
- **Node.js >= 22.5.0** (Requerido para soporte nativo de `node:sqlite`).
- **FFmpeg** instalado en el sistema.

### Instalación en Termux (Android)
```bash
# 1. Actualizar paquetes y conceder almacenamiento
termux-setup-storage
apt update && apt upgrade -y
pkg install -y git nodejs ffmpeg

# 2. Clonar el repositorio
git clone https://github.com/ocrespof/BOT.git
cd BOT

# 3. Instalar dependencias e iniciar
npm install
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

## 🛠️ Comandos PM2 Útiles

```bash
pm2 logs BOT      # Ver logs en tiempo real
pm2 restart BOT   # Reiniciar el bot
pm2 stop BOT      # Detener el bot
```

---

<div align="center">

*Desarrollado con dedicación para la comunidad de administradores de WhatsApp.*

</div>
