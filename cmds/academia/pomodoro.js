export default {
  command: ['pomodoro', 'pomo', 'estudio'],
  category: 'academia',
  run: async (client, m, args, usedPrefix, command) => {
    const tiempoEstudio = 25 * 60 * 1000; // 25 Minutos
    
    await m.reply(`🍅 *Temporizador Pomodoro Iniciado*\n\n> ✎ ¡Concéntrate! Estudiarás por *25 minutos* sin distracciones. Tu celular está en modo de estudio temporal.\n> ✎ Te avisaré mencionándote cuando termine el lapso de enfoque.`);
    
    setTimeout(async () => {
      try {
        await client.sendMessage(m.chat, { 
          text: `🍅 *¡TIEMPO FINALIZADO!* 🍅\n\nHola @${m.sender.split('@')[0]}, tus 25 minutos de enfoque han concluido.\n\n> ✎ Toma un descanso de *5 a 10 minutos* (camina, bebe agua o estírate) antes de iniciar otro ciclo con ${usedPrefix}pomodoro.`,
          mentions: [m.sender]
        });
      } catch (e) {} // Error silent si el chat no está disponible
    }, tiempoEstudio);
  }
}
