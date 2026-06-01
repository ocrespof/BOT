/**
 * 💼 rpg_jobs.js — Todos los comandos de trabajo/ingresos RPG consolidados.
 * Incluye: work, daily, weekly, monthly, crime, slut, mine, hunt, fish, steal, math
 */
import { pickRandom, formatTime, getBotCurrency, getBotId } from '../../utils/tools.js';
import { resolveLidToRealJid } from '../../core/utils.js';

// ── Datos de trabajo ──
const trabajoMsgs = [
  "Trabajas como recolector de fresas y ganas", "Eres asistente en un taller de cerámica y obtienes",
  "Diseñas páginas web y ganas", "Eres fotógrafo de bodas y recibes",
  "Trabajas en una tienda de mascotas y ganas", "Eres narrador de audiolibros y obtienes",
  "Trabajas como jardinero en un parque y recibes", "Eres un DJ en fiestas y ganas",
  "Hiciste un mural en una cafetería y te dieron", "Trabajas como diseñador de interiores y ganas",
  "Eres un conductor de autobús turístico y obtienes", "Preparas sushi en un restaurante y ganas",
  "Trabajas como asistente de investigación y recibes", "Eres especialista en marketing de contenidos y ganas",
  "Trabajas en una granja orgánica y obtienes", "Eres un bailarín en un espectáculo y ganas",
  "Organizas ferias de arte y recibes", "Eres un escritor freelance y ganas",
  "Hiciste un diseño gráfico para una campaña y te pagaron", "Trabajas como mecánico de automóviles y ganas",
  "Eres un instructor de surf y recibes", "Limpias casas como servicio de limpieza y ganas",
  "Eres un técnico de sonido en conciertos y obtienes", "Trabajas como desarrollador de aplicaciones y ganas",
  "Eres un croupier en un casino y recibes", "Trabajas como estilista de cabello y ganas",
  "Eres un restaurador de arte y obtienes", "Trabajas en una librería y ganas",
  "Eres un guía de montañismo y recibes", "Llevas un blog de viajes y ganas",
  "Hiciste una campaña de crowdfunding y obtuviste", "Trabajas como asistente social y ganas",
  "Eres un conductor de camión de carga y recibes", "Trabajas en un equipo de rescate y ganas",
  "Eres un consultor de negocios y obtienes", "Realizas catas de vino y ganas",
  "Trabajas como barista en una cafetería y recibes", "Eres un entrenador de mascotas y ganas",
  "Hiciste un documental para una ONG y recibiste", "Eres un operador de drones y ganas",
  "Trabajas en una productora de cine y obtienes", "Eres un investigador de mercados y ganas",
  "Trabajas como repartidor de comida y recibes", "Hiciste un diseño de joyas y obtuviste",
  "Trabajas como especialista en atención al cliente y ganas", "Eres un conservador de museos y recibes",
  "Eres un creador de contenido en redes sociales y ganas", "Hiciste un workshop de manualidades y recibiste"
];

// ── Datos de minería ──
const escenariosMine = [
  'una cueva oscura y húmeda', 'la cima de una montaña nevada',
  'un bosque misterioso lleno de raíces', 'un río cristalino y caudaloso',
  'una mina abandonada de carbón', 'las ruinas de un antiguo castillo',
  'una playa desierta con arena dorada', 'un valle escondido entre colinas',
  'un arbusto espinoso al borde del camino', 'un tronco hueco en medio del bosque',
];
const mineriaTextos = [
  'encontraste un antiguo cofre con', 'hallaste una bolsa llena de',
  'descubriste un saco de', 'desenterraste monedas antiguas que contienen',
  'rompiste una roca y adentro estaba', 'cavando profundo, hallaste',
  'entre las raíces, encontraste', 'dentro de una caja olvidada, hallaste',
  'bajo unas piedras, descubriste', 'entre los escombros de un lugar viejo, encontraste',
];

// ── Helper para quitar fondos (coins + bank) ──
function deductFunds(user, amount) {
  const total = (user.coins || 0) + (user.bank || 0);
  if (total < amount) { const lost = total; user.coins = 0; user.bank = 0; return lost; }
  if (user.coins >= amount) { user.coins -= amount; } else { const r = amount - user.coins; user.coins = 0; user.bank -= r; }
  return amount;
}

