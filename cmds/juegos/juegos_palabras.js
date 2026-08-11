/**
 * 📝 juegos_palabras.js — Juegos interactivos basados en palabras, trivias y adivinanzas.
 * Reúne: ahorcado, adivinanza, trivia, wordle
 */
import { gameEngine } from "../../utils/gameEngine.js";
import axios from "axios";
import translate from "@vitalets/google-translate-api";
import https from "https";

const normalize = (str) => {
  if (!str || typeof str !== "string") return "";
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
};

const getKeywords = (str) => {
  const words = normalize(str)
    .replace(/[^\w\sñ]/gi, "")
    .split(/\s+/);
  return words.filter(
    (w) =>
      w.length > 3 &&
      !["como", "para", "pero", "esto", "aquel", "tiene", "esta"].includes(w),
  );
};

const decodeHTML = (str) => {
  return str
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
};

// ── AHORCADO DATA ──
const hangmanImages = [
  "https://upload.wikimedia.org/wikipedia/commons/8/8b/Hangman-0.png",
  "https://upload.wikimedia.org/wikipedia/commons/3/30/Hangman-1.png",
  "https://upload.wikimedia.org/wikipedia/commons/7/70/Hangman-2.png",
  "https://upload.wikimedia.org/wikipedia/commons/9/97/Hangman-3.png",
  "https://upload.wikimedia.org/wikipedia/commons/2/27/Hangman-4.png",
  "https://upload.wikimedia.org/wikipedia/commons/6/6b/Hangman-5.png",
  "https://upload.wikimedia.org/wikipedia/commons/d/d6/Hangman-6.png",
];

async function getHangmanImageBuffer(attempts) {
  try {
    const url = hangmanImages[attempts];
    const res = await axios.get(url, {
      responseType: "arraybuffer",
      timeout: 5000,
    });
    return Buffer.from(res.data);
  } catch (e) {
    console.error(
      `[Ahorcado] Error descargando imagen de la horca (${attempts}):`,
      e.message,
    );
    return null;
  }
}

async function obtenerPalabra() {
  try {
    const res = await axios.get(
      "https://random-word-api.herokuapp.com/word?lang=es",
    );
    if (res.data && res.data.length > 0) {
      return res.data[0]
        .toUpperCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
    }
  } catch (e) {
    console.error("API de palabras falló, usando fallback");
  }
  const fallback = [
    "PROGRAMACION",
    "COMPUTADORA",
    "INTELIGENCIA",
    "WHATSAPP",
    "JAVASCRIPT",
    "TECLADO",
    "DESARROLLADOR",
    "ESPAÑA",
    "TELEFONO",
    "ESCRITORIO",
    "PANTALLA",
    "AURICULARES",
    "VENTANA",
    "BIBLIOTECA",
    "DICCIONARIO",
    "ASTRONOMIA",
    "GEOGRAFIA",
    "HISTORIA",
    "LITERATURA",
    "CANTANTE",
    "PELICULA",
    "UNIVERSO",
    "GALAXIA",
    "SISTEMA",
    "PLANETA",
    "SATELITE",
    "GRAVEDAD",
    "CIENCIA",
    "TECNOLOGIA",
    "INGENIERIA",
    "MATEMATICAS",
    "QUIMICA",
    "BIOLOGIA",
    "FISICA",
    "MEDICINA",
    "ARQUITECTURA",
    "CULTURA",
    "DEPORTE",
    "FUTBOL",
    "BALONCESTO",
    "ATLETISMO",
    "NATACION",
    "GIMNASIA",
    "AVENTURA",
    "MISTERIO",
    "FANTASIA",
    "LEYENDA",
    "MITOLOGIA",
    "HISTORIETA",
    "DIVERSION",
    "ENTRETENIMIENTO",
  ];
  return fallback[Math.floor(Math.random() * fallback.length)];
}

