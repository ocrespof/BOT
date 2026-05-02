global.juegos = global.juegos || new Map();

const ROWS = 6;
const COLS = 7;

const createBoard = () => Array.from({ length: ROWS }, () => Array(COLS).fill(null));

const renderBoard = (board) => {
  const nums = '1️⃣2️⃣3️⃣4️⃣5️⃣6️⃣7️⃣';
  let display = nums + '\n';
  for (const row of board) {
    display += row.map(cell => {
      if (cell === 'R') return '🔴';
      if (cell === 'Y') return '🟡';
      return '⚪';
    }).join('') + '\n';
  }
  return display;
};

const dropPiece = (board, col, piece) => {
  for (let row = ROWS - 1; row >= 0; row--) {
    if (!board[row][col]) {
      board[row][col] = piece;
      return row;
    }
  }
  return -1; // Columna llena
};

const checkWinner = (board, piece) => {
  // Horizontal
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      if (board[r][c] === piece && board[r][c+1] === piece && board[r][c+2] === piece && board[r][c+3] === piece) return true;
    }
  }
  // Vertical
  for (let r = 0; r <= ROWS - 4; r++) {
    for (let c = 0; c < COLS; c++) {
      if (board[r][c] === piece && board[r+1][c] === piece && board[r+2][c] === piece && board[r+3][c] === piece) return true;
    }
  }
  // Diagonal descendente
  for (let r = 0; r <= ROWS - 4; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      if (board[r][c] === piece && board[r+1][c+1] === piece && board[r+2][c+2] === piece && board[r+3][c+3] === piece) return true;
    }
  }
  // Diagonal ascendente
  for (let r = 3; r < ROWS; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      if (board[r][c] === piece && board[r-1][c+1] === piece && board[r-2][c+2] === piece && board[r-3][c+3] === piece) return true;
    }
  }
  return false;
};

const isBoardFull = (board) => board[0].every(cell => cell !== null);

export default {
  command: ['connect4', 'c4', 'conecta4'],
  category: 'juegos',
  desc: 'Juega Conecta 4 contra otro usuario. Responde con un número del 1 al 7.',
  usage: '.connect4 @usuario [apuesta]',
  cooldown: 5,
  run: async (client, m, args, usedPrefix, command) => {
    if (global.juegos.has(m.chat + '_connect4')) {
      return m.reply(' Ya hay una partida de Conecta 4 activa en este chat.');
    }
    if (!args[0]) {
      return m.reply(`Uso: ${usedPrefix + command} @usuario [apuesta]`);
    }

    const opponent = (m.mentionedJid && m.mentionedJid[0]) || args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
    if (opponent === m.sender) {
      return m.reply(' No puedes jugar contra ti mismo.');
    }

    let apuesta = 250;
    if (args[1] && !isNaN(args[1])) {
      apuesta = parseInt(args[1]);
      if (apuesta < 10) return m.reply('❌ La apuesta mínima es de 10 XP.');
      if (apuesta > (global.db.data.users[m.sender]?.exp || 0)) {
        return m.reply('❌ No tienes suficiente XP para esa apuesta.');
      }
      if (apuesta > (global.db.data.users[opponent]?.exp || 0)) {
        return m.reply('❌ Tu oponente no tiene suficiente XP para cubrir la apuesta.');
      }
      global.db.data.users[m.sender].exp -= apuesta;
      global.db.data.users[opponent].exp -= apuesta;
    }

    const board = createBoard();

    const timeout = 600000; // 10 minutos
    const id = setTimeout(async () => {
      if (global.juegos.has(m.chat + '_connect4')) {
        global.juegos.delete(m.chat + '_connect4');
        // Devolver apuestas
        global.db.data.users[m.sender].exp += apuesta;
        global.db.data.users[opponent].exp += apuesta;
        await client.sendMessage(m.chat, { text: `⏰ Tiempo agotado. El juego de Conecta 4 terminó. Se devolvieron las apuestas.` });
      }
    }, timeout);

    global.juegos.set(m.chat + '_connect4', {
      type: 'connect4',
      board,
      turn: 'R',
      players: { R: m.sender, Y: opponent },
      timeoutId: id,
      apuesta
    });

    const msg = `🔴🟡 *C O N E C T A  4* 🟡🔴

@${m.sender.split('@')[0]} 🔴 vs @${opponent.split('@')[0]} 🟡
💰 *Apuesta:* ${apuesta} XP por jugador

${renderBoard(board)}
Turno de @${m.sender.split('@')[0]} 🔴
*Escribe un número del 1 al 7* para soltar tu ficha.`;

    await client.sendMessage(m.chat, { text: msg, mentions: [m.sender, opponent] });
  }
};

export const before = async (client, m) => {
  if (!m.text || !global.juegos.has(m.chat + '_connect4')) return;
  const game = global.juegos.get(m.chat + '_connect4');
  if (game.type !== 'connect4') return;

  const text = m.text.trim();
  if (!/^[1-7]$/.test(text)) return;

  const currentPlayer = game.players[game.turn];
  if (m.sender !== currentPlayer) return;

  const col = parseInt(text) - 1;
  const row = dropPiece(game.board, col, game.turn);

  if (row === -1) {
    await client.sendMessage(m.chat, { text: `⚠️ La columna ${text} está llena. Elige otra.` }, { quoted: m });
    return true;
  }

  // Verificar victoria
  if (checkWinner(game.board, game.turn)) {
    clearTimeout(game.timeoutId);
    global.juegos.delete(m.chat + '_connect4');

    const winnerId = currentPlayer;
    const loserId = game.players[game.turn === 'R' ? 'Y' : 'R'];
    const ganancia = game.apuesta * 2;

    global.db.data.users[winnerId].exp = (global.db.data.users[winnerId].exp || 0) + ganancia;
    global.db.data.users[winnerId].gameWins = (global.db.data.users[winnerId].gameWins || 0) + 1;
    global.db.data.users[loserId].gameLosses = (global.db.data.users[loserId].gameLosses || 0) + 1;

    const emoji = game.turn === 'R' ? '🔴' : '🟡';
    const msg = `🔴🟡 *C O N E C T A  4* 🟡🔴

${renderBoard(game.board)}
🏆 *¡@${winnerId.split('@')[0]} ${emoji} gana!* 🎉
💰 Ganaste *${ganancia} XP*`;

    await client.sendMessage(m.chat, { text: msg, mentions: [winnerId, loserId] }, { quoted: m });
    return true;
  }

  // Verificar empate
  if (isBoardFull(game.board)) {
    clearTimeout(game.timeoutId);
    global.juegos.delete(m.chat + '_connect4');

    global.db.data.users[game.players.R].exp += game.apuesta;
    global.db.data.users[game.players.Y].exp += game.apuesta;

    const msg = `🔴🟡 *C O N E C T A  4* 🟡🔴

${renderBoard(game.board)}
🤝 *¡Empate!* Se devolvieron las apuestas.`;

    await client.sendMessage(m.chat, { text: msg });
    return true;
  }

  // Cambiar turno
  game.turn = game.turn === 'R' ? 'Y' : 'R';
  const nextPlayer = game.players[game.turn];
  const nextEmoji = game.turn === 'R' ? '🔴' : '🟡';

  const msg = `🔴🟡 *C O N E C T A  4* 🟡🔴

${renderBoard(game.board)}
Turno de @${nextPlayer.split('@')[0]} ${nextEmoji}`;

  await client.sendMessage(m.chat, { text: msg, mentions: [nextPlayer] });
  return true;
};
