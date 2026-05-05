<div align="center">

# ✧ YukiBot MD ✧
**El Bot de WhatsApp Más Completo, Estético y Optimizado**

[![Termux Ready](https://img.shields.io/badge/Optimized_for-Termux-7e57c2?style=for-the-badge&logo=android)](https://termux.com/)
[![Baileys](https://img.shields.io/badge/Powered_by-Baileys-25D366?style=for-the-badge&logo=whatsapp)](https://github.com/WhiskeySockets/Baileys)
[![NodeJS](https://img.shields.io/badge/Node.js-Ready-43853D?style=for-the-badge&logo=node.js)](https://nodejs.org/)

<img src="https://iili.io/qpPn1K7.gif" alt="YukiBot MD" width="120px">

*Un bot multifuncional diseñado para ofrecer una experiencia RPG profunda, minijuegos visuales y herramientas hiper-rápidas, todo corriendo fluidamente en entornos de bajos recursos como Termux.*

</div>

---

## ⚡ ¿Por qué YukiBot MD?

A diferencia de los bots tradicionales que dependen de respuestas de texto aburridas, YukiBot ha sido reescrito con un enfoque en **Interacciones Visuales** y **Mecánicas RPG Complejas**. Todo esto mientras mantiene un rendimiento brutal y una recolección de basura agresiva para evitar bloqueos.

> [!TIP]
> **Rendimiento Puro:** Cuenta con lectura inteligente de base de datos, auto-limpieza de caché en plugins, y un `gameEngine` centralizado que evita fugas de memoria.

---

### ✨ Características Destacadas

| Categoría | Capacidades |
| :--- | :--- |
| **🎮 Juegos Visuales** | **Ahorcado Pro** (Dibujado en tiempo real con `Jimp`), **Akinator Grupal**, **Adivina Disney**, y **Caza del Tesoro (Geoguessr)**. ¡Olvida el texto aburrido! |
| **👑 Sistema RPG** | Economía profunda con **Títulos** (Leyenda, Estrella, Neko, etc.) que otorgan *buffs reales* (ej: +20% en pesca, inmunidad a robos). Minas, mazmorras y crímenes. |
| **🎓 IA y Utilidades** | Escáner de plagio, análisis visual con IA, traductor nativo, humanizador de textos, y un potente solver matemático paso a paso. |
| **📥 Descargas** | Motor de descargas con APIs múltiples (Fallback) para obtener contenido en máxima calidad de TikTok, IG, FB, Pinterest y YouTube. |
| **🛡️ Control de Grupo** | Modo "Solo Admins" que bloquea comandos, anti-enlaces estricto, gestión de alertas y bienvenidas configurables. |

---

## 🚀 Guía Rápida de Instalación

> [!IMPORTANT]  
> Asegúrate de tener una conexión estable durante la primera instalación, ya que el bot compilará dependencias clave como `Jimp` y `Aki-API`.

### 📱 Instalación en Termux (Android)

1. **Preparar el entorno:**
   ```bash
   termux-setup-storage
   apt update && apt upgrade -y
   pkg install -y git nodejs ffmpeg imagemagick yarn
   ```

2. **Clonar e Instalar:**
   ```bash
   git clone https://github.com/ocrespof/BOT.git
   cd BOT
   yarn install
   npm install
   ```

3. **Iniciar el Bot:**
   ```bash
   npm start
   ```
   *(Escanea el código QR que aparecerá en tu pantalla con tu WhatsApp vinculado)*.

---

## ⚙️ Mantenimiento 24/7 (PM2)

Para mantener a YukiBot vivo en el fondo mientras usas tu teléfono:

```bash
# Evitar que Termux se duerma
termux-wake-lock
npm i -g pm2
pm2 start index.js --name "YukiBot"
pm2 save
pm2 logs
```

<details>
<summary><strong>🎛️ Comandos Útiles de PM2</strong></summary>

- `pm2 stop YukiBot` : Pausar el bot temporalmente.
- `pm2 restart YukiBot` : Reiniciar el proceso.
- `pm2 logs YukiBot` : Ver los registros de la consola en tiempo real.
</details>

---

## 🛠️ Solución de Problemas

**¿Bot desconectado o terminal en blanco?**
Si tu teléfono se reinicia o Termux se cierra de golpe:
```bash
cd ~/BOT && npm start
```

**¿Necesitas vincular un nuevo número?**
Si quieres borrar la sesión actual y escanear un QR nuevo:
```bash
cd ~/BOT
rm -rf Sessions/Owner
npm start
```

---

<div align="center">

### 💖 Agradecimientos y APIs

Agradecimientos especiales a las APIs públicas que hacen posible este proyecto:
`CoinGecko`, `Random-Word-API`, y el increíble trabajo de `Aki-API`.

*Hecho con dedicación para la comunidad de creadores de bots de WhatsApp.*
</div>
