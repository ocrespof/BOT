import { gameEngine } from '../../utils/gameEngine.js';

const ROWS = 6, COLS = 7;
const createBoard = () => Array.from({ length: ROWS }, () => Array(COLS).fill(null));
const renderBoard = (board) => {
  let d = '1️⃣2️⃣3️⃣4️⃣5️⃣6️⃣7️⃣\n';
  for (const row of board) d += row.map(c => c === 'R' ? '🔴' : c === 'Y' ? '🟡' : '⚪').join('') + '\n';
  return d;
};
const dropPiece = (board, col, piece) => { for (let r = ROWS - 1; r >= 0; r--) { if (!board[r][col]) { board[r][col] = piece; return r; } } return -1; };
const checkWinner = (board, p) => {
  for (let r = 0; r < ROWS; r++) for (let c = 0; c <= COLS - 4; c++) if (board[r][c]===p && board[r][c+1]===p && board[r][c+2]===p && board[r][c+3]===p) return true;
  for (let r = 0; r <= ROWS - 4; r++) for (let c = 0; c < COLS; c++) if (board[r][c]===p && board[r+1][c]===p && board[r+2][c]===p && board[r+3][c]===p) return true;
  for (let r = 0; r <= ROWS - 4; r++) for (let c = 0; c <= COLS - 4; c++) if (board[r][c]===p && board[r+1][c+1]===p && board[r+2][c+2]===p && board[r+3][c+3]===p) return true;
  for (let r = 3; r < ROWS; r++) for (let c = 0; c <= COLS - 4; c++) if (board[r][c]===p && board[r-1][c+1]===p && board[r-2][c+2]===p && board[r-3][c+3]===p) return true;
  return false;
};
const isBoardFull = (board) => board[0].every(c => c !== null);

export default {
  command: ['connect4', 'c4', 'conecta4'],
  category: 'juegos',
  desc: 'Juega Conecta 4 contra otro usuario.',
  usage: '.connect4 @usuario [apuesta]',
  cooldown: 5,
  run: async (client, m, args, usedPrefix, command) => {
    if (gameEngine.has(m.chat, 'connect4')) return m.reply(' Ya hay una partida de Conecta 4 activa.');
    if (!args[0]) return m.reply(`Uso: ${usedPrefix + command} @usuario [apuesta]`);

    const opponent = (m.mentionedJid && m.mentionedJid[0]) || args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
    if (opponent === m.sender) return m.reply(' No puedes jugar contra ti mismo.');

    let apuesta = 250;
    if (args[1] && !isNaN(args[1])) { apuesta = parseInt(args[1]); if (apuesta < 10) return m.reply('❌ La apuesta mínima es de 10 XP.'); }
    const bet1 = gameEngine.validateBet(m.sender, apuesta);
    if (bet1 === false) return m.reply(`❌ No tienes suficiente XP para esa apuesta.`);
    const bet2 = gameEngine.validateBet(opponent, apuesta);
    if (bet2 === false) { gameEngine.refundBet(m.sender, apuesta); return m.reply('❌ Tu oponente no tiene suficiente XP.'); }

    const board = createBoard();
    gameEngine.start(m.chat, 'connect4', m.sender, {
      board, turn: 'R', players: { R: m.sender, Y: opponent }, apuesta,
    }, {
      timeout: 600000,
      onTimeout: () => {
        gameEngine.refundBet(m.sender, apuesta);
        gameEngine.refundBet(opponent, apuesta);
        client.sendMessage(m.chat, { text: `⏰ Tiempo agotado. Se devolvieron las apuestas.` });
      }
    });

    await client.sendMessage(m.chat, { text: `🔴🟡 *C O N E C T A  4* 🟡🔴\n\n@${m.sender.split('@')[0]} 🔴 vs @${opponent.split('@')[0]} 🟡\n💰 *Apuesta:* ${apuesta} XP por jugador\n\n${renderBoard(board)}\nTurno de @${m.sender.split('@')[0]} 🔴\n*Escribe un número del 1 al 7* para soltar tu ficha.`, mentions: [m.sender, opponent] });
  }
};

export const before = async (client, m) => {
  if (!m.text) return;
  const game = gameEngine.get(m.chat, 'connect4');
  if (!game) return;
  if (!/^[1-7]$/.test(m.text.trim())) return;

  const currentPlayer = game.players[game.turn];
  if (m.sender !== currentPlayer) return;

  const col = parseInt(m.text.trim()) - 1;
  const row = dropPiece(game.board, col, game.turn);
  if (row === -1) { await client.sendMessage(m.chat, { text: `⚠️ La columna ${col+1} está llena.` }, { quoted: m }); return true; }

  if (checkWinner(game.board, game.turn)) {
    gameEngine.end(m.chat, 'connect4');
    const winnerId = currentPlayer, loserId = game.players[game.turn === 'R' ? 'Y' : 'R'];
    const ganancia = game.apuesta * 2;
    gameEngine.reward(winnerId, { xp: ganancia, win: true });
    gameEngine.loss(loserId);
    const emoji = game.turn === 'R' ? '🔴' : '🟡';
    await client.sendMessage(m.chat, { text: `🔴🟡 *C O N E C T A  4* 🟡🔴\n\n${renderBoard(game.board)}\n🏆 *¡@${winnerId.split('@')[0]} ${emoji} gana!* 🎉\n💰 Ganaste *${ganancia} XP*`, mentions: [winnerId, loserId] }, { quoted: m });
    return true;
  }

  if (isBoardFull(game.board)) {
    gameEngine.end(m.chat, 'connect4');
    gameEngine.refundBet(game.players.R, game.apuesta);
    gameEngine.refundBet(game.players.Y, game.apuesta);
    await client.sendMessage(m.chat, { text: `🔴🟡 *C O N E C T A  4* 🟡🔴\n\n${renderBoard(game.board)}\n🤝 *¡Empate!* Se devolvieron las apuestas.` });
    return true;
  }

  game.turn = game.turn === 'R' ? 'Y' : 'R';
  const nextPlayer = game.players[game.turn], nextEmoji = game.turn === 'R' ? '🔴' : '🟡';
  await client.sendMessage(m.chat, { text: `🔴🟡 *C O N E C T A  4* 🟡🔴\n\n${renderBoard(game.board)}\nTurno de @${nextPlayer.split('@')[0]} ${nextEmoji}`, mentions: [nextPlayer] });
  return true;
};
