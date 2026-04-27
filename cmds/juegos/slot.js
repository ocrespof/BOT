export default {
  command: ['slot', 'tragamonedas', 'casino'],
  category: 'juegos',
  desc: 'Juega al tragamonedas',
  cooldown: 5,
  run: async (client, m) => {
    const emojis = ['🍎', '🍒', '🍋', '🍉', '⭐', '💎'];
    
    let a = Math.floor(Math.random() * emojis.length);
    let b = Math.floor(Math.random() * emojis.length);
    let c = Math.floor(Math.random() * emojis.length);
    
    const x = [], y = [], z = [];
    
    for (let i = 0; i < 3; i++) {
      x[i] = emojis[Math.floor(Math.random() * emojis.length)];
      y[i] = emojis[Math.floor(Math.random() * emojis.length)];
      z[i] = emojis[Math.floor(Math.random() * emojis.length)];
    }
    
    let end;
    if (a == b && b == c) {
      end = "¡JACKPOT! 🎉 Has ganado el premio gordo.";
    } else if (a == b || a == c || b == c) {
      end = "Casi... tienes dos iguales. ¡Sigue intentando! 😊";
    } else {
      end = "Perdiste. Más suerte la próxima vez 😢";
    }

    const slotText = `« 𝐓𝐑𝐀𝐆𝐀𝐌𝐎𝐍𝐄𝐃𝐀𝐒 »\n
 🎰 | ${x[0]} | ${y[0]} | ${z[0]} |
 🎰 | ${emojis[a]} | ${emojis[b]} | ${emojis[c]} | ⬅️
 🎰 | ${x[2]} | ${y[2]} | ${z[2]} |\n
> ❖ ${end}`;

    await m.reply(slotText);
  }
};
