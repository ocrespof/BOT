<div align="center">

# ✧ YukiBot MD ✧
**A Ultra-Lightweight, High-Performance WhatsApp Assistant**

[![Termux Ready](https://img.shields.io/badge/Optimized_for-Termux-7e57c2?style=for-the-badge&logo=android)](https://termux.com/)
[![Baileys](https://img.shields.io/badge/Powered_by-Baileys-25D366?style=for-the-badge&logo=whatsapp)](https://github.com/WhiskeySockets/Baileys)
[![NodeJS](https://img.shields.io/badge/Node.js-Ready-43853D?style=for-the-badge&logo=node.js)](https://nodejs.org/)

<img src="https://iili.io/qpPn1K7.gif" alt="YukiBot MD" width="120px">

*A minimalist yet incredibly powerful WhatsApp bot engineered for absolute speed and reliability on Android platforms.*

</div>

---

## ⚡ Why YukiBot MD?

YukiBot has been aggressively optimized, stripping away heavy databases and monolithic modules to ensure **zero-lag execution** on low-resource environments like Termux.

> [!TIP]
> **Performance First:** Features intelligent disk reading, network timeouts, and asynchronous saves to maximize uptime.

### ✨ Core Features
| Category | Capabilities |
| :--- | :--- |
| **🚀 Speed** | Asynchronous disk I/O, advanced Node.js garbage collection, and global error handling. |
| **🎓 AI & Academy** | Plagiarism scanning, PDF analysis, text humanization, OCR, and step-by-step math solver. |
| **📥 Media Engine** | Multi-API fallback system for flawless downloads from TikTok, IG, FB, Pinterest, Scribd, and Studocu. |
| **🎨 Interactions** | Lightweight sticker generator, animated brat text, and high-quality Anime GIF reactions. |
| **🛡️ Moderation** | Anti-links, advanced warn system, stealth tags, and total group traffic control. |

---

## 🚀 Quick Start Guide

> [!IMPORTANT]  
> Do not use modified or unofficial forks of `baileys`. YukiBot relies strictly on the official WhisperSockets library.

### 📱 Installation via Termux (Android)

1. **Setup Environment:**
   ```bash
   termux-setup-storage
   apt update && apt upgrade -y
   pkg install -y git nodejs ffmpeg imagemagick yarn
   ```

2. **Clone & Install:**
   ```bash
   git clone https://github.com/ocrespof/BOT.git
   cd BOT
   yarn install
   npm install
   ```

3. **Start the Bot:**
   ```bash
   npm start
   ```

---

## ⚙️ Process Management (24/7 Uptime)

To keep the bot running continuously in the background, we recommend using PM2:

```bash
# Keep Termux awake and start PM2
termux-wake-lock
npm i -g pm2
pm2 start index.js --name "YukiBot"
pm2 save
pm2 logs
```

<details>
<summary><strong>🎛️ Useful PM2 Commands</strong></summary>

- `pm2 stop YukiBot` : Pause the bot
- `pm2 restart YukiBot` : Restart the process
- `pm2 delete YukiBot` : Remove from background tasks
- `pm2 logs YukiBot` : View real-time terminal output
</details>

---

## 🛠️ Troubleshooting

**Lost Connection or Blank Terminal?**
If your phone reboots or Termux closes unexpectedly:
```bash
cd ~/BOT && npm start
```

**Need to Pair a New Number?**
If you want to clear your current session and scan a new QR / Pairing Code:
```bash
cd ~/BOT
rm -rf Sessions/Owner
npm start
```

---

<div align="center">

### 💖 Acknowledgments & APIs

Special thanks to our incredible API sponsors that power our downloaders:
<br>
<a href="https://api.yuki-wabot.my.id">
  <img src="https://api.yuki-wabot.my.id/favicon.ico" alt="Yuki API" height="60px">
</a>

*Made with love for the WhatsApp Bot community.*
</div>
