import { gameEngine } from '../../utils/gameEngine.js';
import axios from 'axios';

const hangmanImages = [
  'https://upload.wikimedia.org/wikipedia/commons/8/8b/Hangman-0.png',
  'https://upload.wikimedia.org/wikipedia/commons/3/30/Hangman-1.png',
  'https://upload.wikimedia.org/wikipedia/commons/7/70/Hangman-2.png',
  'https://upload.wikimedia.org/wikipedia/commons/9/97/Hangman-3.png',
  'https://upload.wikimedia.org/wikipedia/commons/2/27/Hangman-4.png',
  'https://upload.wikimedia.org/wikipedia/commons/6/6b/Hangman-5.png',
  'https://upload.wikimedia.org/wikipedia/commons/d/d6/Hangman-6.png'
];

async function obtenerPalabra() {
  try {
    const res = await axios.get('https://random-word-api.herokuapp.com/word?lang=es');
    if (res.data && res.data.length > 0) {
      return res.data[0].toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    }
  } catch (e) {
    console.error("API de palabras falló, usando fallback");
  }
  // Fallback
  const fallback = ["PROGRAMACION", "COMPUTADORA", "INTELIGENCIA", "WHATSAPP", "JAVASCRIPT", "TECLADO", "DESARROLLADOR"];
  return fallback[Math.floor(Math.random() * fallback.length)];
}

export default {
  command: ['ahorcado', 'hangman'],
  category: 'juegos',
  desc: 'Juega al ahorcado visual adivinando la palabra secreta (API Infinita)',
  cooldown: 5,
  run: async (client, m, args, usedPrefix, command) => {
    if (gameEngine.has(m.chat, 'ahorcado')) return m.reply('🎮 Ya hay un juego de ahorcado activo en este chat.');

    let apuesta = 150;
    if (args[0] && !isNaN(args[0])) { apuesta = parseInt(args[0]); if (apuesta < 10) return m.reply('❌ La apuesta mínima es de 10 XP.'); }
    const bet = gameEngine.validateBet(m.sender, apuesta);
    if (bet === false) return m.reply(`❌ No tienes suficiente XP. Tienes *${global.db.data.users[m.sender]?.exp || 0} XP*.`);

    await m.reply("Generando palabra y preparando el juego...");
    const palabraSecreta = await obtenerPalabra();
    const progreso = Array(palabraSecreta.length).fill('_');

    gameEngine.start(m.chat, 'ahorcado', m.sender, {
      palabra: palabraSecreta, progreso, intentos: 0, letrasUsadas: [], maxIntentos: 6, apuesta: bet, jugador: m.sender,
    }, {
      timeout: 180000,
      onTimeout: () => client.sendMessage(m.chat, { text: `⏰ Tiempo agotado. La palabra era: *${palabraSecreta}*` }),
    });

    const caption = `🎮 *EL AHORCADO PRO* 🎮\n\nPalabra: \`${progreso.join(' ')}\`\n💰 Apuesta: ${bet} XP\n\n*Envía una letra* o *la palabra completa* para adivinar.`;
    await client.sendMessage(m.chat, { image: { url: hangmanImages[0] }, caption }, { quoted: m });
  }
};

export const before = async (client, m) => {
  const game = gameEngine.get(m.chat, 'ahorcado');
  if (!game) return false;
  
  const text = m.text.trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (!text || !/^[A-Z]+$/.test(text)) return false;

  // Intento de palabra completa
  if (text.length > 1) {
    if (text === game.palabra) {
      gameEngine.end(m.chat, 'ahorcado');
      const ganancia = game.apuesta * 3; // Bonus x3 por adivinar de golpe
      gameEngine.reward(m.sender, { xp: ganancia, win: true });
      await client.sendMessage(m.chat, { text: `🎉 *¡INCREÍBLE!* 🎉\n\n@${m.sender.split('@')[0]} adivinó la palabra completa de golpe: *${game.palabra}*\n🎁 Ganaste un bonus de *${ganancia} XP*`, mentions: [m.sender] }, { quoted: m });
      return true;
    } else {
      game.intentos++;
      await client.sendMessage(m.chat, { text: `❌ *${text}* NO es la palabra. Te sumas 1 error.` }, { quoted: m });
    }
  } else {
    // Intento de una sola letra
    if (game.letrasUsadas.includes(text)) {
      await client.sendMessage(m.chat, { text: `⚠️ Ya intentaste la letra *${text}*.` }, { quoted: m });
      return true;
    }

    game.letrasUsadas.push(text);
    let acierto = false;
    for (let i = 0; i < game.palabra.length; i++) { 
      if (game.palabra[i] === text) { 
        game.progreso[i] = text; 
        acierto = true; 
      } 
    }
    if (!acierto) game.intentos++;
  }

  // Comprobar derrota
  if (game.intentos >= game.maxIntentos) {
    gameEngine.end(m.chat, 'ahorcado');
    gameEngine.loss(m.sender);
    const caption = `💀 *¡ESTÁS AHORCADO!* 💀\n\nPerdiste la apuesta. La palabra secreta era: *${game.palabra}*`;
    await client.sendMessage(m.chat, { image: { url: hangmanImages[6] }, caption }, { quoted: m });
    return true;
  }

  // Comprobar victoria
  if (!game.progreso.includes('_')) {
    gameEngine.end(m.chat, 'ahorcado');
    const ganancia = game.apuesta * 2;
    gameEngine.reward(m.sender, { xp: ganancia, win: true });
    await client.sendMessage(m.chat, { text: `🎉 *¡F E L I C I D A D E S!* 🎉\n\n@${m.sender.split('@')[0]} completó la palabra: *${game.palabra}*\n🎁 Ganaste *${ganancia} XP*`, mentions: [m.sender] }, { quoted: m });
    return true;
  }

  // Continuar juego enviando progreso
  const caption = `🎮 *PROGRESO* 🎮\n\nPalabra: \`${game.progreso.join(' ')}\`\nUsadas: *${game.letrasUsadas.join(', ')}*\nFallos: ${game.intentos}/${game.maxIntentos}`;
  await client.sendMessage(m.chat, { image: { url: hangmanImages[game.intentos] }, caption });
  
  return true;
};
