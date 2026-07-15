/**
 * 🐉 rpg_adventure.js — Combates cooperativos, aventuras, rituales, logros y cooldowns RPG.
 * Reúne: adventure, dungeon, raid, ritual, achievements, einfo
 */
import { pickRandom, formatTime, getBotCurrency } from '../../utils/tools.js';
import { gameEngine } from '../../utils/gameEngine.js';

// ── LOGROS RPG (ACHIEVEMENTS) ──

export const ACHIEVEMENTS = [
  // Juegos
  { id: 'first_win', name: '🎲 Primera Victoria', desc: 'Gana tu primer juego.', condition: 'gameWins >= 1', reward: { xp: 200 } },
  { id: 'ten_wins', name: '🎯 Jugador Dedicado', desc: 'Gana 10 juegos.', condition: 'gameWins >= 10', reward: { xp: 1000 } },
  { id: 'fifty_wins', name: '⚔️ Gladiador', desc: 'Gana 50 juegos.', condition: 'gameWins >= 50', reward: { xp: 5000, coins: 10000 } },
  { id: 'hundred_wins', name: '🏆 Leyenda del Juego', desc: 'Gana 100 juegos.', condition: 'gameWins >= 100', reward: { xp: 15000, coins: 50000 } },

  // Economía
  { id: 'millionaire', name: '💰 Millonario', desc: 'Acumula 1M de coins (cartera + banco).', condition: 'totalCoins >= 1000000', reward: { xp: 10000 } },
  { id: 'first_deposit', name: '🏦 Primer Depósito', desc: 'Deposita coins por primera vez.', condition: 'bank >= 1', reward: { xp: 100 } },

  // XP y Nivel
  { id: 'xp_master', name: '✨ Maestro del XP', desc: 'Acumula 50,000 XP.', condition: 'exp >= 50000', reward: { coins: 5000 } },
  { id: 'level_10', name: '📈 Nivel 10', desc: 'Alcanza el nivel 10.', condition: 'level >= 10', reward: { xp: 2000, coins: 3000 } },
  { id: 'level_25', name: '🌟 Nivel 25', desc: 'Alcanza el nivel 25.', condition: 'level >= 25', reward: { xp: 5000, coins: 10000 } },
  { id: 'level_50', name: '💎 Nivel 50', desc: 'Alcanza el nivel 50.', condition: 'level >= 50', reward: { xp: 15000, coins: 25000 } },

  // Actividad
  { id: 'veteran', name: '🎖️ Veterano', desc: 'Ejecuta 500 comandos.', condition: 'usedcommands >= 500', reward: { xp: 3000 } },
  { id: 'commander', name: '⭐ Comandante', desc: 'Ejecuta 2000 comandos.', condition: 'usedcommands >= 2000', reward: { xp: 8000, coins: 15000 } },

  // Streaks
  { id: 'streak_7', name: '🔥 Racha Semanal', desc: 'Mantén una racha diaria de 7 días.', condition: 'streak >= 7', reward: { xp: 1500, coins: 5000 } },
  { id: 'streak_30', name: '🌋 Racha Mensual', desc: 'Mantén una racha diaria de 30 días.', condition: 'streak >= 30', reward: { xp: 10000, coins: 30000 } },
];

export function checkAchievements(sender) {
  const user = global.db.data.users[sender];
  if (!user) return [];
  if (!user.achievements) user.achievements = [];

  const totalCoins = (user.coins || 0) + (user.bank || 0);
  const ctx = {
    gameWins: user.gameWins || 0,
    gameLosses: user.gameLosses || 0,
    totalCoins,
    bank: user.bank || 0,
    exp: user.exp || 0,
    level: user.level || 0,
    usedcommands: user.usedcommands || 0,
    streak: user.streak || 0,
  };

  const newlyUnlocked = [];

  for (const achievement of ACHIEVEMENTS) {
    if (user.achievements.includes(achievement.id)) continue;

    let passed = false;
    try {
      const fn = new Function(...Object.keys(ctx), `return ${achievement.condition}`);
      passed = fn(...Object.values(ctx));
    } catch { continue; }

    if (passed) {
      user.achievements.push(achievement.id);
      if (achievement.reward) {
        if (achievement.reward.xp) user.exp = (user.exp || 0) + achievement.reward.xp;
        if (achievement.reward.coins) user.coins = (user.coins || 0) + achievement.reward.coins;
      }
      newlyUnlocked.push(achievement);
    }
  }

  return newlyUnlocked;
}

// ── RAID BOSS DATA ──