// ── Math game globals ──
global.math = global.math || {};
const mathLimits = { facil: 10, medio: 50, dificil: 90, imposible: 100, imposible2: 160 };
const mathRewards = { facil: [500, 1000], medio: [1000, 2000], dificil: [2000, 3500], imposible: [3500, 4800], imposible2: [5000, 6500] };
const genMathProblem = (diff) => {
  const max = mathLimits[diff] || 30;
  const n1 = Math.floor(Math.random() * max) + 1, n2 = Math.floor(Math.random() * max) + 1;
  const op = ['+', '-', '*', '/'][Math.floor(Math.random() * 4)];
  const resultado = eval(`${n1} ${op} ${n2}`);
  const sym = op === '*' ? '×' : op === '/' ? '÷' : op;
  return { problema: `${n1} ${sym} ${n2}`, resultado };
};

// ══════════════════════ COMANDOS ══════════════════════

const cmdWork = {
  command: ['w', 'work', 'chambear', 'chamba', 'trabajar'],
  category: 'economia', desc: 'Trabajar por coins.', economy: true, cooldown: 3,
  run: async (client, m) => {
    const user = global.db.data.users[m.sender];
    const monedas = getBotCurrency(client);
    const cooldown = 3 * 60 * 1000;
    user.lastwork = user.lastwork || 0;
    if (Date.now() < user.lastwork) return m.reply(`Debes esperar *${formatTime(user.lastwork - Date.now())}* para usar este comando de nuevo.`);
    user.lastwork = Date.now() + cooldown;
    let rsl = Math.floor(Math.random() * (4000 - 2000 + 1)) + 2000;
    if (user.title === 'title_legend') rsl = Math.floor(rsl * 1.15);
    if (user.fortuneBuff?.expiresAt > Date.now()) rsl = Math.floor(rsl * (1 + user.fortuneBuff.value));
    user.coins = (user.coins || 0) + rsl;
    await client.sendMessage(m.chat, { text: `${pickRandom(trabajoMsgs)} *¥${rsl.toLocaleString()} ${monedas}*.` }, { quoted: m });
  }
};

const cmdDaily = {
  command: ['daily', 'diario'],
  category: 'economia', desc: 'Recompensa diaria.', economy: true,
  run: async (client, m) => {
    const monedas = getBotCurrency(client);
    const user = global.db.data.users[m.sender];
    const now = Date.now(), oneDay = 86400000, maxStreak = 200;
    user.streak ??= 0; user.lastDailyGlobal ??= 0; user.coins ??= 0; user.lastdaily ??= 0;
    if (now < user.lastdaily) {
      if (user.extraDaily) { user.extraDaily = false; }
      else return m.reply(`Ya has reclamado tu *Daily* de hoy.\nPuedes reclamarlo de nuevo en *${formatTime(user.lastdaily - now)}*`);
    }
    const lost = user.streak >= 1 && now - user.lastDailyGlobal > oneDay * 1.5;
    if (lost) user.streak = 0;
    if (now - user.lastDailyGlobal >= oneDay) { user.streak = Math.min(user.streak + 1, maxStreak); user.lastDailyGlobal = now; }
    let recompensa = Math.min(20000 + (user.streak - 1) * 5000, 1015000);
    if (user.title === 'title_tycoon') recompensa = Math.floor(recompensa * 1.20);
    if (user.fortuneBuff?.expiresAt > now) recompensa = Math.floor(recompensa * (1 + user.fortuneBuff.value));
    user.coins += recompensa; user.lastdaily = now + oneDay;
    const siguiente = Math.min(20000 + user.streak * 5000, 1015000).toLocaleString();
    let msg = `> Día *${user.streak + 1}* *+¥${siguiente}*`;
    if (lost) msg += `\n☆ ¡Has perdido tu racha de días!`;
    await m.reply(`「✿」Has reclamado tu recompensa diaria de *¥${recompensa.toLocaleString()} ${monedas}*! (Día *${user.streak}*)\n${msg}`);
  }
};

