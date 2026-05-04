import { pickRandom, getBotCurrency } from '../../utils/tools.js';

export default {
  command: ['w', 'work', 'chambear', 'chamba', 'trabajar'],
  category: 'economia',
  desc: 'Trabajar por coins.',
  economy: true,
  cooldown: 3,
  run: async (client, m, args, usedPrefix, command) => {
    const user = global.db.data.users[m.sender]
    const monedas = getBotCurrency(client)
    const cooldown = 3 * 60 * 1000
    user.lastwork = user.lastwork || 0
    if (Date.now() < user.lastwork) {
      const s = Math.ceil((user.lastwork - Date.now()) / 1000), min = Math.floor(s / 60), sec = s % 60
      return m.reply(`Debes esperar *${min > 0 ? min + ' minuto' + (min > 1 ? 's' : '') + ' ' : ''}${sec} segundo${sec !== 1 ? 's' : ''}* para usar *${usedPrefix + command}* de nuevo.`)
    }
    user.lastwork = Date.now() + cooldown
    const rsl = Math.floor(Math.random() * (4000 - 2000 + 1)) + 2000
    user.coins = (user.coins || 0) + rsl
    await client.sendMessage(m.chat, { text: `${pickRandom(trabajo)} *¥${rsl.toLocaleString()} ${monedas}*.` }, { quoted: m })
  }
}

const trabajo = [
  "Trabajas como recolector de fresas y ganas",
  "Eres asistente en un taller de cerámica y obtienes",
  "Diseñas páginas web y ganas",
  "Eres fotógrafo de bodas y recibes",
  "Trabajas en una tienda de mascotas y ganas",
  "Eres narrador de audiolibros y obtienes",
  "Trabajas como jardinero en un parque y recibes",
  "Eres un DJ en fiestas y ganas",
  "Hiciste un mural en una cafetería y te dieron",
  "Trabajas como diseñador de interiores y ganas",
  "Eres un conductor de autobús turístico y obtienes",
  "Preparas sushi en un restaurante y ganas",
  "Trabajas como asistente de investigación y recibes",
  "Eres especialista en marketing de contenidos y ganas",
  "Trabajas en una granja orgánica y obtienes",
  "Eres un bailarín en un espectáculo y ganas",
  "Organizas ferias de arte y recibes",
  "Eres un escritor freelance y ganas",
  "Hiciste un diseño gráfico para una campaña y te pagaron",
  "Trabajas como mecánico de automóviles y ganas",
  "Eres un instructor de surf y recibes",
  "Limpias casas como servicio de limpieza y ganas",
  "Eres un técnico de sonido en conciertos y obtienes",
  "Trabajas como desarrollador de aplicaciones y ganas",
  "Eres un croupier en un casino y recibes",
  "Trabajas como estilista de cabello y ganas",
  "Eres un restaurador de arte y obtienes",
  "Trabajas en una librería y ganas",
  "Eres un guía de montañismo y recibes",
  "Llevas un blog de viajes y ganas",
  "Hiciste una campaña de crowdfunding y obtuviste",
  "Trabajas como asistente social y ganas",
  "Eres un conductor de camión de carga y recibes",
  "Trabajas en un equipo de rescate y ganas",
  "Eres un consultor de negocios y obtienes",
  "Realizas catas de vino y ganas",
  "Trabajas como barista en una cafetería y recibes",
  "Eres un entrenador de mascotas y ganas",
  "Hiciste un documental para una ONG y recibiste",
  "Eres un operador de drones y ganas",
  "Trabajas en una productora de cine y obtienes",
  "Eres un investigador de mercados y ganas",
  "Trabajas como repartidor de comida y recibes",
  "Hiciste un diseño de joyas y obtuviste",
  "Trabajas como especialista en atención al cliente y ganas",
  "Eres un conservador de museos y recibes",
  "Eres un creador de contenido en redes sociales y ganas",
  "Hiciste un workshop de manualidades y recibiste"
];
