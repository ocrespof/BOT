global.juegos = global.juegos || new Map();

const renderBoard = (board) => {
  const symbols = board.map(cell => {
    if (cell === 'X') return '❌';
    if (cell === 'O') return '⭕';
    return '⬜';
  });
  return `
${symbols[0]} ${symbols[1]} ${symbols[2]}
${symbols[3]} ${symbols[4]} ${symbols[5]}
${symbols[6]} ${symbols[7]} ${symbols[8]}`;
};

const checkWinner = (board) => {
  const lines = [
    [0,1,2],[3,4,5],[6,7,8], // rows
    [0,3,6],[1,4,7],[2,5,8], // cols
    [0,4,8],[2,4,6] // diags
  ];
  for (const [a,b,c] of lines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
  }
  return null;
};

export default {
  command: ['tictactoe', 'ttt'],
  category: 'juegos',
  desc: 'Juega TicTacToe (Tres en raya) contra otro usuario',
  usage: '@usuario',
  cooldown: 5,
  run: async (client, m, args, usedPrefix, command) => {
    if (global.juegos.has(m.chat)) {
      return m.reply(' Ya hay un juego activo en este chat. Termina antes de iniciar otro.');
    }
    if (!args[0]) {
      return m.reply(`Uso: ${usedPrefix + command} @usuario`);
    }
    const opponent = (m.mentionedJid && m.mentionedJid[0]) || args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
    if (opponent === m.sender) {
      return m.reply(' No puedes jugar contra ti mismo.');
    }
    const board = Array(9).fill(null);
    const timeout = 300000; // 5 minutos sin actividad
    const id = setTimeout(async () => {
      if (global.juegos.has(m.chat)) {
        global.juegos.delete(m.chat);
        await client.sendMessage(m.chat, { text: `⏰ Tiempo agotado. El juego ha terminado sin ganador.` });
      }
    }, timeout);
    global.juegos.set(m.chat, {
      type: 'tictactoe',
      board,
      turn: 'X',
      players: { X: m.sender, O: opponent },
      timeoutId: id
    });
    await client.sendMessage(m.chat, {
      text: `🕹️ *TicTacToe* iniciado!
@${m.sender.split('@')[0]} (X) vs @${opponent.split('@')[0]} (O)

Turno de @${m.sender.split('@')[0]} (X)
${renderBoard(board)}`,
      mentions: [m.sender, opponent]
    });
  }
};

export const before = async (client, m) => {
  if (!global.juegos.has(m.chat)) return;
  const game = global.juegos.get(m.chat);
  if (game.type !== 'tictactoe') return;
  const text = m.text.trim();
  if (!/^[1-9]$/.test(text)) return;
  const pos = parseInt(text, 10) - 1;
  const currentPlayer = game.players[game.turn];
  if (m.sender !== currentPlayer) return;
  if (game.board[pos]) {
    return client.sendMessage(m.chat, { text: `⚠️ Esa casilla ya está ocupada. Elige otra.` }, { quoted: m });
  }
  // update board
  game.board[pos] = game.turn;
  // check win
  const winner = checkWinner(game.board);
  if (winner) {
    clearTimeout(game.timeoutId);
    global.juegos.delete(m.chat);
    // reward winner 200 XP
    const winnerId = game.players[winner];
    global.db.data.users[winnerId].exp = (global.db.data.users[winnerId].exp || 0) + 200;
    await client.sendMessage(m.chat, {
      text: `🏆 *¡${winner === 'X' ? '@' + game.players.X.split('@')[0] : '@' + game.players.O.split('@')[0]} gana!* 🎉\n🎁 Ganaste *200 XP*\n\n${renderBoard(game.board)}`,
      mentions: [game.players.X, game.players.O]
    });
    return true;
  }
  // check draw
  if (!game.board.includes(null)) {
    clearTimeout(game.timeoutId);
    global.juegos.delete(m.chat);
    await client.sendMessage(m.chat, { text: `🤝 *Empate!*\n${renderBoard(game.board)}` });
    return true;
  }
  // switch turn
  game.turn = game.turn === 'X' ? 'O' : 'X';
  const nextPlayer = game.players[game.turn];
  await client.sendMessage(m.chat, {
    text: `🕹️ Turno de @${nextPlayer.split('@')[0]} (${game.turn})\n${renderBoard(game.board)}`,
    mentions: [nextPlayer]
  });
  return true;
};
