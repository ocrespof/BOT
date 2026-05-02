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
    if (global.juegos.has(m.chat + '_tictactoe')) {
      return m.reply(' Ya hay un juego activo de TicTacToe en este chat. Termina antes de iniciar otro.');
    }
    if (!args[0]) {
      return m.reply(`Uso: ${usedPrefix + command} @usuario [apuesta]`);
    }
    const opponent = (m.mentionedJid && m.mentionedJid[0]) || args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
    if (opponent === m.sender) {
      return m.reply(' No puedes jugar contra ti mismo.');
    }

    let apuesta = 200; // Apuesta base
    if (args[1] && !isNaN(args[1])) {
      apuesta = parseInt(args[1]);
      if (apuesta < 10) return m.reply('❌ La apuesta mínima es de 10 XP.');
      if (apuesta > global.db.data.users[m.sender].exp) {
        return m.reply('❌ No tienes suficiente XP para esa apuesta.');
      }
      if (apuesta > (global.db.data.users[opponent]?.exp || 0)) {
        return m.reply('❌ Tu oponente no tiene suficiente XP para cubrir la apuesta.');
      }
      global.db.data.users[m.sender].exp -= apuesta; // Restar apuesta inicial
      global.db.data.users[opponent].exp -= apuesta; // Restar apuesta al oponente
    }
    const board = Array(9).fill(null);
    const timeout = 300000; // 5 minutos sin actividad
    const id = setTimeout(async () => {
      if (global.juegos.has(m.chat + '_tictactoe')) {
        global.juegos.delete(m.chat + '_tictactoe');
        await client.sendMessage(m.chat, { text: `⏰ Tiempo agotado. El juego ha terminado sin ganador.` });
      }
    }, timeout);
    global.juegos.set(m.chat + '_tictactoe', {
      type: 'tictactoe',
      board,
      turn: 'X',
      players: { X: m.sender, O: opponent },
      timeoutId: id,
      apuesta: apuesta
    });
    await client.sendMessage(m.chat, {
      text: `🕹️ *TicTacToe* iniciado!
@${m.sender.split('@')[0]} (X) vs @${opponent.split('@')[0]} (O)
💰 *Apuesta:* ${apuesta} XP por jugador

Turno de @${m.sender.split('@')[0]} (X)
${renderBoard(board)}`,
      mentions: [m.sender, opponent]
    });
  }
};

export const before = async (client, m) => {
  if (!global.juegos.has(m.chat + '_tictactoe')) return;
  const game = global.juegos.get(m.chat + '_tictactoe');
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
  const winner = checkWinner(game.board);
  if (winner) {
    clearTimeout(game.timeoutId);
    global.juegos.delete(m.chat + '_tictactoe');
    const winnerId = game.players[winner];
    const loserId = game.players[winner === 'X' ? 'O' : 'X'];
    
    const ganancia = game.apuesta * 2;
    global.db.data.users[winnerId].exp = (global.db.data.users[winnerId].exp || 0) + ganancia;
    global.db.data.users[winnerId].gameWins = (global.db.data.users[winnerId].gameWins || 0) + 1;
    global.db.data.users[loserId].gameLosses = (global.db.data.users[loserId].gameLosses || 0) + 1;
    
    await client.sendMessage(m.chat, {
      text: `🏆 *¡${winner === 'X' ? '@' + game.players.X.split('@')[0] : '@' + game.players.O.split('@')[0]} gana!* 🎉\n🎁 Ganaste *${ganancia} XP*\n\n${renderBoard(game.board)}`,
      mentions: [game.players.X, game.players.O]
    });
    return true;
  }
  // check draw
  if (!game.board.includes(null)) {
    clearTimeout(game.timeoutId);
    global.juegos.delete(m.chat + '_tictactoe');
    
    // Devolver apuestas
    global.db.data.users[game.players.X].exp += game.apuesta;
    global.db.data.users[game.players.O].exp += game.apuesta;
    
    await client.sendMessage(m.chat, { text: `🤝 *Empate!*\nAmbos jugadores recuperan sus apuestas.\n\n${renderBoard(game.board)}` });
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