const cmdWeekly = {
  command: ['weekly', 'semanal'],
  category: 'economia', desc: 'Recompensa semanal.', economy: true,
  run: async (client, m) => {
    const monedas = getBotCurrency(client);
    const user = global.db.data.users[m.sender];
    const gap = 604800000, now = Date.now();
    user.weeklyStreak ??= 0; user.lastWeeklyGlobal ??= 0; user.coins ??= 0; user.lastweekly ??= 0;
    if (now < user.lastweekly) return m.reply(`Ya has reclamado tu recompensa semanal.\nPuedes reclamarlo de nuevo en *${formatTime(user.lastweekly - now)}*`);
    const lost = user.weeklyStreak >= 1 && now - user.lastWeeklyGlobal > gap * 1.5;
    if (lost) user.weeklyStreak = 0;
    if (now - user.lastWeeklyGlobal >= gap) { user.weeklyStreak = Math.min(user.weeklyStreak + 1, 30); user.lastWeeklyGlobal = now; }
    let coins = Math.min(40000 + (user.weeklyStreak - 1) * 5000, 185000);
    if (user.title === 'title_tycoon') coins = Math.floor(coins * 1.20);
    user.coins += coins; user.lastweekly = now + gap;
    let nextReward = Math.min(40000 + user.weeklyStreak * 5000, 185000).toLocaleString();
    let msg = `> Semana *${user.weeklyStreak + 1}* *+¥${nextReward}*`;
    if (lost) msg += `\n☆ ¡Has perdido tu racha de semanas!`;
    await m.reply(`「❁」 Has reclamado tu recompensa semanal de *¥${coins.toLocaleString()} ${monedas}* (Semana *${user.weeklyStreak}*)\n${msg}`);
  }
};

const cmdMonthly = {
  command: ['monthly', 'mensual'],
  category: 'economia', desc: 'Recompensa mensual.', economy: true,
  run: async (client, m) => {
    const monedas = getBotCurrency(client);
    const user = global.db.data.users[m.sender];
    const gap = 2592000000, now = Date.now();
    user.monthlyStreak ??= 0; user.lastMonthlyGlobal ??= 0; user.coins ??= 0; user.lastmonthly ??= 0;
    if (now < user.lastmonthly) return m.reply(`Ya has reclamado tu recompensa mensual.\nPuedes reclamarlo de nuevo en *${formatTime(user.lastmonthly - now)}*`);
    const lost = user.monthlyStreak >= 1 && now - user.lastMonthlyGlobal > gap * 1.5;
    if (lost) user.monthlyStreak = 0;
    if (now - user.lastMonthlyGlobal >= gap) { user.monthlyStreak = Math.min(user.monthlyStreak + 1, 8); user.lastMonthlyGlobal = now; }
    let coins = Math.min(60000 + (user.monthlyStreak - 1) * 5000, 95000);
    if (user.title === 'title_tycoon') coins = Math.floor(coins * 1.20);
    user.coins += coins; user.lastmonthly = now + gap;
    let next = Math.min(60000 + user.monthlyStreak * 5000, 95000).toLocaleString();
    let msg = `> Mes *${user.monthlyStreak + 1}* *+${next}*`;
    if (lost) msg += `\n☆ ¡Has perdido tu racha de meses!`;
    await m.reply(`「❁」 Has reclamado tu recompensa mensual de *+${coins.toLocaleString()} ${monedas}* (Mes *${user.monthlyStreak}*)\n${msg}`);
  }
};

const cmdCrime = {
  command: ['crime', 'crimen'],
  category: 'economia', desc: 'Cometer un crimen.', economy: true,
  run: async (client, m) => {
    const user = global.db.data.users[m.sender];
    const monedas = getBotCurrency(client);
    user.lastcrime ??= 0;
    const remaining = user.lastcrime - Date.now();
    if (remaining > 0) return m.reply(`Debes esperar *${formatTime(remaining)}* antes de intentar nuevamente.`);
    let baseChance = 0.4;
    if (user.title === 'title_lucky') baseChance += 0.15;
    if (user.luckBuff?.expiresAt > Date.now()) baseChance += user.luckBuff.value;
    const éxito = Math.random() < baseChance;
    let cantidad;
    if (éxito) {
      cantidad = Math.floor(Math.random() * (7500 - 5500 + 1)) + 5500;
      if (user.fortuneBuff?.expiresAt > Date.now()) cantidad = Math.floor(cantidad * (1 + user.fortuneBuff.value));
      user.coins = (user.coins || 0) + cantidad;
    } else {
      cantidad = Math.floor(Math.random() * (6000 - 4000 + 1)) + 4000;
      deductFunds(user, cantidad);
    }
    user.lastcrime = Date.now() + 7 * 60 * 1000;
    const sM = [
      `Hackeaste un cajero automático y retiraste efectivo, ganaste *¥${cantidad.toLocaleString()} ${monedas}*!`,
      `Te infiltraste en una mansión y robaste joyas, ganaste *¥${cantidad.toLocaleString()} ${monedas}*!`,
      `Simulaste una transferencia bancaria falsa, ganaste *¥${cantidad.toLocaleString()} ${monedas}*!`,
      `Interceptaste un paquete de lujo y lo revendiste, ganaste *¥${cantidad.toLocaleString()} ${monedas}*!`,
      `Vaciaste una cartera olvidada en un restaurante, ganaste *¥${cantidad.toLocaleString()} ${monedas}*!`,
    ];
    const fM = [
      `Intentaste vender un reloj falso y te denunciaron, perdiste *¥${cantidad.toLocaleString()} ${monedas}*.`,
      `Hackeaste una cuenta pero olvidaste ocultar tu IP, perdiste *¥${cantidad.toLocaleString()} ${monedas}*.`,
      `Robaste una mochila pero una cámara capturó todo, perdiste *¥${cantidad.toLocaleString()} ${monedas}*.`,
      `El sistema silencioso activó la alarma, perdiste *¥${cantidad.toLocaleString()} ${monedas}*.`,
      `El guardia nocturno te descubrió, perdiste *¥${cantidad.toLocaleString()} ${monedas}*.`,
    ];
    await client.sendMessage(m.chat, { text: `「✿」 ${éxito ? pickRandom(sM) : pickRandom(fM)}` }, { quoted: m });
  }
};