// ── TRIVIA DATA ──
const bancoPreguntasLocales = [
  {
    p: "¿Qué protocolo se utiliza para enviar correos electrónicos?",
    r: "smtp",
  },
  { p: "¿Qué significa HTML?", r: "hypertext markup language" },
  { p: "¿Cuál es el puerto predeterminado para HTTP?", r: "80" },
  { p: "¿Qué significa IP?", r: "internet protocol" },
  { p: "¿Qué dispositivo conecta diferentes redes entre sí?", r: "router" },
  { p: "¿Cuál es la unidad básica de información en informática?", r: "bit" },
  { p: "¿Qué protocolo se usa para la transferencia de archivos?", r: "ftp" },
  {
    p: "¿Qué componente es considerado el cerebro de la computadora?",
    r: "cpu",
  },
  { p: "¿Qué significa RAM?", r: "random access memory" },
  {
    p: "¿Qué lenguaje de programación es conocido por su logo de una taza de café?",
    r: "java",
  },
];

// ── WORDLE DATA ──
const palabras5 = [
  "perro",
  "gatos",
  "tigre",
  "leona",
  "monte",
  "playa",
  "arena",
  "verde",
  "negro",
  "blusa",
  "libro",
  "cielo",
  "noche",
  "luces",
  "pared",
  "suelo",
  "banca",
  "largo",
  "corto",
  "antes",
  "campo",
  "plaza",
  "llama",
  "punto",
  "reloj",
  "media",
  "barco",
  "avion",
  "juego",
  "radio",
  "danza",
  "rueda",
  "feria",
  "nuevo",
  "viejo",
  "dulce",
  "claro",
  "marca",
  "tinta",
  "fondo",
  "silla",
  "linea",
  "disco",
  "carro",
  "metro",
  "clase",
  "curva",
  "final",
  "bruja",
  "trago",
  "siglo",
  "dolor",
  "cruel",
  "digno",
  "fuego",
  "globo",
  "hueso",
  "jaula",
  "karma",
  "limon",
  "mundo",
  "nieve",
  "opera",
  "piano",
  "queso",
  "rugby",
  "salsa",
  "temor",
  "unico",
  "valle",
  "yunke",
  "zonas",
  "abrir",
  "beber",
  "coser",
  "decir",
  "errar",
  "fugaz",
  "guiar",
  "helar",
  "islas",
  "joven",
  "koala",
  "lunar",
  "mango",
  "noble",
  "orden",
  "peces",
  "razon",
  "sanar",
];

const renderWordle = (intentos) =>
  intentos.map((i) => i.map((l) => l.emoji).join("")).join("\n");

const evaluarIntento = (guess, target) => {
  const result = [],
    targetArr = target.split(""),
    guessArr = guess.split(""),
    used = Array(5).fill(false);
  for (let i = 0; i < 5; i++) {
    if (guessArr[i] === targetArr[i]) {
      result[i] = { letter: guessArr[i], emoji: "🟩", status: "correct" };
      used[i] = true;
    }
  }
  for (let i = 0; i < 5; i++) {
    if (result[i]) continue;
    const idx = targetArr.findIndex((c, j) => c === guessArr[i] && !used[j]);
    if (idx !== -1) {
      result[i] = { letter: guessArr[i], emoji: "🟨", status: "misplaced" };
      used[idx] = true;
    } else result[i] = { letter: guessArr[i], emoji: "⬛", status: "absent" };
  }
  return result;
};

// ── COMANDOS ──

