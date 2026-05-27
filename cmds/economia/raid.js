import { gameEngine } from '../../utils/gameEngine.js';
import { pickRandom, formatTime, getBotCurrency } from '../../utils/tools.js';

// ── Boss Definitions ──
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
  let base = Math.floor(Math.random() * 41) + 30; // 30-70
  // Buff: Gema del Dragón (+30% dungeon dmg)
  if (user.inventory?.some(i => i === 'gema_dragon' || i?.id === 'gema_dragon')) {
    base = Math.floor(base * 1.3);
  }
  // Buff: Infernal title (+20%)
  if (user.title === 'title_fire') {
    base = Math.floor(base * 1.2);
  }
  return base;
}

export default {
  command: ['raid', 'raidboss'],
  category: 'economia',
  desc: 'Inicia una mazmorra cooperativa donde varios jugadores luchan contra un jefe épico.',
  usage: '[start/unirse/atacar/estado]',
  economy: true,
  cooldown: 3,
  run: async (client, m, args, usedPrefix, command) => {
    const sub = (args[0] || '').toLowerCase();
    const currency = getBotCurrency(client);
    const user = global.db.data.users[m.sender];

    // ── START: Crear un raid ──
    if (sub === 'start' || sub === 'iniciar' || sub === 'crear') {
      if (!m.isGroup) return m.reply('⚠️ Los raids solo se pueden iniciar en grupos.');
      if (gameEngine.has(m.chat, 'raid')) return m.reply('⚠️ Ya hay un raid activo en este grupo. Usa `' + usedPrefix + 'raid unirse` para participar.');

      // Entry cost
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
        phase: 'recruiting', // recruiting → fighting → ended
        leader: m.sender,
        entryCost,
        round: 0,
      };

      gameEngine.start(m.chat, 'raid', m.sender, raidData, {
        timeout: 600000, // 10 min max
        onTimeout: () => {
          // Refund all players if timeout
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
          `El líder puede iniciar la batalla con *${usedPrefix}raid pelear*`,
        mentions
      });
      return;
    }

    // ── JOIN: Unirse a un raid ──
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

    // ── FIGHT: Iniciar la batalla (solo líder) ──
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

    // ── ATTACK: Atacar al jefe ──
    if (sub === 'atacar' || sub === 'attack' || sub === 'atk' || sub === 'golpear') {
      const raid = gameEngine.get(m.chat, 'raid');
      if (!raid) return m.reply(`❌ No hay un raid activo.`);
      if (raid.phase !== 'fighting') return m.reply('⚠️ El raid aún no ha comenzado. El líder debe usar `' + usedPrefix + 'raid pelear`.');
      if (!raid.players.includes(m.sender)) return m.reply('⚠️ No estás en este raid.');

      // Player cooldown (one attack per round — 8 seconds)
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

      // Player attacks boss
      const playerDmg = calcPlayerDmg(playerUser);
      raid.bossHp = Math.max(0, raid.bossHp - playerDmg);
      raid.damage[m.sender] = (raid.damage[m.sender] || 0) + playerDmg;
      raid.round++;

      const atkMsg = pickRandom(ATTACK_MESSAGES)(playerName, playerDmg);
      let fullMsg = atkMsg + '\n';

      // Boss counterattacks a random player
      const bossTarget = pickRandom(raid.players);
      const bossTargetUser = global.db.data.users[bossTarget];
      const bossTargetName = bossTargetUser?.name || bossTarget.split('@')[0];
      const bossDmg = Math.floor(Math.random() * (raid.boss.maxAtk - raid.boss.minAtk + 1)) + raid.boss.minAtk;

      // Reduce target health
      if (bossTargetUser) {
        bossTargetUser.health = Math.max(0, (bossTargetUser.health || 100) - Math.floor(bossDmg / 5));
      }

      fullMsg += pickRandom(BOSS_ATTACK_MESSAGES)(raid.boss, bossTargetName, bossDmg) + '\n\n';
      fullMsg += renderRaidStatus(raid);

      // Check if boss is dead
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
            // Apply title buff for Infernal
            let finalCoins = coinShare;
            if (u.title === 'title_fire') finalCoins = Math.floor(finalCoins * 1.2);
            // Apply fortuneBuff
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

        // Rare drop chance (15% per player)
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

    // ── STATUS: Ver estado del raid ──
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

    // ── LEAVE: Salirse del raid (solo en reclutamiento) ──
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

    // ── CANCEL: Cancelar raid (solo líder, solo reclutamiento) ──
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

    // ── HELP ──
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
  },
};
