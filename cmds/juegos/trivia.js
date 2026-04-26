import axios from 'axios';
import { translate } from '../../utils/translate.js';

global.juegos = global.juegos || new Map();

const normalize = (str) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

export default {
  command: ['trivia', 'preguntados', 'pregunta'],
  category: 'juegos',
  desc: 'Responde una trivia al azar generada por IA (OpenTDB)',
  cooldown: 5,
  
  run: async (client, m) => {
    if (global.juegos.has(m.chat)) {
      return m.reply('《✧》 Ya hay un juego activo en este chat. ¡Responde la pregunta actual!');
    }

    try {
      await m.reply('⏳ Generando pregunta de trivia...');
      const res = await axios.get('https://opentdb.com/api.php?amount=1&type=multiple');
      if (!res.data.results || !res.data.results.length) return m.reply('《✧》 Error al obtener la trivia.');
      
      const trivia = res.data.results[0];
      const questionEn = decodeURIComponent(trivia.question.replace(/&quot;/g, '"').replace(/&#039;/g, "'"));
      const answerEn = decodeURIComponent(trivia.correct_answer.replace(/&quot;/g, '"').replace(/&#039;/g, "'"));
      
      const questionEs = await translate(questionEn, 'es', 'en');
      const answerEs = await translate(answerEn, 'es', 'en');

      const timeout = 30000; // 30 segundos
      const id = setTimeout(async () => {
        if (global.juegos.has(m.chat)) {
          global.juegos.delete(m.chat);
          await client.sendMessage(m.chat, { text: `⏳ ¡Tiempo agotado!\n> ❖ La respuesta correcta era: *${answerEs}*` });
        }
      }, timeout);

      global.juegos.set(m.chat, {
        type: 'trivia',
        answer: answerEs,
        timeoutId: id,
        sender: m.sender
      });

      const txt = `« 𝐓𝐑𝐈𝐕𝐈𝐀 »\n\n> ❖ ${questionEs}\n\n⏳ Tienes *30 segundos* para responder.`;
      await client.sendMessage(m.chat, { text: txt });

    } catch (err) {
      m.reply(`《✧》 Hubo un error al iniciar la trivia.`);
    }
  },

  before: async function (client, m) {
    if (!m.text || !global.juegos.has(m.chat)) return;
    
    const juego = global.juegos.get(m.chat);
    if (juego.type === 'trivia') {
      const respuestaUsuario = normalize(m.text);
      const respuestaCorrecta = normalize(juego.answer);
      
      if (respuestaUsuario === respuestaCorrecta || (respuestaUsuario.length >= 4 && respuestaCorrecta.includes(respuestaUsuario))) {
        clearTimeout(juego.timeoutId);
        global.juegos.delete(m.chat);
        
        // Sumar stats si tuvieras economía
        global.db.data.users[m.sender].exp = (global.db.data.users[m.sender].exp || 0) + 50;
        
        await client.sendMessage(m.chat, { text: `🎉 ¡Correcto @${m.sender.split('@')[0]}!\n> ❖ La respuesta era: *${juego.answer}*\n> 💰 Has ganado 50 XP.`, mentions: [m.sender] }, { quoted: m });
        return true; 
      }
    }
  }
};