const cmdAhorcado = {
  command: ["ahorcado", "hangman", "ahorca"],
  category: "juegos",
  desc: "Juega al ahorcado visual adivinando la palabra secreta (API Infinita)",
  usage: "[apuesta]",
  cooldown: 3,
  run: async (client, m, args, usedPrefix, command) => {
    if (gameEngine.has(m.chat, "ahorcado"))
      return m.reply("🎮 Ya hay un juego de ahorcado activo en este chat. Usa `.guess <letra>` o envía una letra directamente.");

    let apuesta = 150;
    if (args[0] && !isNaN(args[0])) {
      apuesta = parseInt(args[0]);
      if (apuesta < 10) return m.reply("❌ La apuesta mínima es de 10 XP.");
    }
    const bet = gameEngine.validateBet(m.sender, apuesta);
    if (bet === false)
      return m.reply(
        `❌ No tienes suficiente XP. Tienes *${global.db.data.users[m.sender]?.exp || 0} XP*.`,
      );

    await m.react("🕒");
    const palabraSecreta = await obtenerPalabra();
    const progreso = Array(palabraSecreta.length).fill("_");

    const caption = `🎮 *¡EL AHORCADO INICIADO!* 🎮\n\n` +
      `📌 *Palabra:* \`${progreso.join(" ")}\`\n` +
      `❤️ *Intentos:* 0/6\n` +
      `💰 *Apuesta:* ${bet} XP\n\n` +
      `👉 *¿Cómo jugar?*\n` +
      `• Envía una letra en el chat (o usa \`${usedPrefix}guess <letra>\`)\n` +
      `• O envía la palabra completa si ya la sabes!`;

    const imgBuffer = await getHangmanImageBuffer(0);
    if (imgBuffer) {
      await client.sendMessage(
        m.chat,
        { image: imgBuffer, caption },
        { quoted: m },
      );
    } else {
      await client.sendMessage(
        m.chat,
        {
          text: caption,
        },
        { quoted: m },
      );
    }

    gameEngine.start(
      m.chat,
      "ahorcado",
      m.sender,
      {
        palabra: palabraSecreta,
        progreso,
        intentos: 0,
        letrasUsadas: [],
        maxIntentos: 6,
        apuesta: bet,
        jugador: m.sender,
      },
      {
        timeout: 240000,
        onTimeout: () => {
          const game = gameEngine.get(m.chat, "ahorcado");
          if (game) {
            gameEngine.loss(game.jugador);
            client
              .sendMessage(m.chat, {
                text: `⏰ Tiempo agotado. La palabra secreta era: *${palabraSecreta}*`,
              })
              .catch(() => {});
          }
        },
      },
    );
  },
};

const cmdGuess = {
  command: ["guess", "g", "adivinar", "hm"],
  category: "juegos",
  desc: "Adivina una letra o palabra en el juego de Ahorcado activo.",
  usage: "<letra o palabra>",
  run: async (client, m, args) => {
    if (!gameEngine.has(m.chat, "ahorcado")) {
      return m.reply("❌ No hay ningún juego de ahorcado activo en este chat. Inicia uno con `.ahorcado`.");
    }
    if (!args[0]) {
      return m.reply("⚠️ Ingresa una letra o la palabra completa para adivinar. Ejemplo: `.guess A` o `.guess robot`.");
    }
    m.text = args.join(" ");
    await handleAhorcado(client, m);
  }
};

