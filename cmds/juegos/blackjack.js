global.juegos = global.juegos || new Map();

const SUITS = ['♠️', '♥️', '♦️', '♣️'];
const VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

const createDeck = () => {
  const deck = [];
  for (const suit of SUITS) {
    for (const value of VALUES) {
      deck.push({ suit, value });
    }
  }
  // Shuffle (Fisher-Yates)
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
};

const cardValue = (card) => {
  if (['J', 'Q', 'K'].includes(card.value)) return 10;
  if (card.value === 'A') return 11;
  return parseInt(card.value);
};

const handTotal = (hand) => {
  let total = hand.reduce((sum, c) => sum + cardValue(c), 0);
  let aces = hand.filter(c => c.value === 'A').length;
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }
  return total;
};

const renderHand = (hand, label, hideSecond = false) => {
  if (hideSecond && hand.length >= 2) {
    return `${label}: ${hand[0].value}${hand[0].suit} 🂠  (${cardValue(hand[0])} + ?)`;
  }
  const cards = hand.map(c => `${c.value}${c.suit}`).join(' ');
  return `${label}: ${cards}  (*${handTotal(hand)}*)`;
};

export default {
  command: ['blackjack', 'bj', '21'],
  category: 'juegos',
  desc: 'Juega al Blackjack (21) contra el bot. Responde con "hit" o "stand".',
  usage: '.blackjack [apuesta]',
  cooldown: 5,
  run: async (client, m, args, usedPrefix, command) => {
    if (global.juegos.has(m.chat + '_blackjack_' + m.sender)) {
      return m.reply(' Ya tienes una partida de Blackjack activa. Escribe *hit* o *stand*.');
    }

    let apuesta = 300;
    if (args[0] && !isNaN(args[0])) {
      apuesta = parseInt(args[0]);
      if (apuesta < 10) return m.reply('❌ La apuesta mínima es de 10 XP.');
    }
    if (apuesta > (global.db.data.users[m.sender]?.exp || 0)) {
      return m.reply(`❌ No tienes suficiente XP para esa apuesta. Tienes *${global.db.data.users[m.sender]?.exp || 0} XP*.`);
    }
    global.db.data.users[m.sender].exp -= apuesta;

    const deck = createDeck();
    const playerHand = [deck.pop(), deck.pop()];
    const dealerHand = [deck.pop(), deck.pop()];

    // Blackjack natural
    if (handTotal(playerHand) === 21) {
      const ganancia = Math.floor(apuesta * 2.5);
      global.db.data.users[m.sender].exp = (global.db.data.users[m.sender].exp || 0) + ganancia;
      global.db.data.users[m.sender].gameWins = (global.db.data.users[m.sender].gameWins || 0) + 1;

      const msg = `🃏 *B L A C K J A C K* 🃏

${renderHand(playerHand, '🧑 Tú')}
${renderHand(dealerHand, '🤖 Dealer')}

🎰 *¡BLACKJACK NATURAL!* 🎉
💰 Ganaste *${ganancia} XP* (x2.5)`;
      return client.sendMessage(m.chat, { text: msg }, { quoted: m });
    }

    const timeout = 120000; // 2 minutos
    const id = setTimeout(async () => {
      if (global.juegos.has(m.chat + '_blackjack_' + m.sender)) {
        global.juegos.delete(m.chat + '_blackjack_' + m.sender);
        await client.sendMessage(m.chat, { text: `⏰ Tiempo agotado. Perdiste tu apuesta de ${apuesta} XP.` });
      }
    }, timeout);

    global.juegos.set(m.chat + '_blackjack_' + m.sender, {
      type: 'blackjack',
      deck,
      playerHand,
      dealerHand,
      apuesta,
      jugador: m.sender,
      timeoutId: id
    });

    const msg = `🃏 *B L A C K J A C K* 🃏

${renderHand(playerHand, '🧑 Tú')}
${renderHand(dealerHand, '🤖 Dealer', true)}

💰 *Apuesta:* ${apuesta} XP

Escribe *hit* para pedir carta o *stand* para plantarte.`;

    await client.sendMessage(m.chat, { text: msg });
  }
};

const resolveDealer = (game) => {
  while (handTotal(game.dealerHand) < 17) {
    game.dealerHand.push(game.deck.pop());
  }
};