const cmdSlut = {
  command: ['slut', 'prostituirse'],
  category: 'economia', desc: 'Trabajo arriesgado.', economy: true,
  run: async (client, m) => {
    const currency = getBotCurrency(client);
    const user = global.db.data.users[m.sender];
    const cooldown = 5 * 60 * 1000, now = Date.now();
    const remaining = (user.lastslut || 0) - now;
    if (remaining > 0) { const s = Math.ceil(remaining / 1000), min = Math.floor(s / 60), sec = s % 60; return m.reply(`✿ Debes esperar *${min > 0 ? min + ' minuto' + (min > 1 ? 's' : '') + ' ' : ''}${sec} segundo${sec !== 1 ? 's' : ''}* antes de intentar nuevamente.`); }
    const success = Math.random() < 0.5;
    const amount = success ? Math.floor(Math.random() * (6000 - 3500 + 1)) + 3500 : Math.floor(Math.random() * (4000 - 2000 + 1)) + 2000;
    user.lastslut = now + cooldown;
    const winM = [
      `Le acaricias el pene a un cliente habitual y ganaste *¥${amount.toLocaleString()} ${currency}*!`,
      `El admin se viene en tu boca, ganaste *¥${amount.toLocaleString()} ${currency}*!`,
      `El admin te manosea las tetas, ganaste *¥${amount.toLocaleString()} ${currency}*!`,
      `Te vistieron de neko kwai en publico, ganaste *¥${amount.toLocaleString()} ${currency}*!`,
      `Te haces la Loli del admin por un día, ganaste *¥${amount.toLocaleString()} ${currency}*!`,
      `Te dejas manosear por un extraño por dinero, ganaste *¥${amount.toLocaleString()} ${currency}*!`,
      `Eres la maid del admin por un día, ganaste *¥${amount.toLocaleString()} ${currency}*!`,
      `Un gay te paga para que lo hagas con el, ganaste *¥${amount.toLocaleString()} ${currency}*!`,
      `Tu SuggarMommy muere, ganaste *¥${amount.toLocaleString()} ${currency}*!`,
      `Tu SuggarDaddy muere, ganaste *¥${amount.toLocaleString()} ${currency}*!`,
      `Dejaste que un extraño te toque el culo por dinero, ganaste *¥${amount.toLocaleString()} ${currency}*!`,
      `Alguien te pone una correa y eres su mascota sexual por una hora, ganaste *¥${amount.toLocaleString()} ${currency}*!`,
      `Te vistieron de colegiala en público, ganaste *¥${amount.toLocaleString()} ${currency}*!`,
      `Te vistieron de una milf en público, ganaste *¥${amount.toLocaleString()} ${currency}*!`,
      `Los integrantes del grupo te usaron como saco de cum, ganaste *¥${amount.toLocaleString()} ${currency}*!`,
      `Eres la perra de los admins por un día, ganaste *¥${amount.toLocaleString()} ${currency}*!`,
      `Unos Aliens te secuestraron y te usaron cómo objeto sexual, ganaste *¥${amount.toLocaleString()} ${currency}*!`,
      `Un enano se culio tu pierna, ganaste *¥${amount.toLocaleString()} ${currency}*!`,
    ];
    const loseM = [
      `Tu energía se fue y no brillaste, perdiendo *¥${amount.toLocaleString()} ${currency}*.`,
      `Cometiste un error en tu actuación y perdiste *¥${amount.toLocaleString()} ${currency}*.`,
      `Un cliente malhumorado te causó problemas y perdiste *¥${amount.toLocaleString()} ${currency}*.`,
      `Tu atuendo no fue bien recibido y perdiste *¥${amount.toLocaleString()} ${currency}*.`,
      `El sonido falló en medio de tu actuación y perdiste *¥${amount.toLocaleString()} ${currency}*.`,
      `Un mal día en el club resultó en una pérdida de *¥${amount.toLocaleString()} ${currency}*.`,
      `Intentaste cobrarle al cliente equivocado, perdiste *¥${amount.toLocaleString()} ${currency}*.`,
      `El admin te bloqueó después del servicio, perdiste *¥${amount.toLocaleString()} ${currency}*.`,
      `Te disfrazaste sin que nadie te pagara, perdiste *¥${amount.toLocaleString()} ${currency}*.`,
    ];
    const message = success ? pickRandom(winM) : pickRandom(loseM);
    if (success) { user.coins = (user.coins || 0) + amount; } else { deductFunds(user, amount); }
    await client.sendMessage(m.chat, { text: `「✿」 ${message}`, mentions: [m.sender] }, { quoted: m });
  }
};