const cmdAdivinanza = {
  command: ["adivinanza", "acertijo"],
  category: "juegos",
  desc: "Resuelve un acertijo dinámico extraído de una API pública.",
  cooldown: 5,
  run: async (client, m) => {
    if (gameEngine.has(m.chat, "adivinanza")) {
      return m.reply(
        "🧠 Ya hay una adivinanza activa en este chat. ¡Resuélvela primero!",
      );
    }

    await m.reply("Buscando un acertijo en la base de datos pública... 🕵️‍♂️");

    let question = "";
    let answer = "";

    try {
      const agent = new https.Agent({ rejectUnauthorized: false });
      const { data } = await axios.get(
        "https://riddles-api.vercel.app/random",
        { httpsAgent: agent, timeout: 8000 },
      );

      const textToTranslate = `${data.riddle} ||| ${data.answer}`;
      const translated = await translate(textToTranslate, { to: "es" });

      const parts = translated.text.split("|||");
      question = parts[0]?.trim() || data.riddle;
      answer = parts[1]?.trim() || data.answer;
    } catch (e) {
      console.error(
        "API de adivinanzas falló, usando fallback local:",
        e.message,
      );
      const riddlesFallback = [
        {
          q: "Soy más grande que la Tierra, pero no peso nada. ¿Qué soy?",
          a: "El universo",
        },
        {
          q: "Tengo agujas pero no sé coser, tengo números pero no sé leer. ¿Qué soy?",
          a: "El reloj",
        },
        {
          q: "Siempre de camino, nunca me canso, a veces voy lento, a veces avanzo. ¿Qué soy?",
          a: "El río",
        },
        {
          q: "Blanco por dentro, verde por fuera. Si quieres que te lo diga, espera.",
          a: "La pera",
        },
        { q: "Vuelo sin alas, lloro sin ojos. ¿Qué soy?", a: "La nube" },
        {
          q: "Tengo llaves pero no abro ninguna puerta. ¿Qué soy?",
          a: "El piano",
        },
        {
          q: "Oro parece, plata no es. El que no lo adivine, bien tonto es.",
          a: "El plátano",
        },
        {
          q: "Cuanto más caliente estoy, más fresco me consideran. ¿Qué soy?",
          a: "El pan",
        },
        {
          q: "Te la digo y no me entiendes, te la vuelvo a repetir y no me comprendes. ¿Qué es?",
          a: "La tela",
        },
        {
          q: "Tiene dientes pero no come, tiene cabeza pero no piensa. ¿Qué es?",
          a: "El ajo",
        },
        {
          q: "Fui por él y no lo traje, me quedé sin él y lo traje. ¿Qué es?",
          a: "El camino",
        },
        {
          q: "Pasa por el agua y no se moja, pasa por el fuego y no se quema. ¿Qué es?",
          a: "La sombra",
        },
      ];
      const randomRiddle =
        riddlesFallback[Math.floor(Math.random() * riddlesFallback.length)];
      question = randomRiddle.q;
      answer = randomRiddle.a;
    }

    const recompensa = 350;

    const keywords = getKeywords(answer);
    let hint = "";
    if (keywords.length > 0) {
      hint = `💡 Pista: La respuesta contiene una palabra de ${keywords[0].length} letras que empieza con "${keywords[0][0].toUpperCase()}".`;
    }

    const caption = `🧠 *ACERTIJO PÚBLICO* 🧠\n\n${question}\n\n${hint}\n\n⏳ Tienes 90 segundos.\n💰 Premio: ${recompensa} XP`;
    await client.sendMessage(m.chat, { text: caption });

    gameEngine.start(
      m.chat,
      "adivinanza",
      m.sender,
      {
        respuesta: answer,
      },
      {
        timeout: 90000,
        onTimeout: () => {
          client
            .sendMessage(m.chat, {
              text: `⏰ *TIEMPO AGOTADO*\nNadie pudo resolver la adivinanza.\nLa respuesta era: *${answer}* 😅`,
            })
            .catch(() => {});
        },
      },
    );
  },
};

