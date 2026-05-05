import { gameEngine } from '../../utils/gameEngine.js';

const lugares = [
  { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Eiffel_Tower_from_the_Trocad%C3%A9ro_2.jpg/1200px-Eiffel_Tower_from_the_Trocad%C3%A9ro_2.jpg', pais: 'FRANCIA', nombre: 'TORRE EIFFEL' },
  { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Tour_Eiffel_Wikimedia_Commons_%28cropped%29.jpg/800px-Tour_Eiffel_Wikimedia_Commons_%28cropped%29.jpg', pais: 'FRANCIA', nombre: 'TORRE EIFFEL' },
  { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Machu_Picchu_Peru.jpg/1200px-Machu_Picchu_Peru.jpg', pais: 'PERU', nombre: 'MACHU PICCHU' },
  { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Taj_Mahal_in_March_2004.jpg/1200px-Taj_Mahal_in_March_2004.jpg', pais: 'INDIA', nombre: 'TAJ MAHAL' },
  { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Taj_Mahal_in_March_2004.jpg/800px-Taj_Mahal_in_March_2004.jpg', pais: 'INDIA', nombre: 'TAJ MAHAL' },
  { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/The_Great_Wall_of_China_at_Jinshanling-edit.jpg/1200px-The_Great_Wall_of_China_at_Jinshanling-edit.jpg', pais: 'CHINA', nombre: 'MURALLA CHINA' },
  { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/Fox_Glacier_New_Zealand_1.JPG/1200px-Fox_Glacier_New_Zealand_1.JPG', pais: 'NUEVA ZELANDA', nombre: 'NUEVA ZELANDA' },
  { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Statue_of_Liberty_7.jpg/1200px-Statue_of_Liberty_7.jpg', pais: 'ESTADOS UNIDOS', nombre: 'ESTATUA DE LA LIBERTAD' },
  { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Sydney_Opera_House_and_Harbour_Bridge_from_the_air_%28cropped%29.jpg/1200px-Sydney_Opera_House_and_Harbour_Bridge_from_the_air_%28cropped%29.jpg', pais: 'AUSTRALIA', nombre: 'OPERA DE SIDNEY' },
  { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Colosseum_in_Rome%2C_Italy_-_April_2007.jpg/1200px-Colosseum_in_Rome%2C_Italy_-_April_2007.jpg', pais: 'ITALIA', nombre: 'COLISEO ROMANO' },
  { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Sydney_Opera_House_and_Harbour_Bridge.jpg/1200px-Sydney_Opera_House_and_Harbour_Bridge.jpg', pais: 'AUSTRALIA', nombre: 'OPERA DE SIDNEY' },
  { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Statue_of_Liberty%2C_NY.jpg/1200px-Statue_of_Liberty%2C_NY.jpg', pais: 'ESTADOS UNIDOS', nombre: 'ESTATUA DE LA LIBERTAD' },
  { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Christ_the_Redeemer_-_Cristo_Redentor.jpg/1200px-Christ_the_Redeemer_-_Cristo_Redentor.jpg', pais: 'BRASIL', nombre: 'CRISTO REDENTOR' },
  { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Machu_Picchu%2C_Peru_%282018%29.jpg/1200px-Machu_Picchu%2C_Peru_%282018%29.jpg', pais: 'PERU', nombre: 'MACHU PICCHU' },
  { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Chichen_Itza_3.jpg/1200px-Chichen_Itza_3.jpg', pais: 'MEXICO', nombre: 'CHICHEN ITZA' },
  { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Mount_Fuji_from_Lake_Kawaguchi.jpg/1200px-Mount_Fuji_from_Lake_Kawaguchi.jpg', pais: 'JAPON', nombre: 'MONTE FUJI' },
  { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Big_Ben_and_Westminster_Bridge.jpg/1200px-Big_Ben_and_Westminster_Bridge.jpg', pais: 'REINO UNIDO', nombre: 'BIG BEN' },
  { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Acropolis_of_Athens_02.jpg/1200px-Acropolis_of_Athens_02.jpg', pais: 'GRECIA', nombre: 'ACROPOLIS' },
  { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Petra_Jordan_BW_21.JPG/1200px-Petra_Jordan_BW_21.JPG', pais: 'JORDANIA', nombre: 'PETRA' },
  { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Sagrada_Familia_01.jpg/1200px-Sagrada_Familia_01.jpg', pais: 'ESPANA', nombre: 'SAGRADA FAMILIA' }
];

export default {
  command: ['cazatesoro', 'geoguessr'],
  category: 'juegos',
  desc: 'Juega a Caza del Tesoro adivinando el país o lugar de la imagen',
  cooldown: 10,
  run: async (client, m, args, usedPrefix, command) => {
    if (gameEngine.has(m.chat, 'cazatesoro')) return m.reply('🗺️ Ya hay una Caza del Tesoro activa en este chat.');

    const lugarSeleccionado = lugares[Math.floor(Math.random() * lugares.length)];

    gameEngine.start(m.chat, 'cazatesoro', m.sender, {
      pais: lugarSeleccionado.pais,
      nombre: lugarSeleccionado.nombre,
      iniciadoPor: m.sender,
      intentos: []
    }, {
      timeout: 60000,
      onTimeout: () => {
        client.sendMessage(m.chat, { text: `⏰ *TIEMPO AGOTADO*\nNadie descubrió el lugar.\nEra: *${lugarSeleccionado.nombre}* en *${lugarSeleccionado.pais}* 🗺️` });
      }
    });

    const caption = `🗺️ *CAZA DEL TESORO* 🗺️\n\n¿En qué *país* o qué *lugar* es este? Responde en este chat para adivinar.\n\n⏳ Tienes 60 segundos.\n💰 Premio: 250 XP`;
    await client.sendMessage(m.chat, { image: { url: lugarSeleccionado.url }, caption }, { quoted: m });
  }
};

export const before = async (client, m) => {
  const game = gameEngine.get(m.chat, 'cazatesoro');
  if (!game) return false;

  const text = m.text.trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (!text || text.length < 3) return false;

  if (text === game.pais || text === game.nombre) {
    gameEngine.end(m.chat, 'cazatesoro');
    const xpPremio = 250;
    gameEngine.reward(m.sender, { xp: xpPremio, win: true });
    await client.sendMessage(m.chat, { text: `🎉 *¡F E L I C I D A D E S!* 🎉\n\n@${m.sender.split('@')[0]} ha encontrado el tesoro.\nEl lugar era: *${game.nombre}* en *${game.pais}* 🗺️\n🎁 Ganas *${xpPremio} XP*`, mentions: [m.sender] }, { quoted: m });
    return true;
  }
  
  return false;
};