const cmdMine = {
  command: ['mine', 'minar'],
  category: 'economia', desc: 'Minar recursos.', economy: true,
  run: async (client, m, args, usedPrefix) => {
    const monedas = getBotCurrency(client);
    const user = global.db.data.users[m.sender];
    if ((user.health || 0) < 5) return m.reply(`No tienes suficiente salud para volver a *minar*.\nUsa *"${usedPrefix}heal"* para curarte.`);
    const remaining = (user.lastmine || 0) - Date.now();
    if (remaining > 0) return m.reply(`Debes esperar *${formatTime(remaining)}* para minar de nuevo.`);
    user.lastmine = Date.now() + 10 * 60 * 1000;
    let isLegendary = Math.random() < 0.02;
    let reward, narration, bonusMsg = '';
    if (isLegendary) {
      reward = Math.floor(Math.random() * (13000 - 11000 + 1)) + 11000;
      narration = '¡DESCUBRISTE UN TESORO LEGENDARIO!\n\n'; bonusMsg = '\nRecompensa ÉPICA obtenida!';
    } else {
      reward = Math.floor(Math.random() * (9500 - 7000 + 1)) + 7000;
      narration = `En ${pickRandom(escenariosMine)}, ${pickRandom(mineriaTextos)}`;
      if (Math.random() < 0.1) { const bonus = Math.floor(Math.random() * (4500 - 2500 + 1)) + 2500; reward += bonus; bonusMsg = `\n「✿」 ¡Bonus de minería! Ganaste *${bonus.toLocaleString()}* ${monedas} extra`; }
    }
    if (user.title === 'title_miner') reward = Math.floor(reward * 1.20);
    user.coins = (user.coins || 0) + reward;
    const salud = Math.floor(Math.random() * (15 - 5 + 1)) + 5;
    user.health = (user.health || 100) - salud; if (user.health < 0) user.health = 0;
    let msg = `「✿」 ${narration} *${reward.toLocaleString()} ${monedas}*`;
    if (bonusMsg) msg += `\n${bonusMsg}`;
    await client.reply(m.chat, msg, m);
  }
};

