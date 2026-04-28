export const palabras = [
  "computadora", "programacion", "inteligencia", "artificial",
  "whatsapp", "desarrollo", "servidor", "javascript",
  "teclado", "pantalla", "internet", "sistema",
  "algoritmo", "base de datos", "ciberseguridad"
];

const hangmanStages = [
  `
  +---+
  |   |
      |
      |
      |
      |
=========`,
  `
  +---+
  |   |
  O   |
      |
      |
      |
=========`,
  `
  +---+
  |   |
  O   |
  |   |
      |
      |
=========`,
  `
  +---+
  |   |
  O   |
 /|   |
      |
      |
=========`,
  `
  +---+
  |   |
  O   |
 /|\\  |
      |
      |
=========`,
  `
  +---+
  |   |
  O   |
 /|\\  |
 /    |
      |
=========`,
  `
  +---+
  |   |
  O   |
 /|\\  |
 / \\  |
      |
=========`
];

global.juegos = global.juegos || new Map();

export default {
  command: ['ahorcado', 'hangman'],
  category: 'juegos',
  desc: 'Juega al ahorcado adivinando la palabra secreta',
  usage: '.ahorcado',
  cooldown: 5,
  run: async (client, m, args, usedPrefix, command) => {
    if (global.juegos.has(m.chat)) {
      return m.reply(' Ya hay un juego activo en este chat. Termina antes de iniciar otro.');
    }

    const palabraSecreta = palabras[Math.floor(Math.random() * palabras.length)].toUpperCase();
    const progreso = Array(palabraSecreta.length).fill('_');
    
    // Revelar espacios si la palabra tiene
    for (let i = 0; i < palabraSecreta.length; i++) {
        if (palabraSecreta[i] === ' ') progreso[i] = ' ';
    }

    const timeout = 120000; // 2 minutos
    const id = setTimeout(async () => {
      if (global.juegos.has(m.chat)) {
        global.juegos.delete(m.chat);
        await client.sendMessage(m.chat, { text: `⏰ Tiempo agotado. La palabra era: *${palabraSecreta}*` });
      }
    }, timeout);

    global.juegos.set(m.chat, {
      type: 'ahorcado',
      palabra: palabraSecreta,
      progreso: progreso,
      intentos: 0,
      letrasUsadas: [],
      maxIntentos: 6,
      timeoutId: id,
      jugador: m.sender // Opcional: permitir a cualquiera del grupo adivinar
    });

    const board = `🎮 *EL AHORCADO* 🎮\n\n${hangmanStages[0]}\n\nPalabra: \`${progreso.join(' ')}\`\n\n*Escribe una letra* en el chat para adivinar.`;
    await client.sendMessage(m.chat, { text: board });
  }
};

export const before = async (client, m) => {
  if (!global.juegos.has(m.chat)) return false;
  const game = global.juegos.get(m.chat);
  if (game.type !== 'ahorcado') return false;

  const text = m.text.trim().toUpperCase();
  
  // Validar si es una letra
  if (!/^[A-Z]$/.test(text)) return false;

  const letra = text;

  if (game.letrasUsadas.includes(letra)) {
    await client.sendMessage(m.chat, { text: `⚠️ Ya intentaste la letra *${letra}*.` }, { quoted: m });
    return true; // intercept
  }

  game.letrasUsadas.push(letra);

  let acierto = false;
  for (let i = 0; i < game.palabra.length; i++) {
    if (game.palabra[i] === letra) {
      game.progreso[i] = letra;
      acierto = true;
    }
  }

  if (!acierto) {
    game.intentos++;
  }

  // Comprobar derrota
  if (game.intentos >= game.maxIntentos) {
    clearTimeout(game.timeoutId);
    global.juegos.delete(m.chat);
    const msg = `💀 *¡ESTÁS AHORCADO!* 💀\n\n${hangmanStages[6]}\n\nPerdiste. La palabra secreta era: *${game.palabra}*`;
    await client.sendMessage(m.chat, { text: msg }, { quoted: m });
    return true;
  }

  // Comprobar victoria
  if (!game.progreso.includes('_')) {
    clearTimeout(game.timeoutId);
    global.juegos.delete(m.chat);
    
    // Recompensa
    global.db.data.users[m.sender].exp = (global.db.data.users[m.sender].exp || 0) + 150;
    
    const msg = `🎉 *¡F E L I C I D A D E S!* 🎉\n\nAdivinaste la palabra: *${game.palabra}*\n🎁 Ganaste *150 XP*`;
    await client.sendMessage(m.chat, { text: msg }, { quoted: m });
    return true;
  }

  // Continuar juego
  const board = `🎮 *EL AHORCADO* 🎮\n\n${hangmanStages[game.intentos]}\n\nPalabra: \`${game.progreso.join(' ')}\`\nLetras usadas: ${game.letrasUsadas.join(', ')}\nIntentos restantes: ${game.maxIntentos - game.intentos}`;
  await client.sendMessage(m.chat, { text: board });

  return true;
};