const BOSSES = [
  { name: '🐉 Dragón Ancestral', hp: 800, minAtk: 30, maxAtk: 80, coins: 50000, xp: 3000, emoji: '🐉', lore: 'Un dragón milenario despierta de su letargo en las profundidades de la montaña de Ignis.' },
  { name: '💀 Señor de las Sombras', hp: 600, minAtk: 40, maxAtk: 70, coins: 40000, xp: 2500, emoji: '💀', lore: 'El nigromante supremo ha reunido un ejército de no-muertos en la fortaleza del Vacío.' },
  { name: '🕷️ Arachne, Reina Arácnida', hp: 500, minAtk: 25, maxAtk: 65, coins: 35000, xp: 2000, emoji: '🕷️', lore: 'La reina de las arañas teje sus redes mortales en las cuevas de Silkmoor.' },
  { name: '🧟 Golem de Obsidiana', hp: 1000, minAtk: 20, maxAtk: 60, coins: 60000, xp: 4000, emoji: '🧟', lore: 'Un coloso de piedra volcánica cobra vida en el corazón del volcán dormido.' },
  { name: '👹 Demonio del Abismo', hp: 700, minAtk: 35, maxAtk: 90, coins: 55000, xp: 3500, emoji: '👹', lore: 'Un portal interdimensional se abre y el comandante demoniaco cruza al mundo mortal.' },
  { name: '🦑 Kraken de las Profundidades', hp: 900, minAtk: 25, maxAtk: 75, coins: 58000, xp: 3800, emoji: '🦑', lore: 'Las aguas del puerto se tiñen de negro. El Kraken ha despertado de su sueño eterno.' },
];

const ATTACK_MESSAGES = [
  (name, dmg) => `⚔️ *${name}* carga con su arma y asesta un golpe crítico de *${dmg} DMG*!`,
  (name, dmg) => `🗡️ *${name}* esquiva un ataque y contraataca infligiendo *${dmg} DMG*!`,
  (name, dmg) => `🏹 *${name}* lanza un proyectil certero que impacta al jefe por *${dmg} DMG*!`,
  (name, dmg) => `🔮 *${name}* canaliza energía arcana y desata *${dmg} DMG* de daño mágico!`,
  (name, dmg) => `💥 *${name}* ejecuta un combo devastador causando *${dmg} DMG*!`,
  (name, dmg) => `🌪️ *${name}* invoca un torbellino que arrasa al enemigo por *${dmg} DMG*!`,
];

const BOSS_ATTACK_MESSAGES = [
  (boss, target, dmg) => `${boss.emoji} *${boss.name}* lanza una llamarada contra *${target}* causándole *${dmg} DMG*!`,
  (boss, target, dmg) => `${boss.emoji} *${boss.name}* golpea a *${target}* con su cola infligiendo *${dmg} DMG*!`,
  (boss, target, dmg) => `${boss.emoji} *${boss.name}* lanza un rugido ensordecedor que hiere a *${target}* por *${dmg} DMG*!`,
  (boss, target, dmg) => `${boss.emoji} *${boss.name}* arremete contra *${target}* causando *${dmg} DMG*!`,
];

function renderRaidStatus(raid) {
  const hpBar = renderHpBar(raid.bossHp, raid.bossMaxHp);
  const playerList = Object.entries(raid.damage)
    .sort((a, b) => b[1] - a[1])
    .map(([jid, dmg], i) => `  ${i + 1}. @${jid.split('@')[0]} — ${dmg} DMG`)
    .join('\n');
  return `${raid.boss.emoji} *${raid.boss.name}*\n${hpBar} ${raid.bossHp}/${raid.bossMaxHp} HP\n\n👥 *Participantes:*\n${playerList}`;
}

function renderHpBar(current, max) {
  const pct = Math.max(0, current / max);
  const filled = Math.round(pct * 10);
  return '▓'.repeat(filled) + '░'.repeat(10 - filled);
}

function calcPlayerDmg(user) {
  let base = Math.floor(Math.random() * 41) + 30;
  if (user.inventory?.some(i => i === 'gema_dragon' || i?.id === 'gema_dragon')) {
    base = Math.floor(base * 1.3);
  }
  if (user.title === 'title_fire') {
    base = Math.floor(base * 1.2);
  }
  return base;
}

// ── RITUAL MESSAGES ──

const normalInvocations = [
  'Tu ritual abre un portal y caen riquezas ardientes del vacío',
  'Las velas se consumen y revelan un cofre lleno de monedas antiguas',
  'El círculo de invocación brilla y aparecen gemas relucientes',
  'Un espíritu menor te entrega un saco de oro como ofrenda',
  'Los cánticos atraen un espectro que deja riquezas a tus pies',
  'La luna ilumina tu altar y revela un tesoro escondido',
  'Un demonio amistoso surge y te paga por tu invocación',
  'El humo del incienso se transforma en monedas brillantes',
  'Los símbolos arcanos vibran y materializan riquezas inesperadas',
  'Un guardián espiritual aparece y te recompensa por tu fe'
];

const legendaryInvocations = [
  '¡Has invocado un espíritu ancestral que te entrega un tesoro legendario!',
  'Un dragón cósmico emerge del ritual y te concede riquezas infinitas',
  'Los dioses antiguos responden y derraman oro celestial sobre ti',
  'Un ángel guardián desciende y coloca un cofre sagrado en tus manos',
  'El portal dimensional se abre y un tesoro prohibido cae ante ti',
  'La tierra tiembla y un espíritu titánico te entrega riquezas ocultas',
  'Un fénix resucitado deja joyas ardientes como recompensa',
  'Los astros se alinean y un tesoro cósmico aparece en tu altar'
];

