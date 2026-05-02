global.juegos = global.juegos || new Map();

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

const renderWordle = (intentos) => {
  let board = '';
  for (const intento of intentos) {
    board += intento.map(l => l.emoji).join('') + '\n';
  }
  return board;
};

const evaluarIntento = (guess, target) => {
  const result = [];
  const targetArr = target.split('');
  const guessArr = guess.split('');
  const used = Array(5).fill(false);

  // Primero: posiciones exactas (verde)
  for (let i = 0; i < 5; i++) {
    if (guessArr[i] === targetArr[i]) {
      result[i] = { letter: guessArr[i], emoji: '🟩', status: 'correct' };
      used[i] = true;
    }
  }

  // Segundo: letras en posición incorrecta (amarillo) o no existen (gris)
  for (let i = 0; i < 5; i++) {
    if (result[i]) continue;
    const idx = targetArr.findIndex((c, j) => c === guessArr[i] && !used[j]);
    if (idx !== -1) {
      result[i] = { letter: guessArr[i], emoji: '🟨', status: 'misplaced' };
      used[idx] = true;
    } else {
      result[i] = { letter: guessArr[i], emoji: '⬛', status: 'absent' };
    }
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
    if (global.juegos.has(m.chat + '_wordle')) {
      return m.reply(' Ya hay un Wordle activo en este chat. ¡Envía tu intento de 5 letras!');
    }

    let apuesta = 250;
    if (args[0] && !isNaN(args[0])) {
      apuesta = parseInt(args[0]);
      if (apuesta < 10) return m.reply('❌ La apuesta mínima es de 10 XP.');
      if (apuesta > (global.db.data.users[m.sender]?.exp || 0)) {
        return m.reply('❌ No tienes suficiente XP para esa apuesta.');
      }
      global.db.data.users[m.sender].exp -= apuesta;
    }

    const palabra = palabras5[Math.floor(Math.random() * palabras5.length)].toUpperCase();

    const timeout = 300000; // 5 minutos
    const id = setTimeout(async () => {
      if (global.juegos.has(m.chat + '_wordle')) {
        global.juegos.delete(m.chat + '_wordle');
        await client.sendMessage(m.chat, { text: `⏰ ¡Tiempo agotado!\nLa palabra era: *${palabra}*` });
      }
    }, timeout);

    global.juegos.set(m.chat + '_wordle', {
      type: 'wordle',
      palabra,
      intentos: [],
      maxIntentos: 6,
      timeoutId: id,
      jugador: m.sender,
      apuesta
    });

    const msg = `🟩🟨⬛ *W O R D L E* ⬛🟨🟩

Adivina la palabra de *5 letras* en *6 intentos*.

🟩 = Letra correcta en su posición
🟨 = Letra correcta en posición incorrecta
⬛ = Letra no existe en la palabra

💰 *Apuesta:* ${apuesta} XP
⏳ Tienes *5 minutos*.

*Escribe una palabra de 5 letras para empezar.*`;

    await client.sendMessage(m.chat, { text: msg });
  }
};

export const before = async (client, m) => {
  if (!m.text || !global.juegos.has(m.chat + '_wordle')) return;
  const game = global.juegos.get(m.chat + '_wordle');
  if (game.type !== 'wordle') return;

  const text = m.text.trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Solo procesar palabras de 5 letras
  if (!/^[A-Z]{5}$/.test(text)) return;

  const resultado = evaluarIntento(text, game.palabra);
  game.intentos.push(resultado);

  // Victoria
  if (text === game.palabra) {
    clearTimeout(game.timeoutId);
    global.juegos.delete(m.chat + '_wordle');

    const multiplicador = Math.max(1, 7 - game.intentos.length); // Más rápido = más ganancia
    const ganancia = game.apuesta * multiplicador;
    global.db.data.users[m.sender].exp = (global.db.data.users[m.sender].exp || 0) + ganancia;
    global.db.data.users[m.sender].gameWins = (global.db.data.users[m.sender].gameWins || 0) + 1;

    const msg = `🟩🟩🟩🟩🟩 *¡CORRECTO!* 🎉

${renderWordle(game.intentos)}
La palabra era: *${game.palabra}*
Intentos: ${game.intentos.length}/6
💰 Ganaste *${ganancia} XP* (x${multiplicador})`;

    await client.sendMessage(m.chat, { text: msg }, { quoted: m });
    return true;
  }

  // Derrota (6 intentos usados)
  if (game.intentos.length >= game.maxIntentos) {
    clearTimeout(game.timeoutId);
    global.juegos.delete(m.chat + '_wordle');
    global.db.data.users[m.sender].gameLosses = (global.db.data.users[m.sender].gameLosses || 0) + 1;

    const msg = `💀 *¡GAME OVER!*

${renderWordle(game.intentos)}
La palabra era: *${game.palabra}*
Intentos: ${game.intentos.length}/6`;

    await client.sendMessage(m.chat, { text: msg }, { quoted: m });
    return true;
  }

  // Continuar juego
  const msg = `🟩🟨⬛ *W O R D L E* ⬛🟨🟩

${renderWordle(game.intentos)}
Intentos: ${game.intentos.length}/${game.maxIntentos}`;

  await client.sendMessage(m.chat, { text: msg });
  return true;
};
