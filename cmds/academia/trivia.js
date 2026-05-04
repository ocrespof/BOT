const preguntas = [
  { p: "¿Cuál es el planeta más grande de nuestro sistema solar?", op: ["Tierra", "Marte", "Júpiter"], re: "C" },
  { p: "¿Quién pintó la Mona Lisa?", op: ["Vincent van Gogh", "Leonardo da Vinci", "Pablo Picasso"], re: "B" },
  { p: "¿Cuál es el océano más grande del mundo?", op: ["Atlántico", "Índico", "Pacífico"], re: "C" },
  { p: "¿Qué elemento químico tiene el símbolo O?", op: ["Oro", "Oxígeno", "Osmio"], re: "B" },
  { p: "¿En qué año llegó el hombre a la luna por primera vez?", op: ["1969", "1950", "1975"], re: "A" },
  { p: "¿Cómo se llama el proceso por el cual las plantas crean comida?", op: ["Respiración", "Fotosíntesis", "Fermentación"], re: "B" },
  { p: "¿Cuál de estos países no pertenece a Sudamérica?", op: ["Bolivia", "España", "Colombia"], re: "B" },
  { p: "¿Qué órgano bombea la sangre en el cuerpo humano?", op: ["Cerebro", "Estómago", "Corazón"], re: "C" },
  { p: "¿Cuál es la moneda nacional de Japón?", op: ["Yen", "Dólar", "Euro"], re: "A" },
  { p: "¿Cuántos continentes hay en el planeta Tierra?", op: ["5", "7", "6"], re: "B" },
  { p: "¿En qué país se originaron los Juegos Olímpicos?", op: ["Roma", "Grecia", "Egipto"], re: "B" },
  { p: "¿Quién escribió la novela Cien Años de Soledad?", op: ["Julio Cortázar", "Pablo Neruda", "Gabriel García Márquez"], re: "C" },
  { p: "¿Qué gas respiramos principalmente para sobrevivir?", op: ["Dióxido de Carbono", "Oxígeno", "Helio"], re: "B" },
  { p: "¿Con qué se fabrica antiguamente el pergamino?", op: ["Piel de animal", "Hojas de papiro", "Madera"], re: "A" },
  { p: "¿Cuál es la velocidad de la luz (aprox. en km/s)?", op: ["30,000", "3,000", "300,000"], re: "C" },
  { p: "¿En Informática, qué significa RAM?", op: ["Random Access Memory", "Read Access Memory", "Real Audio Matrix"], re: "A" },
  { p: "¿A qué temperatura hierve el agua a nivel del mar?", op: ["100°C", "90°C", "120°C"], re: "A" },
  { p: "¿Cómo se le llama al polígono de tres lados?", op: ["Rombo", "Triángulo", "Cuadrado"], re: "B" },
  { p: "¿En qué parte del cuerpo humano se encuentra el fémur?", op: ["Brazo", "Tórax", "Pierna"], re: "C" },
  { p: "¿Cuál es el río más largo del mundo?", op: ["Nilo", "Amazonas", "Misisipi"], re: "B" }
];

export default {
  command: ['quizacademico', 'quiz', 'preguntados'],
  category: 'academia',
  run: async (client, m, args, usedPrefix, command) => {
    global.db.data = global.db.data || {};
    global.db.data.trivia = global.db.data.trivia || {};

    if (global.db.data.trivia[m.chat]) {
      return m.reply(` Ya hay un juego de trivia activo en este chat.\nLa pregunta es:\n*${global.db.data.trivia[m.chat].p}*`);
    }

    const aleatorio = preguntas[Math.floor(Math.random() * preguntas.length)];
    
    global.db.data.trivia[m.chat] = {
      p: aleatorio.p,
      r: aleatorio.re,
      timer: setTimeout(async () => {
        if (global.db.data.trivia[m.chat]) {
          try {
            await client.sendMessage(m.chat, { text: ` ¡Tiempo acabado! ⏳\nNadie contestó correctamente.\nLa respuesta era la *${aleatorio.re}*.` });
          } catch(e){}
          delete global.db.data.trivia[m.chat];
        }
      }, 60000) 
    };

    let txt = `*🧠 TRIVIA EDUCATIVA (60 Segundos)*\n\n`;
    txt += `*Pregunta:* ${aleatorio.p}\n\n`;
    txt += `*A)* ${aleatorio.op[0]}\n`;
    txt += `*B)* ${aleatorio.op[1]}\n`;
    txt += `*C)* ${aleatorio.op[2]}\n\n`;
    txt += `> Observación: Responde enviando solo la letra ('A', 'B' o 'C'). ¡El bot detectará al primero!`;

    await client.sendMessage(m.chat, { text: txt }, { quoted: m });
  },

  before: async function (client, m, { }) {
    if (!m.text) return false;
    global.db.data = global.db.data || {};
    global.db.data.trivia = global.db.data.trivia || {};

    let current = global.db.data.trivia[m.chat];
    if (!current) return false;

    let resUser = m.text.trim().toUpperCase();
    
    if (["A", "B", "C"].includes(resUser)) {
      if (resUser === current.r) {
        clearTimeout(current.timer);
        delete global.db.data.trivia[m.chat];
        try {
            await client.sendMessage(m.chat, { 
              text: `🎉 *¡CORRECTO!* 🎉\nHola @${m.sender.split('@')[0]}, tu respuesta (*${resUser}*) ha sido exactamente la correcta. ¡Enhorabuena, ganaste este duelo!`,
              mentions: [m.sender]
            }, { quoted: m });
        } catch(e){}
        return true; 
      }
    }
    return false;
  }
}
