global.juegos = global.juegos || new Map();

const normalize = (str) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

const bancoPreguntas = [
  { p: "¿Qué protocolo se utiliza para enviar correos electrónicos?", r: "smtp" },
  { p: "¿Qué significa HTML?", r: "hypertext markup language" },
  { p: "¿Cuál es el puerto predeterminado para HTTP?", r: "80" },
  { p: "¿Qué significa IP?", r: "internet protocol" },
  { p: "¿Qué dispositivo conecta diferentes redes entre sí?", r: "router" },
  { p: "¿Cuál es la unidad básica de información en informática?", r: "bit" },
  { p: "¿Qué protocolo se usa para la transferencia de archivos?", r: "ftp" },
  { p: "¿Qué componente es considerado el cerebro de la computadora?", r: "cpu" },
  { p: "¿Qué significa RAM?", r: "random access memory" },
  { p: "¿Qué lenguaje de programación es conocido por su logo de una taza de café?", r: "java" },
  { p: "¿Qué significa URL?", r: "uniform resource locator" },
  { p: "¿Qué protocolo proporciona seguridad a las comunicaciones por internet (HTTP seguro)?", r: "https" },
  { p: "¿Qué acrónimo se usa para referirse al sistema básico de entrada/salida de una PC?", r: "bios" },
  { p: "¿En qué sistema numérico se basan las computadoras?", r: "binario" },
  { p: "¿Qué tipo de malware se disfraza como software legítimo?", r: "troyano" },
  { p: "¿Qué comando en la terminal de Linux se usa para listar directorios?", r: "ls" },
  { p: "¿Qué lenguaje se usa principalmente para dar estilo a las páginas web?", r: "css" },
  { p: "¿Qué significa SSD?", r: "solid state drive" },
  { p: "¿Qué red social fue fundada por Mark Zuckerberg?", r: "facebook" },
  { p: "¿Cómo se llama el proceso de encontrar y corregir errores en el código?", r: "debugging" },
  { p: "¿Qué sistema operativo móvil es desarrollado por Google?", r: "android" },
  { p: "¿Qué significa LAN?", r: "local area network" },
  { p: "¿Qué tecnología permite la conexión inalámbrica de dispositivos a corta distancia?", r: "bluetooth" },
  { p: "¿Qué lenguaje es considerado el estándar para bases de datos relacionales?", r: "sql" },
  { p: "¿Cómo se le llama a un conjunto de 8 bits?", r: "byte" },
  { p: "¿Quién es considerado el padre de la computación?", r: "alan turing" },
  { p: "¿Qué lenguaje se ejecuta principalmente en el navegador web?", r: "javascript" },
  { p: "¿Qué comando de Git se usa para enviar cambios al repositorio remoto?", r: "push" },
  { p: "¿Qué significa API?", r: "application programming interface" },
  { p: "¿Qué compañía desarrolló el sistema operativo Windows?", r: "microsoft" },
  { p: "¿Qué significa Wi-Fi?", r: "wireless fidelity" },
  { p: "¿Cuál es el sistema operativo de código abierto más popular?", r: "linux" },
  { p: "¿Qué lenguaje de programación fue creado por Guido van Rossum?", r: "python" },
  { p: "¿Qué herramienta se usa para el control de versiones de código?", r: "git" },
  { p: "¿Qué etiqueta HTML se usa para insertar una imagen?", r: "img" },
  { p: "¿Cuál es el puerto por defecto para el protocolo SSH?", r: "22" },
  { p: "¿Qué significa DNS?", r: "domain name system" },
  { p: "¿Qué tecnología de virtualización de contenedores es simbolizada por una ballena?", r: "docker" },
  // Nuevas preguntas agregadas
  { p: "¿Qué lenguaje de programación fue diseñado por Apple?", r: "swift" },
  { p: "¿Qué significa PDF?", r: "portable document format" },
  { p: "¿Cuál es el motor de búsqueda más utilizado en el mundo?", r: "google" },
  { p: "¿Qué componente de hardware es responsable de procesar los gráficos?", r: "gpu" },
  { p: "¿Qué significa USB?", r: "universal serial bus" },
  { p: "¿Qué lenguaje se usa para estructurar el contenido de una web?", r: "html" },
  { p: "¿Qué significa AI?", r: "artificial intelligence" },
  { p: "¿Cómo se llama la primera programadora de la historia?", r: "ada lovelace" },
  { p: "¿Qué significa CMS (ej. WordPress)?", r: "content management system" },
  { p: "¿Cuál es el puerto por defecto para MySQL?", r: "3306" },
  { p: "¿Qué significa JSON?", r: "javascript object notation" },
  { p: "¿Qué empresa creó el lenguaje Java?", r: "sun microsystems" }
];