export const before = async (client, m) => {
  if (!m.text) return;

  const key = m.chat + '_blackjack_' + m.sender;
  if (!global.juegos.has(key)) return;
  const game = global.juegos.get(key);
  if (game.type !== 'blackjack' || game.jugador !== m.sender) return;

  const action = m.text.trim().toLowerCase();
  if (!['hit', 'stand', 'h', 's', 'pedir', 'plantar', 'plantarse'].includes(action)) return;

  const isHit = ['hit', 'h', 'pedir'].includes(action);

  if (isHit) {
    game.playerHand.push(game.deck.pop());
    const playerTotal = handTotal(game.playerHand);

    // Bust
    if (playerTotal > 21) {
      clearTimeout(game.timeoutId);
      global.juegos.delete(key);
      global.db.data.users[m.sender].gameLosses = (global.db.data.users[m.sender].gameLosses || 0) + 1;

      const msg = `🃏 *B L A C K J A C K* 🃏

${renderHand(game.playerHand, '🧑 Tú')}
${renderHand(game.dealerHand, '🤖 Dealer')}

💥 *¡TE PASASTE!* Perdiste ${game.apuesta} XP.`;
      await client.sendMessage(m.chat, { text: msg }, { quoted: m });
      return true;
    }

    // 21 exacto, auto-stand
    if (playerTotal === 21) {
      resolveDealer(game);
      clearTimeout(game.timeoutId);
      global.juegos.delete(key);

      const dealerTotal = handTotal(game.dealerHand);
      let resultado, ganancia = 0;

      if (dealerTotal > 21 || playerTotal > dealerTotal) {
        ganancia = game.apuesta * 2;
        global.db.data.users[m.sender].exp = (global.db.data.users[m.sender].exp || 0) + ganancia;
        global.db.data.users[m.sender].gameWins = (global.db.data.users[m.sender].gameWins || 0) + 1;
        resultado = `🎉 *¡GANASTE!* +${ganancia} XP`;
      } else if (playerTotal === dealerTotal) {
        global.db.data.users[m.sender].exp = (global.db.data.users[m.sender].exp || 0) + game.apuesta;
        resultado = `🤝 *EMPATE.* Recuperas tu apuesta.`;
      } else {
        global.db.data.users[m.sender].gameLosses = (global.db.data.users[m.sender].gameLosses || 0) + 1;
        resultado = `😢 *PERDISTE.* -${game.apuesta} XP`;
      }

      const msg = `🃏 *B L A C K J A C K* 🃏

${renderHand(game.playerHand, '🧑 Tú')}
${renderHand(game.dealerHand, '🤖 Dealer')}

${resultado}`;
      await client.sendMessage(m.chat, { text: msg }, { quoted: m });
      return true;
    }

    // Continuar
    const msg = `🃏 *B L A C K J A C K* 🃏

${renderHand(game.playerHand, '🧑 Tú')}
${renderHand(game.dealerHand, '🤖 Dealer', true)}

Escribe *hit* o *stand*.`;
    await client.sendMessage(m.chat, { text: msg });
    return true;
  }

  // STAND
  resolveDealer(game);
  clearTimeout(game.timeoutId);
  global.juegos.delete(key);

  const playerTotal = handTotal(game.playerHand);
  const dealerTotal = handTotal(game.dealerHand);
  let resultado, ganancia = 0;

  if (dealerTotal > 21 || playerTotal > dealerTotal) {
    ganancia = game.apuesta * 2;
    global.db.data.users[m.sender].exp = (global.db.data.users[m.sender].exp || 0) + ganancia;
    global.db.data.users[m.sender].gameWins = (global.db.data.users[m.sender].gameWins || 0) + 1;
    resultado = `🎉 *¡GANASTE!* +${ganancia} XP`;
  } else if (playerTotal === dealerTotal) {
    global.db.data.users[m.sender].exp = (global.db.data.users[m.sender].exp || 0) + game.apuesta;
    resultado = `🤝 *EMPATE.* Recuperas tu apuesta.`;
  } else {
    global.db.data.users[m.sender].gameLosses = (global.db.data.users[m.sender].gameLosses || 0) + 1;
    resultado = `😢 *PERDISTE.* -${game.apuesta} XP`;
  }

  const msg = `🃏 *B L A C K J A C K* 🃏

${renderHand(game.playerHand, '🧑 Tú')}
${renderHand(game.dealerHand, '🤖 Dealer')}

${resultado}`;
  await client.sendMessage(m.chat, { text: msg }, { quoted: m });
  return true;
};
