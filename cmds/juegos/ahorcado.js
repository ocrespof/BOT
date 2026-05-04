import { gameEngine } from '../../utils/gameEngine.js';

export const palabras = [
  "computadora", "programacion", "inteligencia", "artificial",
  "whatsapp", "desarrollo", "servidor", "javascript",
  "teclado", "pantalla", "internet", "sistema",
  "algoritmo", "base de datos", "ciberseguridad"
];

const hangmanStages = [
  `\n  +---+\n  |   |\n      |\n      |\n      |\n      |\n=========`,
  `\n  +---+\n  |   |\n  O   |\n      |\n      |\n      |\n=========`,
  `\n  +---+\n  |   |\n  O   |\n  |   |\n      |\n      |\n=========`,
  `\n  +---+\n  |   |\n  O   |\n /|   |\n      |\n      |\n=========`,
  `\n  +---+\n  |   |\n  O   |\n /|\\  |\n      |\n      |\n=========`,
  `\n  +---+\n  |   |\n  O   |\n /|\\  |\n /    |\n      |\n=========`,
  `\n  +---+\n  |   |\n  O   |\n /|\\  |\n / \\  |\n      |\n=========`
];

export default {
  command: ['ahorcado', 'hangman'],
  category: 'juegos',
  desc: 'Juega al ahorcado adivinando la palabra secreta',
  cooldown: 5,
  run: async (client, m, args, usedPrefix, command) => {
    if (gameEngine.has(m.chat, 'ahorcado')) return m.reply(' Ya hay un juego de ahorcado activo en este chat.');

    let apuesta = 150;
    if (args[0] && !isNaN(args[0])) { apuesta = parseInt(args[0]); if (apuesta < 10) return m.reply('❌ La apuesta mínima es de 10 XP.'); }
    const bet = gameEngine.validateBet(m.sender, apuesta);
    if (bet === false) return m.reply(`❌ No tienes suficiente XP. Tienes *${global.db.data.users[m.sender]?.exp || 0} XP*.`);

    const palabraSecreta = palabras[Math.floor(Math.random() * palabras.length)].toUpperCase();
    const progreso = Array(palabraSecreta.length).fill('_');
    for (let i = 0; i < palabraSecreta.length; i++) { if (palabraSecreta[i] === ' ') progreso[i] = ' '; }

    gameEngine.start(m.chat, 'ahorcado', m.sender, {
      palabra: palabraSecreta, progreso, intentos: 0, letrasUsadas: [], maxIntentos: 6, apuesta: bet, jugador: m.sender,
    }, {
      timeout: 120000,
      onTimeout: () => client.sendMessage(m.chat, { text: `⏰ Tiempo agotado. La palabra era: *${palabraSecreta}*` }),
    });

    await client.sendMessage(m.chat, { text: `🎮 *EL AHORCADO* 🎮\n\n${hangmanStages[0]}\n\nPalabra: \`${progreso.join(' ')}\`\n💰 Apuesta: ${bet} XP\n\n*Escribe una letra* en el chat para adivinar.` });
  }
};

export const before = async (client, m) => {
  const game = gameEngine.get(m.chat, 'ahorcado');
  if (!game) return false;
  const text = m.text.trim().toUpperCase();
  if (!/^[A-Z]$/.test(text)) return false;

  if (game.letrasUsadas.includes(text)) {
    await client.sendMessage(m.chat, { text: `⚠️ Ya intentaste la letra *${text}*.` }, { quoted: m });
    return true;
  }

  game.letrasUsadas.push(text);
  let acierto = false;
  for (let i = 0; i < game.palabra.length; i++) { if (game.palabra[i] === text) { game.progreso[i] = text; acierto = true; } }
  if (!acierto) game.intentos++;

  if (game.intentos >= game.maxIntentos) {
    gameEngine.end(m.chat, 'ahorcado');
    gameEngine.loss(m.sender);
    await client.sendMessage(m.chat, { text: `💀 *¡ESTÁS AHORCADO!* 💀\n\n${hangmanStages[6]}\n\nPerdiste. La palabra secreta era: *${game.palabra}*` }, { quoted: m });
    return true;
  }

  if (!game.progreso.includes('_')) {
    gameEngine.end(m.chat, 'ahorcado');
    const ganancia = game.apuesta * 2;
    gameEngine.reward(m.sender, { xp: ganancia, win: true });
    await client.sendMessage(m.chat, { text: `🎉 *¡F E L I C I D A D E S!* 🎉\n\nAdivinaste la palabra: *${game.palabra}*\n🎁 Ganaste *${ganancia} XP*` }, { quoted: m });
    return true;
  }

  await client.sendMessage(m.chat, { text: `🎮 *EL AHORCADO* 🎮\n\n${hangmanStages[game.intentos]}\n\nPalabra: \`${game.progreso.join(' ')}\`\nLetras usadas: ${game.letrasUsadas.join(', ')}\nIntentos restantes: ${game.maxIntentos - game.intentos}` });
  return true;
};