const cmdHunt = {
  command: ['cazar', 'hunt'],
  category: 'economia', desc: 'Cazar animales.', economy: true,
  run: async (client, m, args, usedPrefix) => {
    const user = global.db.data.users[m.sender];
    const currency = getBotCurrency(client);
    user.lasthunt ??= 0; user.coins ??= 0; user.health ??= 100;
    if (user.health < 5) return m.reply(`No tienes suficiente salud para volver a *cazar*.\nUsa *"${usedPrefix}heal"* para curarte.`);
    if (Date.now() < user.lasthunt) return m.reply(`Debes esperar *${formatTime(user.lasthunt - Date.now())}* antes de volver a cazar.`);
    const rand = Math.random();
    let cantidad = 0, salud = Math.floor(Math.random() * (15 - 10 + 1)) + 10, message;
    if (rand < 0.4) {
      cantidad = Math.floor(Math.random() * (13000 - 10000 + 1)) + 10000; user.coins += cantidad; user.health -= salud;
      message = pickRandom([
        `¡Con gran valentía, lograste cazar un Oso! Ganaste *¥${cantidad.toLocaleString()} ${currency}*.`,
        `¡Has cazado un Tigre feroz! Ganaste *¥${cantidad.toLocaleString()} ${currency}*.`,
        `Lograste cazar un Elefante con astucia, ganaste *¥${cantidad.toLocaleString()} ${currency}*.`,
        `¡Has cazado un Panda! Ganaste *¥${cantidad.toLocaleString()} ${currency}*.`,
        `Cazaste un Jabalí tras un rastreo emocionante, ganaste *¥${cantidad.toLocaleString()} ${currency}*.`,
        `Con gran destreza, atrapaste un Cocodrilo, ganaste *¥${cantidad.toLocaleString()} ${currency}*.`,
        `¡Has cazado un Ciervo robusto! Ganaste *¥${cantidad.toLocaleString()} ${currency}*.`,
        `Con paciencia lograste cazar un Zorro plateado, ganaste *¥${cantidad.toLocaleString()} ${currency}*.`,
        `Localizaste peces en el río y atrapaste varios, ganaste *¥${cantidad.toLocaleString()} ${currency}*.`,
        `Te internaste en la niebla del bosque y cazaste un jabalí, ganaste *¥${cantidad.toLocaleString()} ${currency}*.`
      ]);
    } else if (rand < 0.7) {
      cantidad = Math.floor(Math.random() * (8000 - 6000 + 1)) + 6000;
      deductFunds(user, cantidad); user.health -= salud; if (user.health < 0) user.health = 0;
      message = pickRandom([
        `Tu presa se escapó y no lograste cazar nada, perdiste *¥${cantidad.toLocaleString()} ${currency}*.`,
        `Tropezaste mientras apuntabas y la presa huyó, perdiste *¥${cantidad.toLocaleString()} ${currency}*.`,
        `Un rugido te distrajo y no diste en el blanco, perdiste *¥${cantidad.toLocaleString()} ${currency}*.`,
        `Tu arco se rompió en el momento crucial, perdiste *¥${cantidad.toLocaleString()} ${currency}*.`,
        `Un aguacero arruinó tu ruta de caza, perdiste *¥${cantidad.toLocaleString()} ${currency}*.`,
        `Un jabalí te embistió y tuviste que huir, perdiste *¥${cantidad.toLocaleString()} ${currency}*.`,
        `Un tigre te sorprendió y escapaste con pérdidas, perdiste *¥${cantidad.toLocaleString()} ${currency}*.`
      ]);
    } else {
      message = pickRandom([
        `Pasaste la tarde cazando y observando cómo los animales se movían en silencio.`,
        `El bosque estuvo tranquilo y los animales se mostraron esquivos.`,
        `Tu jornada de caza fue serena, los animales se acercaban sin ser atrapados.`,
        `Los animales se mostraron cautelosos, pero la experiencia fue agradable.`,
        `Exploraste nuevas rutas de caza y descubriste huellas frescas.`
      ]);
    }
    user.lasthunt = Date.now() + 15 * 60 * 1000;
    await client.sendMessage(m.chat, { text: `「✿」 ${message}` }, { quoted: m });
  }
};