// ── COMANDOS DE AVENTURA Y MAZMORRA ──

const cmdAdventure = {
  command: ['adventure', 'aventura'],
  category: 'economia', desc: 'Ir de aventura.', economy: true,
  run: async (client, m, args, usedPrefix) => {
    const user = global.db.data.users[m.sender];
    const currency = getBotCurrency(client);
    user.lastadventure ??= 0;
    user.coins ??= 0;
    user.health ??= 100;
    if (user.health < 5) return m.reply(`No tienes suficiente salud para volver a *aventurarte*.\nUsa *"${usedPrefix}heal"* para curarte.`);
    const remainingTime = user.lastadventure - Date.now();
    if (remainingTime > 0) return m.reply(`Debes esperar *${formatTime(remainingTime)}* antes de volver a aventurarte.`);
    const rand = Math.random();
    let cantidad = 0, salud = Math.floor(Math.random() * (20 - 10 + 1)) + 10, message;
    if (rand < 0.4) {
      cantidad = Math.floor(Math.random() * (18000 - 14000 + 1)) + 14000;
      user.coins += cantidad; user.health -= salud;
      message = pickRandom([
        `Derrotaste a un ogro emboscado entre los árboles de Drakonia, ganaste *¥${cantidad.toLocaleString()} ${currency}*.`,
        `Te conviertes en campeón del torneo de gladiadores de Valoria, ganaste *¥${cantidad.toLocaleString()} ${currency}*.`,
        `Rescatas un libro mágico del altar de los Susurros, ganaste *¥${cantidad.toLocaleString()} ${currency}*.`,
        `Liberas a aldeanos atrapados en las minas de Ulderan tras vencer a los trolls, ganaste *¥${cantidad.toLocaleString()} ${currency}*.`,
        `Derrotas a un dragón joven en los acantilados de Flamear, ganaste *¥${cantidad.toLocaleString()} ${currency}*.`,
        `Encuentras un relicario sagrado en las ruinas de Iskaria y lo proteges de saqueadores, ganaste *¥${cantidad.toLocaleString()} ${currency}*.`,
        `Triunfas en el duelo contra el caballero corrupto de Invalion, ganaste *¥${cantidad.toLocaleString()} ${currency}*.`,
        `Conquistas la fortaleza maldita de las Sombras Rojas sin sufrir bajas, ganaste *¥${cantidad.toLocaleString()} ${currency}*.`,
        `Te infiltras en el templo del Vacío y recuperas el cristal del equilibrio, ganaste *¥${cantidad.toLocaleString()} ${currency}*.`,
        `Resuelves el acertijo de la cripta eterna y obtienes un tesoro legendario, ganaste *¥${cantidad.toLocaleString()} ${currency}*.`
      ]);
    } else if (rand < 0.7) {
      cantidad = Math.floor(Math.random() * (11000 - 9000 + 1)) + 9000;
      const total = (user.coins || 0) + (user.bank || 0);
      if (total >= cantidad) { if (user.coins >= cantidad) { user.coins -= cantidad; } else { const r = cantidad - user.coins; user.coins = 0; user.bank -= r; } } else { cantidad = total; user.coins = 0; user.bank = 0; }
      user.health -= salud; if (user.health < 0) user.health = 0;
      message = pickRandom([
        `El hechicero oscuro te lanzó una maldición y huyes perdiendo *¥${cantidad.toLocaleString()} ${currency}*.`,
        `Te extravías en la jungla de Zarkelia y unos bandidos te asaltan, pierdes *¥${cantidad.toLocaleString()} ${currency}*.`,
        `Un basilisco te embiste y escapas herido sin botín, pierdes *¥${cantidad.toLocaleString()} ${currency}*.`,
        `Fracasa tu incursión a la torre de hielo cuando caes en una trampa mágica, pierdes *¥${cantidad.toLocaleString()} ${currency}*.`,
        `Pierdes orientación entre los portales del bosque espejo y terminas sin recompensa, pierdes *¥${cantidad.toLocaleString()} ${currency}*.`,
        `Un grupo de trolls te embosca y te quitan tus pertenencias, pierdes *¥${cantidad.toLocaleString()} ${currency}*.`,
        `El dragón anciano te derrota y te obliga a huir, pierdes *¥${cantidad.toLocaleString()} ${currency}*.`
      ]);
    } else {
      message = pickRandom([
        `Exploras ruinas antiguas y aprendes secretos ocultos.`,
        `Sigues la pista de un espectro pero desaparece entre la niebla.`,
        `Acompañas a una princesa por los desiertos de Thaloria sin contratiempos.`,
        `Recorres un bosque encantado y descubres nuevas rutas.`,
        `Visitas una aldea remota y escuchas relatos de viejas batallas.`
      ]);
    }
    user.lastadventure = Date.now() + 20 * 60 * 1000;
    await client.sendMessage(m.chat, { text: `「✿」 ${message}` }, { quoted: m });
  }
};