const cmdTrivia = {
  command: ["trivia", "triviatic"],
  category: "juegos",
  desc: "Juega una trivia de cultura general de respuesta libre (API externa).",
  cooldown: 5,
  run: async (client, m, args) => {
    if (gameEngine.has(m.chat, "trivia")) {
      return m.reply(
        " Ya hay una trivia activa en este chat. ¡Responde la pregunta actual!",
      );
    }

    let apuesta = 200;
    if (args[0] && !isNaN(args[0])) {
      apuesta = parseInt(args[0]);
      if (apuesta < 10) return m.reply("❌ La apuesta mínima es de 10 XP.");
    }
    const bet = gameEngine.validateBet(m.sender, apuesta);
    if (bet === false)
      return m.reply(
        `❌ No tienes suficiente XP para esa apuesta. Tienes *${global.db.data.users[m.sender]?.exp || 0} XP*.`,
      );

    let pText, rText;

    try {
      const res = await fetch("https://opentdb.com/api.php?amount=1");
      if (!res.ok) throw new Error("API falló");
      const data = await res.json();
      const item = data.results[0];

      const qEng = decodeHTML(item.question);
      const correctEng = decodeHTML(item.correct_answer);

      const allEng = [qEng, correctEng];
      const translated = await translate(allEng.join(" ||| "), { to: "es" });
      const parts = translated.text.split(/\|\|\|/g).map((s) => s.trim());

      pText = parts[0];
      rText = normalize(parts[1]);
    } catch (e) {
      console.log("[Trivia] Fallback a preguntas locales:", e.message);
      const q =
        bancoPreguntasLocales[
          Math.floor(Math.random() * bancoPreguntasLocales.length)
        ];
      pText = q.p;
      rText = q.r;
    }

    const hint =
      rText.length > 2
        ? `💡 Pista: Empieza por "${rText[0].toUpperCase()}" y tiene ${rText.replace(/\s/g, "").length} letras.`
        : "";

    await client.sendMessage(m.chat, {
      text: `┌───「 🧠 *TRIVIA GENERAL* 🧠 」───┐\n│ *Pregunta:* ${pText}\n│\n│ ${hint}\n│ 💰 *Apuesta:* ${bet} XP\n│ ⏳ Tienes *45 segundos* para responder.\n└────────────────────────┘`,
    });

    gameEngine.start(
      m.chat,
      "trivia",
      m.sender,
      {
        answer: rText,
        apuesta: bet,
      },
      {
        timeout: 45000,
        onTimeout: () => {
          client
            .sendMessage(m.chat, {
              text: `┌───「 ⏳ *TIEMPO AGOTADO* ⏳ 」───┐\n│ Nadie respondió a tiempo.\n│ La respuesta correcta era: *${rText}*\n└──────────────────────────┘`,
            })
            .catch(() => {});
        },
      },
    );
  },
};

const cmdWordle = {
  command: ["wordle"],
  category: "juegos",
  desc: "Juega al Wordle: adivina la palabra de 5 letras en 6 intentos.",
  usage: ".wordle [apuesta]",
  cooldown: 5,
  run: async (client, m, args) => {
    if (gameEngine.has(m.chat, "wordle"))
      return m.reply(
        " Ya hay un Wordle activo en este chat. ¡Envía tu intento de 5 letras!",
      );

    let apuesta = 250;
    if (args[0] && !isNaN(args[0])) {
      apuesta = parseInt(args[0]);
      if (apuesta < 10) return m.reply("❌ La apuesta mínima es de 10 XP.");
    }
    const bet = gameEngine.validateBet(m.sender, apuesta);
    if (bet === false)
      return m.reply(
        `❌ No tienes suficiente XP. Tienes *${global.db.data.users[m.sender]?.exp || 0} XP*.`,
      );

    const palabra =
      palabras5[Math.floor(Math.random() * palabras5.length)].toUpperCase();

    await client.sendMessage(m.chat, {
      text: `🟩🟨⬛ *W O R D L E* ⬛🟨🟩\n\nAdivina la palabra de *5 letras* en *6 intentos*.\n\n🟩 = Letra correcta en su posición\n🟨 = Letra correcta en posición incorrecta\n⬛ = Letra no existe en la palabra\n\n💰 *Apuesta:* ${bet} XP\n⏳ Tienes *5 minutos*.\n\n*Escribe una palabra de 5 letras para empezar.*`,
    });

    gameEngine.start(
      m.chat,
      "wordle",
      m.sender,
      {
        palabra,
        intentos: [],
        maxIntentos: 6,
        apuesta: bet,
        jugador: m.sender,
      },
      {
        timeout: 300000,
        onTimeout: () =>
          client
            .sendMessage(m.chat, {
              text: `⏰ ¡Tiempo agotado!\nLa palabra era: *${palabra}*`,
            })
            .catch(() => {}),
      },
    );
  },
};

// ── HANDLERS INTERCEPTORES ──

