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
  { p: "¿Qué atajo de teclado se usa comúnmente para copiar texto (en español/inglés)?", r: "ctrl c" },
  { p: "¿Qué tecnología permite la conexión inalámbrica de dispositivos a corta distancia?", r: "bluetooth" },
  { p: "¿Qué parte del hardware almacena los datos de forma permanente?", r: "disco duro" },
  { p: "¿Qué significa VPN?", r: "virtual private network" },
  { p: "¿Qué lenguaje es considerado el estándar para bases de datos relacionales?", r: "sql" },
  { p: "¿Cómo se le llama a un conjunto de 8 bits?", r: "byte" },
  { p: "¿Quién es considerado el padre de la computación?", r: "alan turing" },
  { p: "¿Qué estructura de datos opera bajo el principio LIFO (Último en entrar, primero en salir)?", r: "pila" },
  { p: "¿Qué estructura de datos opera bajo el principio FIFO?", r: "cola" },
  { p: "¿Qué lenguaje se ejecuta principalmente en el navegador web?", r: "javascript" },
  { p: "¿Qué comando de Git se usa para enviar cambios al repositorio remoto?", r: "push" },
  { p: "¿Qué significa API?", r: "application programming interface" },
  { p: "¿Qué compañía desarrolló el sistema operativo Windows?", r: "microsoft" },
  { p: "¿Cómo se llama el programa que traduce código fuente a código máquina?", r: "compilador" },
  { p: "¿Qué significa Wi-Fi?", r: "wireless fidelity" },
  { p: "¿Qué protocolo se utiliza para asignar direcciones IP automáticamente?", r: "dhcp" },
  { p: "¿Cuál es el sistema operativo de código abierto más popular?", r: "linux" },
  { p: "¿Qué lenguaje de programación fue creado por Guido van Rossum?", r: "python" },
  { p: "¿Qué tipo de memoria es volátil y pierde sus datos al apagarse el equipo?", r: "ram" },
  { p: "¿Qué herramienta se usa para el control de versiones de código?", r: "git" },
  { p: "¿Qué etiqueta HTML se usa para insertar una imagen?", r: "img" },
  { p: "¿Cómo se le llama al software que pide rescate por los datos secuestrados?", r: "ransomware" },
  { p: "¿Qué significa IoT?", r: "internet of things" },
  { p: "¿Cuál es el puerto por defecto para el protocolo SSH?", r: "22" },
  { p: "¿Qué dispositivo convierte señales digitales en analógicas y viceversa?", r: "modem" },
  { p: "¿Qué significa DNS?", r: "domain name system" },
  { p: "¿Cuál es la extensión de un archivo comprimido estándar en Windows?", r: "zip" },
  { p: "¿Qué tecnología de virtualización de contenedores es simbolizada por una ballena?", r: "docker" }
];

export default {
  command: ['trivia', 'triviatic'],
  category: 'juegos',
  desc: 'Juega una trivia centrada en el área de TICs (Tecnología y Computación).',
  cooldown: 5,
  
  run: async (client, m) => {
    if (global.juegos.has(m.chat)) {
      return m.reply('《✧》 Ya hay un juego activo en este chat. ¡Responde la pregunta actual!');
    }

    try {
      const q = bancoPreguntas[Math.floor(Math.random() * bancoPreguntas.length)];
      
      const timeout = 30000; // 30 segundos
      const id = setTimeout(async () => {
        if (global.juegos.has(m.chat)) {
          global.juegos.delete(m.chat);
          await client.sendMessage(m.chat, { text: `┌───「 ⏳ *TIEMPO AGOTADO* ⏳ 」───┐\n│ ❖ Nadie respondió a tiempo.\n│ ❖ La respuesta correcta era: *${q.r}*\n└──────────────────────────┘` });
        }
      }, timeout);

      global.juegos.set(m.chat, {
        type: 'trivia',
        answer: q.r,
        timeoutId: id,
        sender: m.sender
      });

      const txt = `┌───「 🧠 *TRIVIA TICS* 🧠 」───┐\n│ ❖ *Pregunta:* ${q.p}\n│ ⏳ Tienes *30 segundos* para responder.\n└────────────────────────┘`;
      await client.sendMessage(m.chat, { text: txt });

    } catch (err) {
      m.reply(`《✧》 Hubo un error al iniciar la trivia.`);
    }
  },


};

export const before = async (client, m) => {
  if (!m.text || !global.juegos.has(m.chat)) return;
  const juego = global.juegos.get(m.chat);
  if (juego.type === 'trivia') {
    const respuestaUsuario = normalize(m.text);
    const respuestaCorrecta = normalize(juego.answer);
    if (respuestaUsuario === respuestaCorrecta || (respuestaUsuario.length >= 4 && respuestaUsuario.includes(respuestaCorrecta))) {
      clearTimeout(juego.timeoutId);
      global.juegos.delete(m.chat);
      // reward 100 XP
      global.db.data.users[m.sender].exp = (global.db.data.users[m.sender].exp || 0) + 100;
      await client.sendMessage(m.chat, { text: `┌───「 🎉 *¡CORRECTO!* 🎉 」───┐\n│ ❖ ¡Felicidades @${m.sender.split('@')[0]}!\n│ ❖ La respuesta era: *${juego.answer}*\n└───────────────────────┘`, mentions: [m.sender] }, { quoted: m });
      return true;
    }
  }
};