const cmdDungeon = {
  command: ['dungeon', 'mazmorra'],
  category: 'economia', desc: 'Explorar una mazmorra.', economy: true,
  run: async (client, m, args, usedPrefix) => {
    const user = global.db.data.users[m.sender];
    const currency = getBotCurrency(client);
    user.lastdungeon ??= 0;
    user.coins ??= 0;
    user.health ??= 100;
    if (user.health < 5) return m.reply(`No tienes suficiente salud para volver a la *mazmorra*.\nUsa *"${usedPrefix}heal"* para curarte.`);
    if (Date.now() < user.lastdungeon) return m.reply(`Debes esperar *${formatTime(user.lastdungeon - Date.now())}* antes de volver a la mazmorra.`);
    const rand = Math.random();
    let cantidad = 0, salud = Math.floor(Math.random() * (18 - 10 + 1)) + 10, message;
    if (rand < 0.4) {
      let cantidad = Math.floor(Math.random() * (15000 - 12000 + 1)) + 12000;
      if (user.title === 'title_fire') cantidad = Math.floor(cantidad * 1.20);
      user.coins += cantidad; user.health -= salud;
      message = pickRandom([
        `Derrotaste al guardián de las ruinas y reclamaste el tesoro antiguo, ganaste *¥${cantidad.toLocaleString()} ${currency}*.`,
        `Descifraste los símbolos rúnicos y obtuviste recompensas ocultas, ganaste *¥${cantidad.toLocaleString()} ${currency}*.`,
        `Encuentras al sabio de la mazmorra, quien te premia por tu sabiduría, ganaste *¥${cantidad.toLocaleString()} ${currency}*.`,
        `El espíritu de la reina ancestral te bendice con una gema de poder, ganaste *¥${cantidad.toLocaleString()} ${currency}*.`,
        `Superas la prueba de los espejos oscuros y recibes un artefacto único, ganaste *¥${cantidad.toLocaleString()} ${currency}*.`,
        `Derrotas a un gólem de obsidiana y desbloqueas un acceso secreto, ganaste *¥${cantidad.toLocaleString()} ${currency}*.`,
        `Salvas a un grupo de exploradores perdidos y ellos te recompensan, ganaste *¥${cantidad.toLocaleString()} ${currency}*.`,
        `Consigues abrir la puerta del juicio y extraes un orbe milenario, ganaste *¥${cantidad.toLocaleString()} ${currency}*.`,
        `Triunfas sobre un demonio ilusorio que custodiaba el sello perdido, ganaste *¥${cantidad.toLocaleString()} ${currency}*.`,
        `Purificas el altar corrompido y recibes una bendición ancestral, ganaste *¥${cantidad.toLocaleString()} ${currency}*.`
      ]);
    } else if (rand < 0.7) {
      cantidad = Math.floor(Math.random() * (9000 - 7500 + 1)) + 7500;
      const total = (user.coins || 0) + (user.bank || 0);
      if (total >= cantidad) { if (user.coins >= cantidad) { user.coins -= cantidad; } else { const r = cantidad - user.coins; user.coins = 0; user.bank -= r; } } else { cantidad = total; user.coins = 0; user.bank = 0; }
      user.health -= salud; if (user.health < 0) user.health = 0;
      message = pickRandom([
        `Un espectro maldito te drena energía antes de que puedas escapar, perdiste *¥${cantidad.toLocaleString()} ${currency}*.`,
        `Un basilisco te sorprende en la cámara oculta, huyes herido, perdiste *¥${cantidad.toLocaleString()} ${currency}*.`,
        `Una criatura informe te roba parte de tu botín en la oscuridad, perdiste *¥${cantidad.toLocaleString()} ${currency}*.`,
        `Fracasas al invocar un portal y quedas atrapado entre dimensiones, perdiste *¥${cantidad.toLocaleString()} ${currency}*.`,
        `Pierdes el control de una reliquia y provocas tu propia caída, perdiste *¥${cantidad.toLocaleString()} ${currency}*.`,
        `Un grupo de espectros te rodea y te obliga a soltar tu tesoro, perdiste *¥${cantidad.toLocaleString()} ${currency}*.`,
        `El demonio de las sombras te derrota y escapas con pérdidas, perdiste *¥${cantidad.toLocaleString()} ${currency}*.`
      ]);
    } else {
      message = pickRandom([
        `Activaste una trampa, pero logras evitar el daño y aprendes algo nuevo.`,
        `La sala cambia de forma y pierdes tiempo explorando en círculos.`,
        `Caes en una ilusión, fortaleces tu mente sin obtener riquezas.`,
        `Exploras pasadizos ocultos y descubres símbolos misteriosos.`,
        `Encuentras un mural antiguo que revela secretos de la mazmorra.`
      ]);
    }
    user.lastdungeon = Date.now() + 17 * 60 * 1000;
    await client.sendMessage(m.chat, { text: `「✿」 ${message}` }, { quoted: m });
  }
};

