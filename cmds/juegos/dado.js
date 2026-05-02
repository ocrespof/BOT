export default {
  command: ['dado', 'dados', 'roll', 'dice'],
  category: 'juegos',
  desc: 'Tira un dado del 1 al 6 (sticker)',
  cooldown: 2,
  run: async (client, m) => {
    const diceLinks = [
      'https://tinyurl.com/gdd01',
      'https://tinyurl.com/gdd02',
      'https://tinyurl.com/gdd003',
      'https://tinyurl.com/gdd004',
      'https://tinyurl.com/gdd05',
      'https://tinyurl.com/gdd006'
    ];

    const randomDice = diceLinks[Math.floor(Math.random() * diceLinks.length)];

    try {
      await client.sendMessage(m.chat, {
        sticker: { url: randomDice }
      }, { quoted: m });
    } catch(e) {
      console.error('Dado Plugin Error:', e);
      await client.sendMessage(m.chat, {
        image: { url: randomDice },
        caption: '🎲 ¡El dado ha caído!'
      }, { quoted: m });
    }
  }
};