export default {
  command: ['trivia', 'triviatic'],
  category: 'juegos',
  desc: 'Juega una trivia centrada en el área de TICs (Tecnología y Computación).',
  cooldown: 5,
  
  run: async (client, m, args, usedPrefix, command) => {
    if (global.juegos.has(m.chat + '_trivia')) {
      return m.reply(' Ya hay una trivia activa en este chat. ¡Responde la pregunta actual!');
    }

    let apuesta = 200; // Apuesta base
    if (args[0] && !isNaN(args[0])) {
      apuesta = parseInt(args[0]);
      if (apuesta < 10) return m.reply('❌ La apuesta mínima es de 10 XP.');
      if (apuesta > global.db.data.users[m.sender].exp) {
        return m.reply('❌ No tienes suficiente XP para esa apuesta.');
      }
      global.db.data.users[m.sender].exp -= apuesta; // Restar apuesta inicial
    }

    try {
      const q = bancoPreguntas[Math.floor(Math.random() * bancoPreguntas.length)];
      
      const timeout = 45000; // 45 segundos
      const id = setTimeout(async () => {
        if (global.juegos.has(m.chat + '_trivia')) {
          global.juegos.delete(m.chat + '_trivia');
          await client.sendMessage(m.chat, { text: `┌───「 ⏳ *TIEMPO AGOTADO* ⏳ 」───┐\n│ Nadie respondió a tiempo.\n│ La respuesta correcta era: *${q.r}*\n└──────────────────────────┘` });
        }
      }, timeout);

      global.juegos.set(m.chat + '_trivia', {
        type: 'trivia',
        answer: q.r,
        timeoutId: id,
        sender: m.sender,
        apuesta: apuesta
      });

      const txt = `┌───「 🧠 *TRIVIA TICS* 🧠 」───┐\n│ *Pregunta:* ${q.p}\n│ 💰 *Apuesta:* ${apuesta} XP\n│ ⏳ Tienes *45 segundos* para responder.\n└────────────────────────┘`;
      await client.sendMessage(m.chat, { text: txt });

    } catch (err) {
      m.reply(` Hubo un error al iniciar la trivia.`);
    }
  },
};

export const before = async (client, m) => {
  if (!m.text || !global.juegos.has(m.chat + '_trivia')) return;
  const juego = global.juegos.get(m.chat + '_trivia');
  if (juego.type === 'trivia') {
    const respuestaUsuario = normalize(m.text);
    const respuestaCorrecta = normalize(juego.answer);
    
    const acierto = (respuestaUsuario === respuestaCorrecta || 
                   (respuestaCorrecta.length >= 4 && respuestaUsuario.includes(respuestaCorrecta)) ||
                   (respuestaUsuario.length >= 4 && respuestaCorrecta.includes(respuestaUsuario)));

    if (acierto) {
      clearTimeout(juego.timeoutId);
      global.juegos.delete(m.chat + '_trivia');
      
      const ganancia = juego.apuesta * 2;
      global.db.data.users[m.sender].exp = (global.db.data.users[m.sender].exp || 0) + ganancia;
      global.db.data.users[m.sender].gameWins = (global.db.data.users[m.sender].gameWins || 0) + 1;
      
      await client.sendMessage(m.chat, { 
        text: `┌───「 🎉 *¡CORRECTO!* 🎉 」───┐\n│ ¡Felicidades @${m.sender.split('@')[0]}!\n│ La respuesta era: *${juego.answer}*\n│ 💰 Ganaste *${ganancia} XP*\n└───────────────────────┘`, 
        mentions: [m.sender] 
      }, { quoted: m });
      return true;
    }
  }
};