const cmdRaid = {
  command: ['raid', 'raidboss'],
  category: 'economia', desc: 'Inicia una mazmorra cooperativa donde varios jugadores luchan contra un jefe épico.',
  usage: '[start/unirse/atacar/estado]', economy: true, cooldown: 3,
  run: async (client, m, args, usedPrefix) => {
    const sub = (args[0] || '').toLowerCase();
    const currency = getBotCurrency(client);
    const user = global.db.data.users[m.sender];

    if (sub === 'start' || sub === 'iniciar' || sub === 'crear') {
      if (!m.isGroup) return m.reply('⚠️ Los raids solo se pueden iniciar en grupos.');
      if (gameEngine.has(m.chat, 'raid')) return m.reply('⚠️ Ya hay un raid activo en este grupo. Usa `' + usedPrefix + 'raid unirse` para participar.');

      const entryCost = 2000;
      if ((user.coins || 0) < entryCost) return m.reply(`❌ Necesitas al menos *¥${entryCost.toLocaleString()} ${currency}* para convocar un raid.`);
      if ((user.health || 100) < 20) return m.reply(`❌ Tu salud es muy baja para liderar un raid. Usa *${usedPrefix}heal* primero.`);

      user.coins -= entryCost;

      const boss = pickRandom(BOSSES);
      const raidData = {
        boss,
        bossHp: boss.hp,
        bossMaxHp: boss.hp,
        players: [m.sender],
        damage: { [m.sender]: 0 },
        phase: 'recruiting',
        leader: m.sender,
        entryCost,
        round: 0,
      };

      gameEngine.start(m.chat, 'raid', m.sender, raidData, {
        timeout: 600000,
        onTimeout: () => {
          for (const jid of raidData.players) {
            const u = global.db.data.users[jid];
            if (u) u.coins = (u.coins || 0) + entryCost;
          }
          client.sendMessage(m.chat, { text: '⏰ *El raid ha expirado.* Nadie derrotó al jefe a tiempo. Se devolvieron las monedas de entrada.' });
        }
      });

      const mentions = [m.sender];
      await client.sendMessage(m.chat, {
        text: `⚔️ *¡RAID BOSS CONVOCADO!* ⚔️\n\n` +
          `${boss.emoji} *${boss.name}*\n` +
          `> _${boss.lore}_\n\n` +
          `${renderHpBar(boss.hp, boss.hp)} ${boss.hp}/${boss.hp} HP\n\n` +
          `👑 *Líder:* @${m.sender.split('@')[0]}\n` +
          `💰 *Costo de entrada:* ¥${entryCost.toLocaleString()} ${currency}\n` +
          `👥 *Jugadores:* 1/6\n\n` +
          `Usa *${usedPrefix}raid unirse* para unirte!\n` +
          `El líder puede iniciar la batalla con *${usedPrefix}raid pelear*\n` +
          `También se puede cancelar con *${usedPrefix}raid cancelar*`,
        mentions
      });
      return;
    }

    if (sub === 'unirse' || sub === 'join' || sub === 'entrar') {
      const raid = gameEngine.get(m.chat, 'raid');
      if (!raid) return m.reply(`❌ No hay un raid activo. Usa *${usedPrefix}raid start* para crear uno.`);
      if (raid.phase !== 'recruiting') return m.reply('⚠️ La batalla ya comenzó. Espera al próximo raid.');
      if (raid.players.includes(m.sender)) return m.reply('⚠️ Ya estás en este raid.');
      if (raid.players.length >= 6) return m.reply('⚠️ El raid está lleno (máximo 6 jugadores).');

      if ((user.coins || 0) < raid.entryCost) return m.reply(`❌ Necesitas *¥${raid.entryCost.toLocaleString()} ${currency}* para unirte al raid.`);
      if ((user.health || 100) < 20) return m.reply(`❌ Tu salud es muy baja. Usa *${usedPrefix}heal* primero.`);

      user.coins -= raid.entryCost;
      raid.players.push(m.sender);
      raid.damage[m.sender] = 0;

      await client.sendMessage(m.chat, {
        text: `✅ @${m.sender.split('@')[0]} se unió al raid!\n👥 *Jugadores:* ${raid.players.length}/6\n\n${renderRaidStatus(raid)}`,
        mentions: [m.sender]
      });
      return;
    }

    if (sub === 'pelear' || sub === 'fight' || sub === 'luchar') {
      const raid = gameEngine.get(m.chat, 'raid');
      if (!raid) return m.reply(`❌ No hay un raid activo.`);
      if (raid.phase !== 'recruiting') return m.reply('⚠️ La batalla ya está en curso. Usa `' + usedPrefix + 'raid atacar` para atacar.');
      if (m.sender !== raid.leader) return m.reply('⚠️ Solo el líder del raid puede iniciar la batalla.');
      if (raid.players.length < 2) return m.reply('⚠️ Se necesitan al menos *2 jugadores* para iniciar el raid.');

      raid.phase = 'fighting';

      const mentions = raid.players;
      await client.sendMessage(m.chat, {
        text: `⚔️ *¡LA BATALLA COMIENZA!* ⚔️\n\n` +
          `${raid.boss.emoji} *${raid.boss.name}* ruge con furia!\n\n` +
          `${renderRaidStatus(raid)}\n\n` +
          `Todos los participantes usen *${usedPrefix}raid atacar* para infligir daño!`,
        mentions
      });
      return;
    }

    if (sub === 'atacar' || sub === 'attack' || sub === 'atk' || sub === 'golpear') {
      const raid = gameEngine.get(m.chat, 'raid');
      if (!raid) return m.reply(`❌ No hay un raid activo.`);
      if (raid.phase !== 'fighting') return m.reply('⚠️ El raid aún no ha comenzado. El líder debe usar `' + usedPrefix + 'raid pelear`.');
      if (!raid.players.includes(m.sender)) return m.reply('⚠️ No estás en este raid.');

      raid._attackCooldowns = raid._attackCooldowns || {};
      const now = Date.now();
      const lastAtk = raid._attackCooldowns[m.sender] || 0;
      if (now - lastAtk < 8000) {
        const wait = Math.ceil((8000 - (now - lastAtk)) / 1000);
        return m.reply(`⏳ Espera *${wait}s* para tu próximo ataque.`);
      }
      raid._attackCooldowns[m.sender] = now;

      const playerUser = global.db.data.users[m.sender];
      const playerName = playerUser?.name || m.sender.split('@')[0];

      const playerDmg = calcPlayerDmg(playerUser);
      raid.bossHp = Math.max(0, raid.bossHp - playerDmg);
      raid.damage[m.sender] = (raid.damage[m.sender] || 0) + playerDmg;
      raid.round++;

      const atkMsg = pickRandom(ATTACK_MESSAGES)(playerName, playerDmg);
      let fullMsg = atkMsg + '\n';

      const bossTarget = pickRandom(raid.players);
      const bossTargetUser = global.db.data.users[bossTarget];
      const bossTargetName = bossTargetUser?.name || bossTarget.split('@')[0];
      const bossDmg = Math.floor(Math.random() * (raid.boss.maxAtk - raid.boss.minAtk + 1)) + raid.boss.minAtk;

      if (bossTargetUser) {
        bossTargetUser.health = Math.max(0, (bossTargetUser.health || 100) - Math.floor(bossDmg / 5));
      }

      fullMsg += pickRandom(BOSS_ATTACK_MESSAGES)(raid.boss, bossTargetName, bossDmg) + '\n\n';
      fullMsg += renderRaidStatus(raid);

      if (raid.bossHp <= 0) {
        gameEngine.end(m.chat, 'raid');
        const totalDmg = Object.values(raid.damage).reduce((a, b) => a + b, 0);

        let victoryMsg = `\n\n🏆 *¡${raid.boss.name} HA SIDO DERROTADO!* 🏆\n\n💰 *Botín:*\n`;
        const mentions = [];

        for (const [jid, dmg] of Object.entries(raid.damage)) {
          const pct = dmg / totalDmg;
          const coinShare = Math.floor(raid.boss.coins * pct);
          const xpShare = Math.floor(raid.boss.xp * pct);
          const u = global.db.data.users[jid];
          if (u) {
            let finalCoins = coinShare;
            if (u.title === 'title_fire') finalCoins = Math.floor(finalCoins * 1.2);
            if (u.fortuneBuff && u.fortuneBuff.expiresAt > Date.now()) {
              finalCoins = Math.floor(finalCoins * (1 + u.fortuneBuff.value));
            }

            u.coins = (u.coins || 0) + finalCoins;
            u.exp = (u.exp || 0) + xpShare;
            u.gameWins = (u.gameWins || 0) + 1;
            victoryMsg += `  @${jid.split('@')[0]} — *¥${finalCoins.toLocaleString()}* + *${xpShare} XP* (${Math.round(pct * 100)}% DMG)\n`;
            mentions.push(jid);
          }
        }

        const rareDrops = [];
        for (const jid of raid.players) {
          if (Math.random() < 0.15) {
            const u = global.db.data.users[jid];
            if (u) {
              const drops = ['gema_dragon', 'anillo_fortuna', 'pluma_fenix', 'moneda_antigua', 'cristal_exp'];
              const drop = pickRandom(drops);
              u.inventory = u.inventory || [];
              u.inventory.push(drop);
              rareDrops.push(`  🎁 @${jid.split('@')[0]} obtuvo un item raro: *${drop}*`);
            }
          }
        }

        if (rareDrops.length > 0) {
          victoryMsg += `\n🎁 *Drops Raros:*\n${rareDrops.join('\n')}`;
        }

        fullMsg += victoryMsg;
        await client.sendMessage(m.chat, { text: fullMsg, mentions });
        return;
      }

      await client.sendMessage(m.chat, { text: fullMsg, mentions: raid.players });
      return;
    }

    if (sub === 'estado' || sub === 'status' || sub === 'info') {
      const raid = gameEngine.get(m.chat, 'raid');
      if (!raid) return m.reply(`❌ No hay un raid activo. Usa *${usedPrefix}raid start* para crear uno.`);

      await client.sendMessage(m.chat, {
        text: `⚔️ *ESTADO DEL RAID* ⚔️\n\n` +
          `📋 *Fase:* ${raid.phase === 'recruiting' ? '🟡 Reclutando' : '🔴 En Batalla'}\n` +
          `👥 *Jugadores:* ${raid.players.length}/6\n\n` +
          renderRaidStatus(raid),
        mentions: raid.players
      });
      return;
    }

    if (sub === 'salir' || sub === 'leave') {
      const raid = gameEngine.get(m.chat, 'raid');
      if (!raid) return m.reply(`❌ No hay un raid activo.`);
      if (!raid.players.includes(m.sender)) return m.reply('⚠️ No estás en este raid.');
      if (raid.phase !== 'recruiting') return m.reply('⚠️ No puedes salir durante la batalla!');
      if (m.sender === raid.leader) return m.reply('⚠️ El líder no puede abandonar el raid. Usa `' + usedPrefix + 'raid cancelar` para cancelarlo.');

      raid.players = raid.players.filter(j => j !== m.sender);
      delete raid.damage[m.sender];
      user.coins = (user.coins || 0) + raid.entryCost;

      await client.sendMessage(m.chat, {
        text: `🚪 @${m.sender.split('@')[0]} abandonó el raid. Se devolvieron *¥${raid.entryCost.toLocaleString()} ${currency}*.\n👥 *Jugadores:* ${raid.players.length}/6`,
        mentions: [m.sender]
      });
      return;
    }

    if (sub === 'cancelar' || sub === 'cancel') {
      const raid = gameEngine.get(m.chat, 'raid');
      if (!raid) return m.reply(`❌ No hay un raid activo.`);
      if (m.sender !== raid.leader) return m.reply('⚠️ Solo el líder puede cancelar el raid.');
      if (raid.phase !== 'recruiting') return m.reply('⚠️ No puedes cancelar un raid en batalla!');

      gameEngine.end(m.chat, 'raid');
      for (const jid of raid.players) {
        const u = global.db.data.users[jid];
        if (u) u.coins = (u.coins || 0) + raid.entryCost;
      }

      await client.sendMessage(m.chat, {
        text: `❌ *Raid cancelado* por el líder. Se devolvieron las monedas de entrada a todos los jugadores.`
      });
      return;
    }

    const helpText = `⚔️ *RAID BOSS — Mazmorra Cooperativa* ⚔️\n\n` +
      `Reúne a tu equipo y enfrenta a un jefe épico!\n\n` +
      `📋 *Subcomandos:*\n` +
      `• *${usedPrefix}raid start* — Convocar un raid (¥2,000)\n` +
      `• *${usedPrefix}raid unirse* — Unirse al raid activo\n` +
      `• *${usedPrefix}raid pelear* — Iniciar la batalla (líder)\n` +
      `• *${usedPrefix}raid atacar* — Atacar al jefe\n` +
      `• *${usedPrefix}raid estado* — Ver estado actual\n` +
      `• *${usedPrefix}raid salir* — Salir del raid\n` +
      `• *${usedPrefix}raid cancelar* — Cancelar el raid (líder)\n\n` +
      `💡 *Tips:*\n` +
      `• El título *🔥 Infernal* otorga +20% daño y loot\n` +
      `• La *🐉 Gema del Dragón* otorga +30% daño\n` +
      `• El loot se reparte según el daño infligido\n` +
      `• Hay un 15% de probabilidad de obtener items raros`;

    await m.reply(helpText);
  }
};

