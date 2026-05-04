import { gameEngine } from '../../utils/gameEngine.js';

const normalize = (str) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

const adivinanzas = [
  { p: "Oro parece, plata no es, el que no lo adivine, bien tonto es.", r: "platano" },
  { p: "Tengo agujas pero no sé coser, tengo números pero no sé leer, las horas te doy ¿Sabes quién soy?", r: "reloj" },
  { p: "Blanca por dentro, verde por fuera. Si quieres que te lo diga, espera.", r: "pera" },
  { p: "Vuelo de noche, duermo de día y nunca verás plumas en el ala mía.", r: "murcielago" },
  { p: "Soy chiquito y nado sin parar, vivo en el río y también en el mar.", r: "pez" },
  { p: "Una caja pequeñita, blanca como la cal, todos la saben abrir, nadie la sabe cerrar.", r: "huevo" },
  { p: "Tengo patas y no camino, tengo ojos y no veo, tengo boca y no hablo.", r: "mesa" },
  { p: "Verde como el campo, pero campo no es, habla como el hombre, pero hombre no es.", r: "loro" },
  { p: "Sal al campo por la noche si me quieres conocer, soy señor de grandes ojos, cara seria y gran saber.", r: "buho" },
  { p: "Canto en la orilla, vivo en el agua, no soy pescado y tampoco cigarra.", r: "rana" },
  { p: "Viene de la tierra, es blanca y nos da mucha energía.", r: "leche" },
  { p: "Me escriben con cuatro letras, con tres me quitan el sueño, con dos me quitan la vida.", r: "amor" },
  { p: "Pobrecito, pobrecito, todo el día está en la cama y no está enfermito.", r: "colchon" },
  { p: "Dos hermanitos muy unidos que siempre van por el mismo camino.", r: "pies" },
  { p: "Mil agujeritos tengo y el agua no se me escapa.", r: "esponja" },
  { p: "Llevo mi casa a cuestas, camino sin tener patas y voy dejando mi huella con un hilito de plata.", r: "caracol" },
  { p: "Zapatos de cuero, ojos de cristal, camino por la nieve y no me puedo mojar.", r: "esqui" },
  { p: "Soy un palito muy flaquito con una bola arriba que da mucha luz.", r: "fosforo" },
  { p: "Tengo escamas pero no soy pez, tengo corona pero no soy rey.", r: "piña" },
  { p: "Blanco es, la gallina lo pone, con aceite se fríe y con pan se come.", r: "huevo" }
];

export default {
  command: ['adivinanza', 'acertijo', 'riddle'],
  category: 'juegos',
  desc: 'Juega a las adivinanzas.',
  cooldown: 5,
  run: async (client, m, args, usedPrefix, command) => {
    if (gameEngine.has(m.chat, 'adivinanza')) return m.reply(' Ya hay una adivinanza activa en este chat. ¡Responde primero!');

    let apuesta = 150;
    if (args[0] && !isNaN(args[0])) { apuesta = parseInt(args[0]); if (apuesta < 10) return m.reply('❌ La apuesta mínima es de 10 XP.'); }
    const bet = gameEngine.validateBet(m.sender, apuesta);
    if (bet === false) return m.reply(`❌ No tienes suficiente XP. Tienes *${global.db.data.users[m.sender]?.exp || 0} XP*.`);

    const item = adivinanzas[Math.floor(Math.random() * adivinanzas.length)];

    gameEngine.start(m.chat, 'adivinanza', m.sender, {
      answer: item.r, apuesta: bet,
    }, {
      timeout: 60000,
      onTimeout: () => client.sendMessage(m.chat, { text: `⏳ ¡Se acabó el tiempo!\nLa respuesta correcta era: *${item.r}*` }),
    });

    await client.sendMessage(m.chat, { text: `« 𝐀𝐃𝐈𝐕𝐈𝐍𝐀𝐍𝐙𝐀 \n\n${item.p}\n\n💰 *Apuesta:* ${bet} XP\n⏳ Tienen *60 segundos* para adivinar. ¡Escriban su respuesta en el chat!` });
  }
};

export const before = async (client, m) => {
  if (!m.text) return;
  const juego = gameEngine.get(m.chat, 'adivinanza');
  if (!juego) return;

  const respuestaUsuario = normalize(m.text);
  const respuestaCorrecta = normalize(juego.answer);
  const acierto = (respuestaUsuario === respuestaCorrecta ||
    (respuestaCorrecta.length > 3 && respuestaUsuario.includes(respuestaCorrecta)) ||
    (respuestaUsuario.length > 3 && respuestaCorrecta.includes(respuestaUsuario)));

  if (acierto) {
    gameEngine.end(m.chat, 'adivinanza');
    const ganancia = juego.apuesta * 2;

    if (m.sender !== juego.sender) gameEngine.refundBet(juego.sender, juego.apuesta);
    gameEngine.reward(m.sender, { xp: ganancia, win: true });

    await client.sendMessage(m.chat, {
      text: `🎉 ¡Excelente @${m.sender.split('@')[0]}!\nLa respuesta era: *${juego.answer}*\n💰 Has ganado ${ganancia} XP.`,
      mentions: [m.sender]
    }, { quoted: m });
    return true;
  }
};
