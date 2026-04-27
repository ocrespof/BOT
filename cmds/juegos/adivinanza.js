import axios from 'axios';
import { translate } from '../../utils/translate.js';

global.juegos = global.juegos || new Map();

const normalize = (str) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

export default {
  command: ['adivinanza', 'acertijo', 'riddle'],
  category: 'juegos',
  desc: 'Juega a las adivinanzas',
  cooldown: 5,
  
  run: async (client, m) => {
    if (global.juegos.has(m.chat)) {
      return m.reply('《✧》 Ya hay un juego activo en este chat. ¡Responde el juego actual primero!');
    }

    try {
      await m.reply('⏳ Generando adivinanza...');
      const res = await axios.get('https://riddles-api.vercel.app/random');
      if (!res.data || !res.data.riddle) return m.reply('《✧》 Error al obtener la adivinanza.');
      
      const riddleEs = await translate(res.data.riddle, 'es', 'en');
      const answerEs = await translate(res.data.answer, 'es', 'en');

      const timeout = 45000; // 45 segundos
      const id = setTimeout(async () => {
        if (global.juegos.has(m.chat)) {
          global.juegos.delete(m.chat);
          await client.sendMessage(m.chat, { text: `⏳ ¡Se acabó el tiempo!\n> ❖ La respuesta correcta era: *${answerEs}*` });
        }
      }, timeout);

      global.juegos.set(m.chat, {
        type: 'adivinanza',
        answer: answerEs,
        timeoutId: id
      });

      const txt = `« 𝐀𝐃𝐈𝐕𝐈𝐍𝐀𝐍𝐙𝐀 »\n\n> ❖ ${riddleEs}\n\n⏳ Tienen *45 segundos* para adivinar. ¡Escriban su respuesta en el chat!`;
      await client.sendMessage(m.chat, { text: txt });

    } catch (err) {
      m.reply(`《✧》 Hubo un error al iniciar la adivinanza.`);
    }
  },

  before: async function (client, m) {
    if (!m.text || !global.juegos.has(m.chat)) return;
    
    const juego = global.juegos.get(m.chat);
    if (juego.type === 'adivinanza') {
      const respuestaUsuario = normalize(m.text);
      const respuestaCorrecta = normalize(juego.answer);
      
      // Permitir coincidencia parcial si la respuesta correcta tiene varias palabras y el usuario acierta la más larga
      const palabrasCorrectas = respuestaCorrecta.split(' ').filter(p => p.length > 3);
      let acierto = false;
      
      if (respuestaUsuario === respuestaCorrecta) {
        acierto = true;
      } else if (palabrasCorrectas.length > 0) {
         for (const palabra of palabrasCorrectas) {
             if (respuestaUsuario.includes(palabra)) acierto = true;
         }
      } else if (respuestaCorrecta.length > 3 && respuestaUsuario.includes(respuestaCorrecta)) {
          acierto = true;
      }

      if (acierto) {
        clearTimeout(juego.timeoutId);
        global.juegos.delete(m.chat);
        
        global.db.data.users[m.sender].exp = (global.db.data.users[m.sender].exp || 0) + 100;
        
        await client.sendMessage(m.chat, { text: `🎉 ¡Espléndido @${m.sender.split('@')[0]}!\n> ❖ La respuesta exacta era: *${juego.answer}*\n> 💰 Has ganado 100 XP.`, mentions: [m.sender] }, { quoted: m });
        return true; 
      }
    }
  }
};

export const before = async (client, m) => {
  if (!m.text || !global.juegos.has(m.chat)) return;
  const juego = global.juegos.get(m.chat);
  if (juego.type === 'adivinanza') {
    const respuestaUsuario = normalize(m.text);
    const respuestaCorrecta = normalize(juego.answer);
    const palabrasCorrectas = respuestaCorrecta.split(' ').filter(p => p.length > 3);
    let acierto = false;
    if (respuestaUsuario === respuestaCorrecta) {
      acierto = true;
    } else if (palabrasCorrectas.length > 0) {
      for (const palabra of palabrasCorrectas) {
        if (respuestaUsuario.includes(palabra)) acierto = true;
      }
    } else if (respuestaCorrecta.length > 3 && respuestaUsuario.includes(respuestaCorrecta)) {
      acierto = true;
    }
    if (acierto) {
      clearTimeout(juego.timeoutId);
      global.juegos.delete(m.chat);
      global.db.data.users[m.sender].exp = (global.db.data.users[m.sender].exp || 0) + 100;
      await client.sendMessage(m.chat, { text: `🎉 ¡Espléndido @${m.sender.split('@')[0]}!\n> ❖ La respuesta exacta era: *${juego.answer}*\n> 💰 Has ganado 100 XP.`, mentions: [m.sender] }, { quoted: m });
      return true;
    }
  }
};