const cmdRitual = {
  command: ['ritual', 'invoke'],
  category: 'economia', desc: 'Invocar un ritual.', economy: true,
  run: async (client, m, args, usedPrefix) => {
    const monedas = getBotCurrency(client);
    const user = global.db.data.users[m.sender];
    const remaining = (user.lastinvoke || 0) - Date.now();
    if (remaining > 0) return m.reply(`Debes esperar *${formatTime(remaining)}* para invocar otro ritual.`);
    user.lastinvoke = Date.now() + 12 * 60 * 1000;
    const roll = Math.random();
    let reward = 0, narration = '', bonusMsg = '';
    if (roll < 0.05) {
      reward = Math.floor(Math.random() * (13000 - 11000 + 1)) + 11000;
      narration = pickRandom(legendaryInvocations);
      bonusMsg = '\nRecompensa LEGENDARIA obtenida!';
    } else {
      reward = Math.floor(Math.random() * (11000 - 8000 + 1)) + 8000;
      narration = pickRandom(normalInvocations);
      if (Math.random() < 0.15) {
        const bonus = Math.floor(Math.random() * (4500 - 2500 + 1)) + 2500;
        reward += bonus;
        bonusMsg = `\n「✿」 ¡Energía extra! Ganaste *${bonus.toLocaleString()}* ${monedas} adicionales`;
      }
    }
    user.coins = (user.coins || 0) + reward;
    let msg = `「✿」 ${narration}\nGanaste *${reward.toLocaleString()} ${monedas}*`;
    if (bonusMsg) msg += `\n${bonusMsg}`;
    await client.reply(m.chat, msg, m);
  }
};

