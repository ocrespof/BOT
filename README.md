> [!NOTE]
> **BOTDEPRUEBA (Antiguo YukiBot) ahora está optimizado específicamente para Termux y plataformas de bajos recursos.**

<p align="center"> 
<img src="https://iili.io/qpPn1K7.gif" alt="BOTDEPRUEBA" style="width: 75%; height: auto; max-width: 100px;">

<p align="center"> 
<a href="#"><img title="BOTDEPRUEBA" src="https://img.shields.io/badge/¡Bot Ligero y Optimizado para Termux! -purple?colorA=%239b33b0&colorB=%231c007b&style=for-the-badge"></a> 
</p>

---

## 🪾 Descripción 

**BOTDEPRUEBA** es un bot de WhatsApp funcional basado en `baileys`, reestructurado y purgado para enfocarse estrictamente en la utilidad, administración y velocidad extrema en Android. 

Se eliminaron módulos pesados (Anime, Gacha, NSFW, bases de datos colosales) para asegurar **cero lag**, implementando *Timeouts* en red y lectura inteligente de disco duro. 

---

## 🥦 Características Destacadas

- **Rapidez Extrema:** Guarda asíncrono y recolector temporal de memoria mejorado de NodeJS.
- **Inteligencia Artificial y Academia:** Detector de IA y plagio, humanización y parafraseo, OCR, procesador de PDFs y solver matemático integrado.
- **Utilidades y Espiritualidad:** Obtención interactiva de versículos bíblicos y devocionales diarios.
- **Multimedia y Reacciones:** Descargas de redes y comandos exclusivos de emociones usando de Pinkie Pie.
- **Moderación:** Sistema de warns, anti-links, hidetags y control absoluto.
- **Stickers Livianos:** Creadores minimalistas listos (`sticker`, `toimg` y modo texto urbano `brat`).

---

## Información Importante

Evita completamente usar forks, mods o versiones alteradas de Baileys.
No utilices “baileys mods” ni variantes no oficiales.
Siempre usa la librería principal y oficial de Baileys.

---

### Instalaciónes Básicas

<details>
<summary><strong>🍒 Cloud</strong> — Shell</summary>

```bash
git clone https://github.com/ocrespof/BOT.git
```

```bash
cd BOT
```

```bash
yarn install
```

```bash
npm install
```

```bash
npm start
```

</details>

<details>
<summary><strong>🍒 Termux</strong> — Manualmente</summary>

```bash
termux-setup-storage
```
```bash
apt update && apt upgrade && pkg install -y git nodejs ffmpeg imagemagick yarn
```

```bash
git clone https://github.com/ocrespof/BOT.git
```

```bash
cd BOT
```

```bash
yarn install
```

```bash
npm install
```

```bash
npm start
```

> *Si aparece **(Y/I/N/O/D/Z) [default=N] ?** use la letra **"y"** y luego **"ENTER"** para continuar con la instalación.*

</details>

<details>
<summary><strong>🍒 Comandos para tener mas tiempo activo</strong> — el Bot</summary>

> *Ejecutar estos comandos dentro de la carpeta BOT*
```bash
termux-wake-lock && npm i -g pm2 && pm2 start index.js && pm2 save && pm2 logs 
``` 

#### Opciones Disponibles
> *Esto eliminará todo el historial que hayas establecido con PM2:*
```bash 
pm2 delete index
``` 

> *Si tienes cerrado Termux y quiere ver de nuevo la ejecución use:*
```bash 
pm2 logs 
``` 

> *Si desea detener la ejecución de Termux use:*
```bash 
pm2 stop index
``` 

> *Si desea iniciar de nuevo la ejecución de Termux use:*
```bash 
pm2 start index
```

--- 

### En caso de detenerse
> _Si despues que ya instalastes tu bot y termux te salta en blanco, se fue tu internet o reiniciaste tu celular, solo realizaras estos pasos:_
```bash
cd && cd BOT && npm start
```
---

### Obtener nuevo inicio de Sessión 
> *Detén el bot, haz click en el símbolo (ctrl) [default=z] usar la letra "z" + "ENTER" hasta que salga algo verdes similar a: `BOT $`*
 
```bash 
cd && cd BOT && rm -rf Sessions/Owner && npm start
```
</details>

---

### Patrocinadores del Proyecto

<details>
<summary><strong>☁️ Yuki</strong> — API</summary>

<div align="center">
  <a href="https://api.yuki-wabot.my.id">
    <img src="https://api.yuki-wabot.my.id/favicon.ico" alt="Logo" height="125px">
  </a>
</div>
