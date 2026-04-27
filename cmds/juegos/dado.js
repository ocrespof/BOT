export default {
  command: ['dado', 'dados', 'roll'],
  category: 'juegos',
  desc: 'Tira un dado del 1 al 6',
  cooldown: 2,
  run: async (client, m) => {
    const caras = ['⚀ 1', '⚁ 2', '⚂ 3', '⚃ 4', '⚄ 5', '⚅ 6'];
    const resultado = caras[Math.floor(Math.random() * caras.length)];
    
    await m.reply(`« 𝐓𝐈𝐑𝐀𝐍𝐃𝐎 𝐃𝐀𝐃𝐎𝐒 »\n\n> 🎲 Ha caído el número:\n> ❖ *${resultado}*`);
  }
};
