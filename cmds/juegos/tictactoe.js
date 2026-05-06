import { gameEngine } from '../../utils/gameEngine.js';

const renderBoard = (board) => {
  const symbols = board.map(cell => cell === 'X' ? '❌' : cell === 'O' ? '⭕' : '⬜');
  return `\n${symbols[0]} ${symbols[1]} ${symbols[2]}\n${symbols[3]} ${symbols[4]} ${symbols[5]}\n${symbols[6]} ${symbols[7]} ${symbols[8]}`;
};

const checkWinner = (board) => {
  const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  for (const [a,b,c] of lines) { if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a]; }
  return null;
};

export default {
  command: ['tictactoe', 'ttt'],
  category: 'juegos',
  desc: 'Juega TicTacToe contra otro usuario',
  usage: '@usuario [apuesta]',
  cooldown: 5,
  run: async (client, m, args, usedPrefix, command) => {
    if (gameEngine.has(m.chat, 'tictactoe')) return m.reply(' Ya hay un juego activo de TicTacToe en este chat.');
    if (!args[0]) return m.reply(`Uso: ${usedPrefix + command} @usuario [apuesta]`);

    const opponent = (m.mentionedJid && m.mentionedJid[0]) || args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
    if (opponent === m.sender) return m.reply(' No puedes jugar contra ti mismo.');

    let apuesta = 200;
    if (args[1] && !isNaN(args[1])) { apuesta = parseInt(args[1]); if (apuesta < 10) return m.reply('❌ La apuesta mínima es de 10 XP.'); }
    const bet1 = gameEngine.validateBet(m.sender, apuesta);
    if (bet1 === false) return m.reply(`❌ No tienes suficiente XP para esa apuesta.`);
    const bet2 = gameEngine.validateBet(opponent, apuesta);
    if (bet2 === false) { gameEngine.refundBet(m.sender, apuesta); return m.reply('❌ Tu oponente no tiene suficiente XP para cubrir la apuesta.'); }

    gameEngine.start(m.chat, 'tictactoe', m.sender, {
      board: Array(9).fill(null), turn: 'X', players: { X: m.sender, O: opponent }, apuesta,
    }, {
      timeout: 300000,
      onTimeout: () => {
        gameEngine.refundBet(m.sender, apuesta);
        gameEngine.refundBet(opponent, apuesta);
        client.sendMessage(m.chat, { text: `⏰ Tiempo agotado. Se devolvieron las apuestas.` });
      }
    });

    await client.sendMessage(m.chat, {
      text: `🕹️ *TicTacToe* iniciado!\n@${m.sender.split('@')[0]} (X) vs @${opponent.split('@')[0]} (O)\n💰 *Apuesta:* ${apuesta} XP por jugador\n\nTurno de @${m.sender.split('@')[0]} (X)\n${renderBoard(Array(9).fill(null))}`,
      mentions: [m.sender, opponent]
    });
  }
};

export const before = async (client, m) => {
  const game = gameEngine.get(m.chat, 'tictactoe');
  if (!game) return;
  const text = m.text.trim();
  if (!/^[1-9]$/.test(text)) return;

  const currentPlayer = game.players[game.turn];
  if (m.sender !== currentPlayer) return;
  const pos = parseInt(text) - 1;
  if (game.board[pos]) { await client.sendMessage(m.chat, { text: `⚠️ Esa casilla ya está ocupada.` }, { quoted: m }); return true; }

  game.board[pos] = game.turn;
  const winner = checkWinner(game.board);

  if (winner) {
    gameEngine.end(m.chat, 'tictactoe');
    const winnerId = game.players[winner], loserId = game.players[winner === 'X' ? 'O' : 'X'];
    const ganancia = game.apuesta * 2;
    gameEngine.reward(winnerId, { xp: ganancia, win: true });
    gameEngine.loss(loserId);
    await client.sendMessage(m.chat, { text: `🏆 *¡@${winnerId.split('@')[0]} gana!* 🎉\n🎁 Ganaste *${ganancia} XP*\n\n${renderBoard(game.board)}`, mentions: [game.players.X, game.players.O] });
    return true;
  }

  if (!game.board.includes(null)) {
    gameEngine.end(m.chat, 'tictactoe');
    gameEngine.refundBet(game.players.X, game.apuesta);
    gameEngine.refundBet(game.players.O, game.apuesta);
    await client.sendMessage(m.chat, { text: `🤝 *Empate!*\nAmbos recuperan sus apuestas.\n\n${renderBoard(game.board)}` });
    return true;
  }

  game.turn = game.turn === 'X' ? 'O' : 'X';
  const nextPlayer = game.players[game.turn];
  await client.sendMessage(m.chat, { text: `🕹️ Turno de @${nextPlayer.split('@')[0]} (${game.turn})\n${renderBoard(game.board)}`, mentions: [nextPlayer] });
  return true;
};