async function handleAhorcado(client, m) {
  const game = gameEngine.get(m.chat, "ahorcado");
  if (!game) return false;

  const text = m.text
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  if (!text || !/^[A-Z]+$/.test(text)) return false;

  if (text.length > 1) {
    if (text === game.palabra) {
      gameEngine.end(m.chat, "ahorcado");
      const ganancia = game.apuesta * 3;
      gameEngine.reward(m.sender, { xp: ganancia, win: true });
      await client.sendMessage(
        m.chat,
        {
          text: `🎉 *¡INCREÍBLE!* 🎉\n\n@${m.sender.split("@")[0]} adivinó la palabra completa de golpe: *${game.palabra}*\n🎁 Ganaste un bonus de *${ganancia} XP*`,
          mentions: [m.sender],
        },
        { quoted: m },
      );
      return true;
    } else {
      game.intentos++;
      await client.sendMessage(
        m.chat,
        { text: `❌ *${text}* NO es la palabra. Te sumas 1 error.` },
        { quoted: m },
      );
    }
  } else {
    if (game.letrasUsadas.includes(text)) {
      await client.sendMessage(
        m.chat,
        { text: `⚠️ Ya intentaste la letra *${text}*.` },
        { quoted: m },
      );
      return true;
    }

    game.letrasUsadas.push(text);
    let acierto = false;
    for (let i = 0; i < game.palabra.length; i++) {
      if (game.palabra[i] === text) {
        game.progreso[i] = text;
        acierto = true;
      }
    }
    if (!acierto) game.intentos++;
  }

  if (game.intentos >= game.maxIntentos) {
    gameEngine.end(m.chat, "ahorcado");
    gameEngine.loss(m.sender);
    const caption = `💀 *¡ESTÁS AHORCADO!* 💀\n\nPerdiste la apuesta. La palabra secreta era: *${game.palabra}*`;
    const imgBuffer = await getHangmanImageBuffer(6);
    if (imgBuffer) {
      await client.sendMessage(
        m.chat,
        { image: imgBuffer, caption },
        { quoted: m },
      );
    } else {
      await client.sendMessage(m.chat, { text: caption }, { quoted: m });
    }
    return true;
  }

  if (!game.progreso.includes("_")) {
    gameEngine.end(m.chat, "ahorcado");
    const ganancia = game.apuesta * 2;
    gameEngine.reward(m.sender, { xp: ganancia, win: true });
    await client.sendMessage(
      m.chat,
      {
        text: `🎉 *¡F E L I C I D A D E S!* 🎉\n\n@${m.sender.split("@")[0]} completó la palabra: *${game.palabra}*\n🎁 Ganaste *${ganancia} XP*`,
        mentions: [m.sender],
      },
      { quoted: m },
    );
    return true;
  }

  const caption = `🎮 *PROGRESO* 🎮\n\nPalabra: \`${game.progreso.join(" ")}\`\nUsadas: *${game.letrasUsadas.join(", ")}*\nFallos: ${game.intentos}/${game.maxIntentos}`;
  const imgBuffer = await getHangmanImageBuffer(game.intentos);
  if (imgBuffer) {
    await client.sendMessage(m.chat, { image: imgBuffer, caption });
  } else {
    await client.sendMessage(m.chat, { text: caption });
  }
  return true;
}

async function handleAdivinanza(client, m) {
  const game = gameEngine.get(m.chat, "adivinanza");
  if (!game) return false;

  const texto = normalize(m.text);
  const correcta = normalize(game.respuesta);
  const keywords = getKeywords(game.respuesta);
  let acierto = false;

  if (texto === correcta || (correcta.includes(texto) && texto.length > 5)) {
    acierto = true;
  } else if (
    keywords.some(
      (kw) =>
        texto.includes(kw) ||
        (kw.includes(texto) && texto.length >= kw.length - 1),
    )
  ) {
    acierto = true;
  }

  if (acierto) {
    gameEngine.end(m.chat, "adivinanza");
    const xpPremio = 350;
    gameEngine.reward(m.sender, { xp: xpPremio, win: true });
    await client.sendMessage(
      m.chat,
      {
        text: `🎉 *¡F E L I C I D A D E S!* 🎉\n\n@${m.sender.split("@")[0]} resolvió el acertijo.\nLa respuesta exacta era: *${game.respuesta}*\n🎁 Ganas *${xpPremio} XP*`,
        mentions: [m.sender],
      },
      { quoted: m },
    );
    return true;
  }
  return false;
}

