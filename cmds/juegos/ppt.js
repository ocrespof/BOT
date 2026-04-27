export default {
  command: ['ppt', 'piedrapapeltijera'],
  category: 'juegos',
  desc: 'Juega a Piedra, Papel o Tijera contra el bot',
  usage: '[piedra/papel/tijera]',
  cooldown: 3,
  run: async (client, m, args, usedPrefix, command) => {
    if (!args[0]) {
      return m.reply(`《✧》 Debes elegir una opción.\n> ✎ Ejemplo: *${usedPrefix + command} piedra*`);
    }

    const opciones = ['piedra', 'papel', 'tijera'];
    const usuario = args[0].toLowerCase();

    if (!opciones.includes(usuario)) {
      return m.reply('《✧》 Opción no válida. Debes elegir entre: *piedra*, *papel* o *tijera*.');
    }

    const botChoice = opciones[Math.floor(Math.random() * opciones.length)];

    let resultado = '';
    if (usuario === botChoice) {
      resultado = '¡Es un empate! 😐';
    } else if (
      (usuario === 'piedra' && botChoice === 'tijera') ||
      (usuario === 'papel' && botChoice === 'piedra') ||
      (usuario === 'tijera' && botChoice === 'papel')
    ) {
      resultado = '¡Ganaste! 🎉';
    } else {
      resultado = '¡Perdiste! 😢';
    }

    const emojis = { piedra: '✊', papel: '✋', tijera: '✌️' };

    await m.reply(`« 𝐏𝐈𝐄𝐃𝐑𝐀, 𝐏𝐀𝐏𝐄𝐋 𝐎 𝐓𝐈𝐉𝐄𝐑𝐀 »\n\n> 🧑 Tú: ${usuario.toUpperCase()} ${emojis[usuario]}\n> 🤖 Bot: ${botChoice.toUpperCase()} ${emojis[botChoice]}\n\n> ❖ ${resultado}`);
  }
};
