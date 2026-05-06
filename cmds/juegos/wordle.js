import { gameEngine } from '../../utils/gameEngine.js';

const palabras5 = [
  "perro","gatos","tigre","leona","monte","playa","arena","verde","negro","blusa",
  "libro","cielo","noche","luces","pared","suelo","banca","largo","corto","antes",
  "campo","plaza","llama","punto","reloj","media","barco","avion","juego","radio",
  "danza","rueda","feria","nuevo","viejo","dulce","claro","marca","tinta","fondo",
  "silla","linea","disco","carro","metro","clase","curva","final","bruja","trago",
  "siglo","dolor","cruel","digno","fuego","globo","hueso","jaula","karma","limon",
  "mundo","nieve","opera","piano","queso","rugby","salsa","temor","unico","valle",
  "yunke","zonas","abrir","beber","coser","decir","errar","fugaz","guiar","helar",
  "islas","joven","koala","lunar","mango","noble","orden","peces","razon","sanar"
];

const renderWordle = (intentos) => intentos.map(i => i.map(l => l.emoji).join('')).join('\n');

const evaluarIntento = (guess, target) => {
  const result = [], targetArr = target.split(''), guessArr = guess.split(''), used = Array(5).fill(false);
  for (let i = 0; i < 5; i++) { if (guessArr[i] === targetArr[i]) { result[i] = { letter: guessArr[i], emoji: '🟩', status: 'correct' }; used[i] = true; } }
  for (let i = 0; i < 5; i++) {
    if (result[i]) continue;
    const idx = targetArr.findIndex((c, j) => c === guessArr[i] && !used[j]);
    if (idx !== -1) { result[i] = { letter: guessArr[i], emoji: '🟨', status: 'misplaced' }; used[idx] = true; }
    else result[i] = { letter: guessArr[i], emoji: '⬛', status: 'absent' };
  }
  return result;
};

export default {
  command: ['wordle'],
  category: 'juegos',
  desc: 'Juega al Wordle: adivina la palabra de 5 letras en 6 intentos.',
  usage: '.wordle [apuesta]',
  cooldown: 5,
  run: async (client, m, args, usedPrefix, command) => {
    if (gameEngine.has(m.chat, 'wordle')) return m.reply(' Ya hay un Wordle activo en este chat. ¡Envía tu intento de 5 letras!');

    let apuesta = 250;
    if (args[0] && !isNaN(args[0])) { apuesta = parseInt(args[0]); if (apuesta < 10) return m.reply('❌ La apuesta mínima es de 10 XP.'); }
    const bet = gameEngine.validateBet(m.sender, apuesta);
    if (bet === false) return m.reply(`❌ No tienes suficiente XP. Tienes *${global.db.data.users[m.sender]?.exp || 0} XP*.`);

    const palabra = palabras5[Math.floor(Math.random() * palabras5.length)].toUpperCase();

    gameEngine.start(m.chat, 'wordle', m.sender, {
      palabra, intentos: [], maxIntentos: 6, apuesta: bet, jugador: m.sender,
    }, {
      timeout: 300000,
      onTimeout: () => client.sendMessage(m.chat, { text: `⏰ ¡Tiempo agotado!\nLa palabra era: *${palabra}*` }),
    });

    await client.sendMessage(m.chat, { text: `🟩🟨⬛ *W O R D L E* ⬛🟨🟩\n\nAdivina la palabra de *5 letras* en *6 intentos*.\n\n🟩 = Letra correcta en su posición\n🟨 = Letra correcta en posición incorrecta\n⬛ = Letra no existe en la palabra\n\n💰 *Apuesta:* ${bet} XP\n⏳ Tienes *5 minutos*.\n\n*Escribe una palabra de 5 letras para empezar.*` });
  }
};

export const before = async (client, m) => {
  if (!m.text) return;
  const game = gameEngine.get(m.chat, 'wordle');
  if (!game) return;
  const text = m.text.trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (!/^[A-Z]{5}$/.test(text)) return;

  const resultado = evaluarIntento(text, game.palabra);
  game.intentos.push(resultado);

  if (text === game.palabra) {
    gameEngine.end(m.chat, 'wordle');
    const mult = Math.max(1, 7 - game.intentos.length);
    const ganancia = game.apuesta * mult;
    gameEngine.reward(m.sender, { xp: ganancia, win: true });
    await client.sendMessage(m.chat, { text: `🟩🟩🟩🟩🟩 *¡CORRECTO!* 🎉\n\n${renderWordle(game.intentos)}\nLa palabra era: *${game.palabra}*\nIntentos: ${game.intentos.length}/6\n💰 Ganaste *${ganancia} XP* (x${mult})` }, { quoted: m });
    return true;
  }

  if (game.intentos.length >= game.maxIntentos) {
    gameEngine.end(m.chat, 'wordle');
    gameEngine.loss(m.sender);
    await client.sendMessage(m.chat, { text: `💀 *¡GAME OVER!*\n\n${renderWordle(game.intentos)}\nLa palabra era: *${game.palabra}*\nIntentos: ${game.intentos.length}/6` }, { quoted: m });
    return true;
  }

  await client.sendMessage(m.chat, { text: `🟩🟨⬛ *W O R D L E* ⬛🟨🟩\n\n${renderWordle(game.intentos)}\nIntentos: ${game.intentos.length}/${game.maxIntentos}` });
  return true;
};