const cmdFish = {
  command: ['pescar', 'fish'],
  category: 'economia', desc: 'Pescar recursos.', economy: true,
  run: async (client, m) => {
    const user = global.db.data.users[m.sender];
    const currency = getBotCurrency(client);
    user.lastfish ??= 0;
    const remaining = user.lastfish - Date.now();
    if (remaining > 0) return m.reply(`Debes esperar *${formatTime(remaining)}* antes de volver a pescar.`);
    const rand = Math.random();
    let message;
    if (rand < 0.4) {
      let cantidad = Math.floor(Math.random() * (8000 - 6000 + 1)) + 6000;
      if (user.title === 'title_fisher') cantidad = Math.floor(cantidad * 1.20);
      user.coins = (user.coins || 0) + cantidad;
      let buffMessage = '';
      if (user.title === 'title_neko') { user.health = Math.min(100, (user.health || 100) + 10); buffMessage = '\n_(🐱 +10 Salud)_'; }
      message = pickRandom([
        `¡Has pescado un Salmón! Ganaste *¥${cantidad.toLocaleString()} ${currency}*!`,
        `¡Has pescado una Trucha! Ganaste *¥${cantidad.toLocaleString()} ${currency}*!`,
        `¡Has capturado un Tiburón! Ganaste *¥${cantidad.toLocaleString()} ${currency}*!`,
        `¡Has pescado una Ballena! Ganaste *¥${cantidad.toLocaleString()} ${currency}*!`,
        `¡Has capturado un Pez Payaso! Ganaste *¥${cantidad.toLocaleString()} ${currency}*!`,
        `¡Has atrapado una Anguila Dorada! Ganaste *¥${cantidad.toLocaleString()} ${currency}*!`,
        `¡Has pescado un Mero Gigante! Ganaste *¥${cantidad.toLocaleString()} ${currency}*!`,
        `¡Has capturado un Pulpo azul! Ganaste *¥${cantidad.toLocaleString()} ${currency}*!`,
        `¡Sacaste una Carpa Real! Ganaste *¥${cantidad.toLocaleString()} ${currency}*!`,
        `¡Has conseguido un Pez Dragón! Ganaste *¥${cantidad.toLocaleString()} ${currency}*!`
      ]) + buffMessage;
    } else if (rand < 0.7) {
      let cantidad = Math.floor(Math.random() * (6500 - 5000 + 1)) + 5000;
      deductFunds(user, cantidad);
      message = pickRandom([
        `El anzuelo se enredó y perdiste parte de tu equipo, perdiste *¥${cantidad.toLocaleString()} ${currency}*.`,
        `Una corriente fuerte arrastró tu caña, perdiste *¥${cantidad.toLocaleString()} ${currency}*.`,
        `Un pez grande rompió tu línea, perdiste *¥${cantidad.toLocaleString()} ${currency}*.`,
        `Tu bote se golpeó contra las rocas, perdiste *¥${cantidad.toLocaleString()} ${currency}*.`,
        `El pez escapó y arruinó tu red, perdiste *¥${cantidad.toLocaleString()} ${currency}*.`,
        `El pez se soltó y dañó tu carrete, perdiste *¥${cantidad.toLocaleString()} ${currency}*.`,
        `Tu cubeta se volcó y los peces se perdieron, perdiste *¥${cantidad.toLocaleString()} ${currency}*.`
      ]);
    } else {
      message = pickRandom([
        `Pasaste la tarde pescando y observando cómo los peces nadaban cerca.`,
        `El agua estuvo tranquila y los peces se acercaban sin morder.`,
        `Tu jornada de pesca fue serena, los peces nadaban sin ser atrapados.`,
        `Los peces se mostraron esquivos, pero la experiencia fue agradable.`,
        `El río estuvo lleno de peces curiosos que se acercaban sin ser capturados.`
      ]);
    }
    user.lastfish = Date.now() + 8 * 60 * 1000;
    await client.sendMessage(m.chat, { text: `「✿」 ${message}` }, { quoted: m });
  }
};

const cmdSteal = {
  command: ['robar', 'steal', 'rob'],
  category: 'economia', desc: 'Robar coins a otro.', economy: true,
  run: async (client, m, args, usedPrefix, command) => {
    const db = global.db.data, currency = getBotCurrency(client), user = db.users[m.sender];
    user.coins ??= 0; user.laststeal ??= 0;
    if (Date.now() < user.laststeal) return client.reply(m.chat, `Debes esperar *${formatTime(user.laststeal - Date.now())}* para usar *${usedPrefix + command}* de nuevo.`, m);
    const mentioned = m.mentionedJid || [];
    const who2 = mentioned[0] || (m.quoted ? m.quoted.sender : null);
    const who = await resolveLidToRealJid(who2, client, m.chat);
    if (!who) return client.reply(m.chat, `Debes mencionar a alguien para intentar robarle.`, m);
    if (!(who in db.users)) return client.reply(m.chat, `El usuario no se encuentra en mi base de datos.`, m);
    const targetUser = db.users[who];
    if (targetUser.title === 'title_shadow') return client.reply(m.chat, `Ese usuario tiene el título *🌑 Sombra* equipado. Es inmune a los robos.`, m);
    if (targetUser.shield?.expiresAt > Date.now()) return client.reply(m.chat, `Ese usuario tiene un *🛡️ Escudo Anti-Robo* activo. No puedes robarle.`, m);
    const name = targetUser.name || who.split('@')[0];
    const lastCmd = db.chats[m.chat]?.users?.[who]?.lastCmd || 0;
    if (Date.now() - lastCmd < 3600000) return client.reply(m.chat, `Solo puedes robarle *${currency}* a un usuario si estuvo más de 1 hora inactivo.`, m);
    let failThreshold = 0.3;
    if (user.luckBuff?.expiresAt > Date.now()) failThreshold -= user.luckBuff.value;
    if (failThreshold < 0.05) failThreshold = 0.05;
    if (Math.random() < failThreshold) {
      let loss = Math.floor(Math.random() * (5000 - 2000 + 1)) + 2000;
      deductFunds(user, loss);
      user.laststeal = Date.now() + 3600000;
      return client.reply(m.chat, `El robo salió mal y perdiste *¥${loss.toLocaleString()} ${currency}*.`, m);
    }
    let rob = Math.floor(Math.random() * (8000 - 4000 + 1)) + 4000;
    if (user.fortuneBuff?.expiresAt > Date.now()) rob = Math.floor(rob * (1 + user.fortuneBuff.value));
    if ((targetUser.coins || 0) < rob) return client.reply(m.chat, `*${name}* no tiene suficientes *${currency}* fuera del banco como para que valga la pena intentar robar.`, m, { mentions: [who] });
    user.coins += rob; targetUser.coins -= rob;
    user.laststeal = Date.now() + 3600000;
    client.reply(m.chat, `Le robaste *¥${rob.toLocaleString()} ${currency}* a *${name}*`, m, { mentions: [who] });
  }
};