const cmdAchievements = {
  command: ['achievements', 'logros', 'badges'],
  category: 'economia', economy: true, desc: 'Muestra tus logros y progreso.', cooldown: 5,
  run: async (client, m, args, usedPrefix) => {
    const user = global.db.data.users[m.sender];
    const currency = getBotCurrency(client);
    const unlocked = user.achievements || [];

    const newAchievements = checkAchievements(m.sender);

    let msg = `🏅 *L O G R O S* 🏅\n\n`;

    if (newAchievements.length > 0) {
      msg += `> 🎉 *¡Nuevos logros desbloqueados!*\n`;
      for (const a of newAchievements) {
        let rewardText = '';
        if (a.reward?.xp) rewardText += `+${a.reward.xp} XP `;
        if (a.reward?.coins) rewardText += `+${a.reward.coins} ${currency}`;
        msg += ` ⊳ ${a.name} — ${rewardText.trim()}\n`;
      }
      msg += '\n';
    }

    const unlockedAchievements = ACHIEVEMENTS.filter(a => unlocked.includes(a.id));
    const lockedAchievements = ACHIEVEMENTS.filter(a => !unlocked.includes(a.id));

    if (unlockedAchievements.length > 0) {
      msg += `> ✅ *Desbloqueados (${unlockedAchievements.length}/${ACHIEVEMENTS.length})*\n`;
      for (const a of unlockedAchievements) {
        msg += ` ⊳ ${a.name} — _${a.desc}_\n`;
      }
    }

    if (lockedAchievements.length > 0) {
      msg += `\n> 🔒 *Por desbloquear (${lockedAchievements.length})*\n`;
      for (const a of lockedAchievements) {
        let rewardText = '';
        if (a.reward?.xp) rewardText += `+${a.reward.xp} XP `;
        if (a.reward?.coins) rewardText += `+${a.reward.coins} ${currency}`;
        msg += ` ⊳ ??? — _${a.desc}_ [${rewardText.trim()}]\n`;
      }
    }

    const pct = Math.round((unlockedAchievements.length / ACHIEVEMENTS.length) * 100);
    const filled = Math.round(pct / 10);
    const bar = '█'.repeat(filled) + '░'.repeat(10 - filled);
    msg += `\n⌦ Progreso: [${bar}] ${pct}%`;

    await client.sendMessage(m.chat, { text: msg }, { quoted: m });
  }
};

