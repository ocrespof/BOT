import { gameEngine } from '../../utils/gameEngine.js';
import translate from '@vitalets/google-translate-api';

const normalize = (str) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

const bancoPreguntasLocales = [
  { p: "¿Qué protocolo se utiliza para enviar correos electrónicos?", r: "smtp" },
  { p: "¿Qué significa HTML?", r: "hypertext markup language" },
  { p: "¿Cuál es el puerto predeterminado para HTTP?", r: "80" },
  { p: "¿Qué significa IP?", r: "internet protocol" },
  { p: "¿Qué dispositivo conecta diferentes redes entre sí?", r: "router" },
  { p: "¿Cuál es la unidad básica de información en informática?", r: "bit" },
  { p: "¿Qué protocolo se usa para la transferencia de archivos?", r: "ftp" },
  { p: "¿Qué componente es considerado el cerebro de la computadora?", r: "cpu" },
  { p: "¿Qué significa RAM?", r: "random access memory" },
  { p: "¿Qué lenguaje de programación es conocido por su logo de una taza de café?", r: "java" }
];

const decodeHTML = (str) => {
  return str.replace(/&quot;/g, '"')
            .replace(/&#039;/g, "'")
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>');
};

export default {
  command: ['trivia', 'triviatic'],
  category: 'juegos',
  desc: 'Juega una trivia de cultura general de respuesta libre (API externa).',
  cooldown: 5,
  run: async (client, m, args, usedPrefix, command) => {
    if (gameEngine.has(m.chat, 'trivia')) {
      return m.reply(' Ya hay una trivia activa en este chat. ¡Responde la pregunta actual!');
    }

    let apuesta = 200;
    if (args[0] && !isNaN(args[0])) {
      apuesta = parseInt(args[0]);
      if (apuesta < 10) return m.reply('❌ La apuesta mínima es de 10 XP.');
    }
    const bet = gameEngine.validateBet(m.sender, apuesta);
    if (bet === false) return m.reply(`❌ No tienes suficiente XP para esa apuesta. Tienes *${global.db.data.users[m.sender]?.exp || 0} XP*.`);

    let pText, rText;

    try {
      const res = await fetch('https://opentdb.com/api.php?amount=1');
      if (!res.ok) throw new Error("API falló");
      const data = await res.json();
      const item = data.results[0];

      const qEng = decodeHTML(item.question);
      const correctEng = decodeHTML(item.correct_answer);

      const allEng = [qEng, correctEng];
      const translated = await translate(allEng.join(' ||| '), { to: 'es' });
      const parts = translated.text.split(/\|\|\|/g).map(s => s.trim());

      pText = parts[0];
      rText = normalize(parts[1]); 
    } catch (e) {
      console.log("[Trivia] Fallback a preguntas locales:", e.message);
      const q = bancoPreguntasLocales[Math.floor(Math.random() * bancoPreguntasLocales.length)];
      pText = q.p;
      rText = q.r;
    }

    gameEngine.start(m.chat, 'trivia', m.sender, {
      answer: rText,
      apuesta: bet,
    }, {
      timeout: 45000,
      onTimeout: () => {
        client.sendMessage(m.chat, { text: `┌───「 ⏳ *TIEMPO AGOTADO* ⏳ 」───┐\n│ Nadie respondió a tiempo.\n│ La respuesta correcta era: *${rText}*\n└──────────────────────────┘` });
      }
    });

    // Pista visual para ayudar en respuestas libres traducidas
    const hint = rText.length > 2 ? `💡 Pista: Empieza por "${rText[0].toUpperCase()}" y tiene ${rText.replace(/\s/g, '').length} letras.` : "";

    await client.sendMessage(m.chat, { text: `┌───「 🧠 *TRIVIA GENERAL* 🧠 」───┐\n│ *Pregunta:* ${pText}\n│\n│ ${hint}\n│ 💰 *Apuesta:* ${bet} XP\n│ ⏳ Tienes *45 segundos* para responder.\n└────────────────────────┘` });
  },
};

export const before = async (client, m) => {
  if (!m.text) return;
  const juego = gameEngine.get(m.chat, 'trivia');
  if (!juego) return;

  const respuestaUsuario = normalize(m.text);
  const respuestaCorrecta = normalize(juego.answer);

  const acierto = (respuestaUsuario === respuestaCorrecta ||
    (respuestaCorrecta.length >= 4 && respuestaUsuario.includes(respuestaCorrecta)) ||
    (respuestaUsuario.length >= 4 && respuestaCorrecta.includes(respuestaUsuario)));

  if (acierto) {
    gameEngine.end(m.chat, 'trivia');
    const ganancia = juego.apuesta * 2;

    // Si ganó alguien diferente al que apostó, devolver apuesta al original
    if (m.sender !== juego.sender) {
      gameEngine.refundBet(juego.sender, juego.apuesta);
    }

    // Apply triviaBuff if active
    let multiplier = 1;
    const user = global.db.data.users[m.sender];
    if (user.triviaBuff && user.triviaBuff.expiresAt > Date.now()) {
      multiplier += user.triviaBuff.value;
    }

    gameEngine.reward(m.sender, { xp: ganancia, win: true, multiplier });

    await client.sendMessage(m.chat, {
      text: `┌───「 🎉 *¡CORRECTO!* 🎉 」───┐\n│ ¡Felicidades @${m.sender.split('@')[0]}!\n│ La respuesta era: *${juego.answer}*\n│ 💰 Ganaste *${ganancia} XP*\n└───────────────────────┘`,
      mentions: [m.sender]
    }, { quoted: m });
    return true;
  }
};
