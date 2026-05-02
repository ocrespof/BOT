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
    if (global.juegos.has(m.chat + '_ahorcado')) {
      return m.reply(' Ya hay un juego de ahorcado activo en este chat. Termina antes de iniciar otro.');
    }

    let apuesta = 150; // Apuesta base
    if (args[0] && !isNaN(args[0])) {
      apuesta = parseInt(args[0]);
      if (apuesta < 10) return m.reply('❌ La apuesta mínima es de 10 XP.');
      if (apuesta > global.db.data.users[m.sender].exp) {
        return m.reply('❌ No tienes suficiente XP para esa apuesta.');
      }
      global.db.data.users[m.sender].exp -= apuesta; // Restar apuesta inicial
    }

    const palabraSecreta = palabras[Math.floor(Math.random() * palabras.length)].toUpperCase();
    const progreso = Array(palabraSecreta.length).fill('_');
    
    // Revelar espacios si la palabra tiene
    for (let i = 0; i < palabraSecreta.length; i++) {
        if (palabraSecreta[i] === ' ') progreso[i] = ' ';
    }

    const timeout = 120000; // 2 minutos
    const id = setTimeout(async () => {
      if (global.juegos.has(m.chat + '_ahorcado')) {
        global.juegos.delete(m.chat + '_ahorcado');
        await client.sendMessage(m.chat, { text: `⏰ Tiempo agotado. La palabra era: *${palabraSecreta}*` });
      }
    }, timeout);

    global.juegos.set(m.chat + '_ahorcado', {
      type: 'ahorcado',
      palabra: palabraSecreta,
      progreso: progreso,
      intentos: 0,
      letrasUsadas: [],
      maxIntentos: 6,
      timeoutId: id,
      jugador: m.sender,
      apuesta: apuesta
    });

    const board = `🎮 *EL AHORCADO* 🎮\n\n${hangmanStages[0]}\n\nPalabra: \`${progreso.join(' ')}\`\n💰 Apuesta: ${apuesta} XP\n\n*Escribe una letra* en el chat para adivinar.`;
    await client.sendMessage(m.chat, { text: board });
  }
};

export const before = async (client, m) => {
  if (!global.juegos.has(m.chat + '_ahorcado')) return false;
  const game = global.juegos.get(m.chat + '_ahorcado');
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
    global.juegos.delete(m.chat + '_ahorcado');
    global.db.data.users[m.sender].gameLosses = (global.db.data.users[m.sender].gameLosses || 0) + 1;
    const msg = `💀 *¡ESTÁS AHORCADO!* 💀\n\n${hangmanStages[6]}\n\nPerdiste. La palabra secreta era: *${game.palabra}*`;
    await client.sendMessage(m.chat, { text: msg }, { quoted: m });
    return true;
  }

  // Comprobar victoria
  if (!game.progreso.includes('_')) {
    clearTimeout(game.timeoutId);
    global.juegos.delete(m.chat + '_ahorcado');
    
    // Recompensa
    const ganancia = game.apuesta * 2;
    global.db.data.users[m.sender].exp = (global.db.data.users[m.sender].exp || 0) + ganancia;
    global.db.data.users[m.sender].gameWins = (global.db.data.users[m.sender].gameWins || 0) + 1;
    
    const msg = `🎉 *¡F E L I C I D A D E S!* 🎉\n\nAdivinaste la palabra: *${game.palabra}*\n🎁 Ganaste *${ganancia} XP*`;
    await client.sendMessage(m.chat, { text: msg }, { quoted: m });
    return true;
  }

  // Continuar juego
  const board = `🎮 *EL AHORCADO* 🎮\n\n${hangmanStages[game.intentos]}\n\nPalabra: \`${game.progreso.join(' ')}\`\nLetras usadas: ${game.letrasUsadas.join(', ')}\nIntentos restantes: ${game.maxIntentos - game.intentos}`;
  await client.sendMessage(m.chat, { text: board });

  return true;
};