const cmdEinfo = {
  command: ['infoeconomy', 'cooldowns', 'economyinfo', 'einfo'],
  category: 'economia', economy: true, desc: 'Info de la economía del grupo.',
  run: async (client, m, args, usedPrefix) => {
    const user = global.db.data.users[m.sender];
    const currency = getBotCurrency(client);
    const now = Date.now();
    const cooldowns = {
      crime: Math.max(0, (user.lastcrime || 0) - now),
      mine: Math.max(0, (user.lastmine || 0) - now),
      ritual: Math.max(0, (user.lastinvoke || 0) - now),
      work: Math.max(0, (user.lastwork || 0) - now),
      slut: Math.max(0, (user.lastslut || 0) - now),
      steal: Math.max(0, (user.laststeal || 0) - now),
      daily: Math.max(0, (user.lastdaily || 0) - now),
      weekly: Math.max(0, (user.lastweekly || 0) - now),
      monthly: Math.max(0, (user.lastmonthly || 0) - now)
    };
    const coins = user.coins || 0;
    const name = user.name || m.sender.split('@')[0];
    const mensaje = `✿ Usuario \`<${name}>\`

Work *${formatTime(cooldowns.work)}*
Slut *${formatTime(cooldowns.slut)}*
Crime *${formatTime(cooldowns.crime)}*
Mine *${formatTime(cooldowns.mine)}*
Ritual *${formatTime(cooldowns.ritual)}*
Steal *${formatTime(cooldowns.steal)}*
Daily *${formatTime(cooldowns.daily)}*
Weekly *${formatTime(cooldowns.weekly)}*
Monthly *${formatTime(cooldowns.monthly)}*

Coins totales ¥${coins.toLocaleString()} ${currency}`;
    await client.sendMessage(m.chat, { text: mensaje }, { quoted: m });
  }
};

export default [cmdAdventure, cmdDungeon, cmdRaid, cmdRitual, cmdAchievements, cmdEinfo];
