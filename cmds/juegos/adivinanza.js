import { gameEngine } from '../../utils/gameEngine.js';
import axios from 'axios';
import translate from '@vitalets/google-translate-api';
import https from 'https';

const normalize = (str) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

// Filtra palabras comunes para la validación
const getKeywords = (str) => {
  const words = normalize(str).replace(/[^\w\sñ]/gi, '').split(/\s+/);
  return words.filter(w => w.length > 3 && !['como', 'para', 'pero', 'esto', 'aquel', 'tiene', 'esta'].includes(w));
};

export default {
  command: ['adivinanza', 'acertijo'],
  category: 'juegos',
  desc: 'Resuelve un acertijo dinámico extraído de una API pública.',
  cooldown: 5,
  run: async (client, m, args, usedPrefix, command) => {
    if (gameEngine.has(m.chat, 'adivinanza')) {
      return m.reply('🧠 Ya hay una adivinanza activa en este chat. ¡Resuélvela primero!');
    }

    await m.reply("Buscando un acertijo en la base de datos pública... 🕵️‍♂️");

    let question = "";
    let answer = "";

    try {
      const agent = new https.Agent({ rejectUnauthorized: false });
      const { data } = await axios.get('https://riddles-api.vercel.app/random', { httpsAgent: agent, timeout: 8000 });
      
      const textToTranslate = `${data.riddle} ||| ${data.answer}`;
      const translated = await translate(textToTranslate, { to: 'es' });
      
      const parts = translated.text.split('|||');
      question = parts[0]?.trim() || data.riddle;
      answer = parts[1]?.trim() || data.answer;
      
    } catch (e) {
      console.error("API de adivinanzas falló, usando fallback local:", e.message);
      question = "Soy más grande que la Tierra, pero no peso nada. ¿Qué soy?";
      answer = "El universo";
    }

    const recompensa = 350;

    gameEngine.start(m.chat, 'adivinanza', m.sender, {
      respuesta: answer
    }, {
      timeout: 90000,
      onTimeout: () => {
        client.sendMessage(m.chat, { text: `⏰ *TIEMPO AGOTADO*\nNadie pudo resolver la adivinanza.\nLa respuesta era: *${answer}* 😅` });
      }
    });

    const keywords = getKeywords(answer);
    let hint = "";
    if (keywords.length > 0) {
      hint = `💡 Pista: La respuesta contiene una palabra de ${keywords[0].length} letras que empieza con "${keywords[0][0].toUpperCase()}".`;
    }

    const caption = `🧠 *ACERTIJO PÚBLICO* 🧠\n\n${question}\n\n${hint}\n\n⏳ Tienes 90 segundos.\n💰 Premio: ${recompensa} XP`;

    await client.sendMessage(m.chat, { text: caption });
  }
};

export const before = async (client, m) => {
  const game = gameEngine.get(m.chat, 'adivinanza');
  if (!game) return false;

  if (!m.text) return false;
  const texto = normalize(m.text);
  const correcta = normalize(game.respuesta);
  
  // Validamos si adivinó toda la frase o la palabra clave más larga
  const keywords = getKeywords(game.respuesta);
  let acierto = false;

  if (texto === correcta || correcta.includes(texto) && texto.length > 5) {
    acierto = true;
  } else if (keywords.some(kw => texto.includes(kw) || kw.includes(texto) && texto.length >= kw.length - 1)) {
    acierto = true;
  }

  if (acierto) {
    gameEngine.end(m.chat, 'adivinanza');
    const xpPremio = 350;
    gameEngine.reward(m.sender, { xp: xpPremio, win: true });
    
    await client.sendMessage(m.chat, { 
      text: `🎉 *¡F E L I C I D A D E S!* 🎉\n\n@${m.sender.split('@')[0]} resolvió el acertijo.\nLa respuesta exacta era: *${game.respuesta}*\n🎁 Ganas *${xpPremio} XP*`, 
      mentions: [m.sender] 
    }, { quoted: m });
    return true;
  }
  
  return false;
};