const cmdMath = {
  command: ['math', 'mates', 'resp'],
  category: 'economia', desc: 'Resolver cálculos por XP.', economy: true,
  run: async (client, m, args, usedPrefix, command) => {
    const chatId = m.chat;
    const chat = global.db.data.chats[chatId];
    const user = global.db.data.users[m.sender];
    const juego = global.math[chatId];
    if (command === 'resp') {
      if (!juego?.juegoActivo) return;
      const quotedId = m.quoted?.key?.id || m.quoted?.id || m.quoted?.stanzaId;
      if (quotedId !== juego.problemMessageId) return;
      const respuestaUsuario = parseFloat(args[0]);
      if (isNaN(respuestaUsuario)) return client.reply(chatId, `「」Debes escribir tu respuesta numérica. Ejemplo: *${usedPrefix}resp 42*`, m);
      const respuestaCorrecta = parseFloat(juego.respuesta);
      const botId = getBotId(client);
      const primaryBotId = chat?.primaryBot;
      if (!primaryBotId || primaryBotId === botId) {
        if (respuestaUsuario === respuestaCorrecta) {
          const [min, max] = mathRewards[juego.dificultad] || [500, 1000];
          const coinsAleatorio = Math.floor(Math.random() * (max - min + 1)) + min;
          user.coins = (user.coins || 0) + coinsAleatorio;
          clearTimeout(juego.tiempoLimite); delete global.math[chatId];
          return client.reply(chatId, `「」Respuesta correcta.\n*Ganaste ›* ¥${coinsAleatorio.toLocaleString()}`, m);
        } else {
          juego.intentos += 1;
          if (juego.intentos >= 3) { clearTimeout(juego.tiempoLimite); delete global.math[chatId]; return client.reply(chatId, '「」Te quedaste sin intentos. Suerte a la próxima.', m); }
          else return client.reply(chatId, `「」Respuesta incorrecta, te quedan ${3 - juego.intentos} intentos.`, m);
        }
      }
      return;
    }
    if (["math", "mates"].includes(command)) {
      if (juego?.juegoActivo) return client.reply(chatId, 'Ya hay un juego activo. Espera a que termine.', m);
      const dificultad = args[0]?.toLowerCase();
      if (!mathLimits[dificultad]) return client.reply(chatId, '「」Especifica una dificultad válida: *facil, medio, dificil, imposible, imposible2*', m);
      const { problema, resultado } = genMathProblem(dificultad);
      const problemMessage = await client.reply(chatId, `「✩」Tienes 1 minuto para resolver:\n\n✩ *${problema}*\n\n_✐ Usa *${usedPrefix}resp* para responder!_`, m);
      global.math[chatId] = {
        juegoActivo: true, problema, respuesta: resultado.toString(), intentos: 0,
        dificultad, timeout: Date.now() + 60000, problemMessageId: problemMessage.key?.id,
        tiempoLimite: setTimeout(() => { if (global.math[chatId]?.juegoActivo) { delete global.math[chatId]; client.reply(chatId, '「✿」Tiempo agotado. El juego ha terminado.', m); } }, 60000)
      };
    }
  }
};

export default [cmdWork, cmdDaily, cmdWeekly, cmdMonthly, cmdCrime, cmdSlut, cmdMine, cmdHunt, cmdFish, cmdSteal, cmdMath];