async function handleTrivia(client, m) {
  const juego = gameEngine.get(m.chat, "trivia");
  if (!juego) return false;

  const respuestaUsuario = normalize(m.text);
  const respuestaCorrecta = normalize(juego.answer);

  const acierto =
    respuestaUsuario === respuestaCorrecta ||
    (respuestaCorrecta.length >= 4 &&
      respuestaUsuario.includes(respuestaCorrecta)) ||
    (respuestaUsuario.length >= 4 &&
      respuestaCorrecta.includes(respuestaUsuario));

  if (acierto) {
    gameEngine.end(m.chat, "trivia");
    const ganancia = juego.apuesta * 2;

    if (m.sender !== juego.sender) {
      gameEngine.refundBet(juego.sender, juego.apuesta);
    }

    let multiplier = 1;
    const user = global.db.data.users[m.sender];
    if (user.triviaBuff && user.triviaBuff.expiresAt > Date.now()) {
      multiplier += user.triviaBuff.value;
    }

    gameEngine.reward(m.sender, { xp: ganancia, win: true, multiplier });

    await client.sendMessage(
      m.chat,
      {
        text: `┌───「 🎉 *¡CORRECTO!* 🎉 」───┐\n│ ¡Felicidades @${m.sender.split("@")[0]}!\n│ La respuesta era: *${juego.answer}*\n│ 💰 Ganaste *${ganancia} XP*\n└───────────────────────┘`,
        mentions: [m.sender],
      },
      { quoted: m },
    );
    return true;
  }
  return false;
}

async function handleWordle(client, m) {
  const game = gameEngine.get(m.chat, "wordle");
  if (!game) return false;
  const text = m.text
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  if (!/^[A-Z]{5}$/.test(text)) return false;

  const resultado = evaluarIntento(text, game.palabra);
  game.intentos.push(resultado);

  if (text === game.palabra) {
    gameEngine.end(m.chat, "wordle");
    const mult = Math.max(1, 7 - game.intentos.length);
    const ganancia = game.apuesta * mult;
    gameEngine.reward(m.sender, { xp: ganancia, win: true });
    await client.sendMessage(
      m.chat,
      {
        text: `🟩🟩🟩🟩🟩 *¡CORRECTO!* 🎉\n\n${renderWordle(game.intentos)}\nLa palabra era: *${game.palabra}*\nIntentos: ${game.intentos.length}/6\n💰 Ganaste *${ganancia} XP* (x${mult})`,
      },
      { quoted: m },
    );
    return true;
  }

  if (game.intentos.length >= game.maxIntentos) {
    gameEngine.end(m.chat, "wordle");
    gameEngine.loss(m.sender);
    await client.sendMessage(
      m.chat,
      {
        text: `💀 *¡GAME OVER!*\n\n${renderWordle(game.intentos)}\nLa palabra era: *${game.palabra}*\nIntentos: ${game.intentos.length}/6`,
      },
      { quoted: m },
    );
    return true;
  }

  await client.sendMessage(m.chat, {
    text: `🟩🟨⬛ *W O R D L E* ⬛🟨🟩\n\n${renderWordle(game.intentos)}\nIntentos: ${game.intentos.length}/${game.maxIntentos}`,
  });
  return true;
}

export const before = async (client, m) => {
  if (!m.text) return false;

  if (gameEngine.has(m.chat, "ahorcado")) {
    return await handleAhorcado(client, m);
  }
  if (gameEngine.has(m.chat, "adivinanza")) {
    return await handleAdivinanza(client, m);
  }
  if (gameEngine.has(m.chat, "trivia")) {
    return await handleTrivia(client, m);
  }
  if (gameEngine.has(m.chat, "wordle")) {
    return await handleWordle(client, m);
  }

  return false;
};

export default [cmdAhorcado, cmdGuess, cmdAdivinanza, cmdTrivia, cmdWordle];
