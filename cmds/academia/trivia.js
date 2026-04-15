import fetch from 'node-fetch';

const fallbackPreguntas = [
  { p: "¿Cuál es el planeta más grande de nuestro sistema solar?", op: ["Tierra", "Marte", "Júpiter"], re: "C" },
  { p: "¿Quién pintó la Mona Lisa?", op: ["Vincent van Gogh", "Leonardo da Vinci", "Pablo Picasso"], re: "B" },
  { p: "¿Cuál es el océano más grande del mundo?", op: ["Atlántico", "Índico", "Pacífico"], re: "C" },
  { p: "¿En qué año llegó el hombre a la luna por primera vez?", op: ["1969", "1950", "1975"], re: "A" }
];

export default {
  command: ['trivia', 'preguntados'],
  category: 'academia',
  run: async (client, m, args, usedPrefix, command) => {
    global.db.data = global.db.data || {};
    global.db.data.trivia = global.db.data.trivia || {};

    if (global.db.data.trivia[m.chat]) {
      return m.reply(`《✧》 Ya hay un juego de trivia activo en este chat.\nLa pregunta es:\n*${global.db.data.trivia[m.chat].p}*`);
    }

    await m.react('🕒');
    
    let aleatorio = null;
    
    // 1. Intentar obtener una pregunta infinita usando la IA
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      
      const prompt = `Responde SOLO con un JSON valido con esta estructura: {"p":"Pregunta aleatoria","op":["Opcion1","Opcion2","Opcion3"],"re":"A"}. Asegurate que "re" sea la letra A, B o C correspondiente a la correcta.`;
      const text = `Genera una pregunta de cultura general o ciencia aleatoria y no repetitiva en español.`;
      const url = `${global.APIs.stellar.url}/ai/gptprompt?prompt=${encodeURIComponent(prompt)}&text=${encodeURIComponent(text)}&key=${global.APIs.stellar.key}`;
      
      const req = await fetch(url, { signal: controller.signal });
      const json = await req.json();
      clearTimeout(timeout);
      
      if (json?.result) {
        let cleanJson = json.result.replace(/```json/g, '').replace(/```/g, '').trim();
        aleatorio = JSON.parse(cleanJson);
      }
    } catch (e) {
      console.log('Error al obtener trivia de IA, usando fallback...');
    }
    
    // 2. Si la IA falla, usar la base de respaldo
    if (!aleatorio || !aleatorio.p || !aleatorio.op) {
      aleatorio = fallbackPreguntas[Math.floor(Math.random() * fallbackPreguntas.length)];
    }

    // Inicializamos la sesión de juego
    global.db.data.trivia[m.chat] = {
      p: aleatorio.p,
      r: aleatorio.re.toUpperCase(),
      opciones: aleatorio.op,
      eliminados: [], // Para rastrear a los que se equivocan y evitar spam
      timer: setTimeout(async () => {
        if (global.db.data.trivia[m.chat]) {
          try {
            await client.sendMessage(m.chat, { text: `《✧》 ¡Tiempo acabado! ⏳\nNadie contestó correctamente.\nLa respuesta era la *${global.db.data.trivia[m.chat].r}* (${aleatorio.op[global.db.data.trivia[m.chat].r.charCodeAt(0) - 65]}).` });
          } catch(e){}
          delete global.db.data.trivia[m.chat];
        }
      }, 60000) 
    };

    let txt = `*🧠 TRIVIA INFINITA (60 Segundos)*\n\n`;
    txt += `*Pregunta:* ${aleatorio.p}\n\n`;
    txt += `*A)* ${aleatorio.op[0]}\n`;
    txt += `*B)* ${aleatorio.op[1]}\n`;
    txt += `*C)* ${aleatorio.op[2]}\n\n`;
    txt += `> Responde enviando la letra *(A, B o C)* o escribiendo la *respuesta completa*. ¡Si fallas serás eliminado de esta ronda!`;

    await m.react('✔️');
    await client.sendMessage(m.chat, { text: txt }, { quoted: m });
  },

  before: async function (client, m) {
    let text = m.text || m.body || m.message?.conversation || m.message?.extendedTextMessage?.text || '';
    if (!text) return false;

    global.db.data = global.db.data || {};
    global.db.data.trivia = global.db.data.trivia || {};

    let current = global.db.data.trivia[m.chat];
    if (!current) return false;
    
    // Si el usuario ya falló en esta ronda, ignorarlo
    if (current.eliminados.includes(m.sender)) return false;

    let resUser = text.trim().toUpperCase();
    
    // Map para obtener texto de las opciones
    const opcionesMap = {
      "A": current.opciones[0]?.toUpperCase(),
      "B": current.opciones[1]?.toUpperCase(),
      "C": current.opciones[2]?.toUpperCase()
    };
    
    // Validamos si ingresó la Letra (A,B,C) o directamente la Palabra correcta
    let isCorrectLetter = ["A", "B", "C"].includes(resUser) && resUser === current.r;
    let isCorrectWord = resUser === opcionesMap[current.r];
    
    let isOptionOrWord = ["A", "B", "C"].includes(resUser) || Object.values(opcionesMap).includes(resUser);

    // Solo procesamos si el usuario envió algo que parezca una opción o si atinó de suerte
    if (isOptionOrWord) {
      if (isCorrectLetter || isCorrectWord) {
        clearTimeout(current.timer);
        delete global.db.data.trivia[m.chat];
        
        // Recompensa XP si existe economía
        let xpReward = Math.floor(Math.random() * 50) + 50; 
        if (global.db.data.users[m.sender]) {
            global.db.data.users[m.sender].exp = (global.db.data.users[m.sender].exp || 0) + xpReward;
        }

        try {
            await client.sendMessage(m.chat, { 
              text: `🎉 *¡CORRECTO!* 🎉\nHola @${m.sender.split('@')[0]},\n¡Le atinaste! Has ganado *+${xpReward} XP*.`,
              mentions: [m.sender]
            }, { quoted: m });
        } catch(e){}
        return true; 
      } else {
        // Falló. Lo agregamos a eliminados para esta ronda.
        current.eliminados.push(m.sender);
        try {
            await client.sendMessage(m.chat, { 
              text: `❌ @${m.sender.split('@')[0]} respuesta incorrecta. Quedas eliminado de esta ronda.`,
              mentions: [m.sender]
            }, { quoted: m });
        } catch(e){}
      }
    }
    return false;
  }
}
