<div align="center">

# ✧ Bot MD ✧

**Bot de WhatsApp Optimizado para Termux · Baileys Multi-Device**

[![Termux Ready](https://img.shields.io/badge/Optimized_for-Termux-7e57c2?style=for-the-badge&logo=android)](https://termux.com/)
[![Baileys](https://img.shields.io/badge/Powered_by-Baileys-25D366?style=for-the-badge&logo=whatsapp)](https://github.com/WhiskeySockets/Baileys)
[![NodeJS](https://img.shields.io/badge/Node.js-v21+-43853D?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![ESM](https://img.shields.io/badge/Pure-ESM-blue?style=for-the-badge)](https://nodejs.org/api/esm.html)

*Bot multifuncional con economía RPG, suite académica con IA, descargador multimedia multi-plataforma y 60+ reacciones animadas. Diseñado para rendimiento en entornos de bajos recursos.*

</div>

---

## ⚡ Arquitectura

```
bot/
├── index.js              # Boot + conexión Baileys + anti-crash
├── main.js               # Hot path: middleware pipeline + routing
├── config.js             # APIs, owner, prefixes
├── core/
│   ├── message.js        # Message shimming (m.reply, m.quoted.download)
│   ├── exif.js           # Sticker metadata (EXIF/WebP)
│   └── system/
│       ├── commandLoader.js   # Auto-discovery de plugins
│       ├── database.js        # JSON DB con guardado debounced
│       └── initDB.js          # Schema de usuario/chat/settings
├── cmds/
│   ├── downloads/        # FB, IG, TT, YT, Pinterest, Scribd, GDrive, Mediafire
│   ├── academia/         # IA académica: solve, resumir, humanizar, plagio, detIA
│   ├── economia/         # RPG: daily, work, mine, hunt, casino, shop, trade
│   ├── juegos/           # Ahorcado, TicTacToe, Connect4, Blackjack, Wordle
│   ├── stickers/         # Sticker, brat, getpack, emojimix
│   ├── group/            # Admin: kick, warn, open/close, setgpbanner
│   ├── profile/          # Perfil, nivel, leaderboard
│   ├── Reactions/        # 60+ reacciones animadas con GIFs de Tenor
│   └── utils/            # IA general, OCR, TTS, clima, QR, inspect
└── utils/
    ├── ai.js             # Cliente IA centralizado con fallback chain
    ├── tools.js          # Funciones compartidas (formateo, XP, grupo)
    ├── downloader.js     # Motor de descargas con fallback APIs
    └── gameEngine.js     # Motor de juegos concurrentes
```

---

## 🔧 Optimizaciones de Rendimiento

| Optimización | Impacto |
|:---|:---|
| **Hot-path cacheado** | `today` string con TTL 60s, prefix comparison directa (sin JSON.stringify) |
| **Group metadata cacheado** | NodeCache con TTL 5 min, evita llamadas de red por mensaje |
| **Antilink condicional** | Solo se ejecuta en grupos, no en chats privados |
| **DB guardado debounced** | Escritura diferida, no síncrona por comando |
| **Purga de dependencias** | Eliminadas: jimp, human-readable, qrcode, lodash, moment (core), aki-api, gradient-string, pdfkit, yargs, node-schedule |
| **tools.js limpio** | De 302 a 160 LOC: eliminadas 15 funciones muertas |
| **ESM puro** | Zero `require()` shims, tree-shakeable |
| **Message buffer limitado** | Máximo 25 chats × 50 msgs, con eviction automática |

---

## ✨ Características

### 📥 Descargas (Quote-to-Download)

Todos los comandos soportan **citar un mensaje con enlace** en lugar de escribir la URL:

- **YouTube**: `.p` (audio) / `.play2` (video) con metadata (título, canal, duración)
- **Facebook**: `.fb` con título, resolución y duración
- **TikTok/Instagram/Pinterest**: `.tt` / `.ig` / `.pin`
- **Twitter/X**: `.twitter`
- **Documentos**: `.scribd` / `.grive` / `.mf` / `.studocu`

### 🎓 Academia (IA Modo Absoluto)

Prompts de alta fidelidad: sin emojis, sin relleno, solo información verificada.

- **Solver**: Resolución paso a paso con verificación algebraica
- **Resumir**: Extracción quirúrgica (tesis + ideas + datos clave)
- **Humanizar**: Técnicas de burstiness + inversión sintáctica
- **Detector IA/Plagio**: Análisis forense de perplejidad y patrones
- **Diccionario**: Entrada lexicográfica RAE con etimología
- **ChatPDF**: Análisis basado exclusivamente en evidencia del documento

### 💰 Economía RPG

Sistema completo con daily/weekly/monthly, trabajo, minería, caza, casino, slots, ruleta, robos, mazmorras, aventuras, tienda con lootboxes, títulos con buffs reales, e intercambio de items.

### 🎮 Juegos

Ahorcado visual, TicTacToe, Connect4, Blackjack, Wordle, Trivia, Piedra-papel-tijeras, Adivinanzas. Todos con apuestas de economía.

### 🎭 60+ Reacciones

GIFs animados de Tenor: hug, kiss, pat, slap, dance, cry, blush, cuddle, y muchas más.

---

## 🚀 Instalación

### Termux (Android)

```bash
# 1. Preparar entorno
termux-setup-storage
apt update && apt upgrade -y
pkg install -y git nodejs ffmpeg

# 2. Clonar e instalar
git clone https://github.com/ocrespof/BOT.git
cd BOT
npm install

# 3. Iniciar
npm start
```

> Escanea el código QR o usa la opción de código de 8 dígitos.

### PM2 (24/7)

```bash
termux-wake-lock
npm i -g pm2
pm2 start index.js --name "Bot" --max-memory-restart 512M
pm2 save
```

| Comando | Descripción |
|:---|:---|
| `pm2 stop Bot` | Pausar |
| `pm2 restart Bot` | Reiniciar |
| `pm2 logs Bot` | Ver logs en tiempo real |

---

## 🛠️ Solución de Problemas

| Problema | Solución |
|:---|:---|
| Bot desconectado | `cd ~/BOT && npm start` |
| Vincular nuevo número | `rm -rf Sessions/Owner && npm start` |
| Error de memoria | Agregar `--max-old-space-size=512` al script start |
| Dependencia faltante | `npm install` dentro de la carpeta BOT |

---

<div align="center">

*Hecho con dedicación para la comunidad de creadores de bots de WhatsApp.*

</div>
