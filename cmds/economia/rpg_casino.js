/**
 * 🎲 rpg_casino.js — Comandos de apuestas y juegos de azar RPG.
 * Incluye: casino/apostar, coinflip, ppt, roulette, slots
 */
import { delay } from "@whiskeysockets/baileys";
import { getBotCurrency, formatTime, getBotSettings } from '../../utils/tools.js';

const cmdCasino = {
  command: ['apostar', 'casino'],
  category: 'economia', desc: 'Apostar en el casino.', economy: true,
  run: async (client, m, args, usedPrefix, command) => {
    const user = global.db.data.users[m.sender];
    const currency = getBotCurrency(client);
    const botname = getBotSettings(client)?.botname || 'Bot';
    user.lastApuesta ??= 0;
    let Aku = Math.floor(Math.random() * 101);
    let Kamu = Math.floor(Math.random() * 101);
    let count = args[0];
    const userName = user.name || m.sender.split('@')[0];
    const tiempoEspera = 30 * 1000;
    const ahora = Date.now();
    if (user.lastApuesta && ahora - user.lastApuesta < tiempoEspera) {
      return m.reply(`Debes esperar *${formatTime(user.lastApuesta + tiempoEspera - ahora)}* para usar *${usedPrefix + command}* nuevamente.`);
    }
    user.lastApuesta = ahora;
    count = count ? /all/i.test(count) ? user.coins || 0 : parseInt(count) : args[0] ? parseInt(args[0]) : 1;
    count = Math.max(1, count);
    if (args.length < 1) return m.reply(`Ingresa la cantidad de *${currency}* que deseas aportar contra *${botname}*\nEjemplo: *${usedPrefix + command} 100*`);
    if ((user.coins || 0) >= count) {
      user.coins -= count;
      let resultado = '', ganancia = 0;
      if (Aku > Kamu) {
        resultado = `> ${userName}, *Perdiste ¥${count.toLocaleString()} ${currency}*.`;
      } else if (Aku < Kamu) {
        ganancia = count * 2;
        user.coins += ganancia;
        resultado = `> ${userName}, *Ganaste ¥${ganancia.toLocaleString()} ${currency}*.`;
      } else {
        ganancia = count;
        user.coins += ganancia;
        resultado = `> ${userName}, *Ganaste ¥${ganancia.toLocaleString()} ${currency}*.`;
      }
      let { key } = await client.sendMessage(m.chat, { text: "🎲 El crupier lanza los dados... ¡Las apuestas están cerradas!" }, { quoted: m });
      await delay(2000);
      await client.sendMessage(m.chat, { text: "Los números están girando... ¡Prepárate para el resultado!", edit: key }, { quoted: m });
      await delay(2000);
      const replyMsg = `\`Veamos qué números tienen!\`\n\n➠ *${botname}* : ${Aku}\n➠ *${userName}* : ${Kamu}\n\n${resultado}`;
      await client.sendMessage(m.chat, { text: replyMsg.trim(), edit: key }, { quoted: m });
    } else {
      m.reply(`No tienes *¥${count.toLocaleString()} ${currency}* para apostar!`);
    }
  }
};

const cmdCoinFlip = {
  command: ['cf', 'flip', 'coinflip'],
  category: 'economia', desc: 'Lanzar una moneda.', economy: true,
  run: async (client, m, args, usedPrefix, command) => {
    const user = global.db.data.users[m.sender];
    const monedas = getBotCurrency(client);
    let cantidad, eleccion;
    const a0 = parseFloat(args[0]), a1 = parseFloat(args[1]);
    if (!isNaN(a0)) { cantidad = a0; eleccion = (args[1] || '').toLowerCase(); }
    else if (!isNaN(a1)) { cantidad = a1; eleccion = (args[0] || '').toLowerCase(); }
    else return m.reply(`Cantidad inválida, ingresa un número válido.\nEjemplo *${usedPrefix + command} 200 cara* o *${usedPrefix + command} cruz 200*`);
    if (Math.abs(cantidad) < 100) return m.reply(`La cantidad mínima para apostar es *100 ${monedas}*.`);
    if (!['cara', 'cruz'].includes(eleccion)) return m.reply(`Elección inválida. Solo se admite *cara* o *cruz*.\nEjemplo *${usedPrefix + command} 200 cara*`);
    if (cantidad > (user.coins || 0)) return m.reply(`No tienes suficientes *${monedas}* fuera del banco para apostar, tienes *¥${(user.coins || 0).toLocaleString()} ${monedas}*.`);
    const resultado = Math.random() < 0.5 ? 'cara' : 'cruz';
    const acierto = resultado === eleccion;
    const cambio = acierto ? cantidad : -cantidad;
    user.coins = (user.coins || 0) + cambio;
    if (user.coins < 0) user.coins = 0;
    const cap = t => t.charAt(0).toUpperCase() + t.slice(1);
    await client.sendMessage(m.chat, { text: `「✿」La moneda ha caído en *${cap(resultado)}* y has ${acierto ? 'ganado' : 'perdido'} *¥${Math.abs(cambio).toLocaleString()} ${monedas}*!\nTu elección fue *${cap(eleccion)}*` }, { quoted: m });
  }
};

const cmdPtt = {
  command: ['ppt'],
  category: 'economia', desc: 'Piedra, papel o tijeras.', economy: true,
  run: async (client, m, args, usedPrefix, command) => {
    const monedas = getBotCurrency(client);
    const botname = getBotSettings(client)?.namebot || 'Bot';
    const user = global.db.data.users[m.sender];
    user.lastppt ??= 0;
    const remainingTime = user.lastppt - Date.now();
    if (remainingTime > 0) return m.reply(`Debes esperar *${formatTime(remainingTime)}* antes de jugar nuevamente.`);
    const options = ['piedra', 'papel', 'tijera'];
    const userChoice = args[0]?.trim().toLowerCase();
    if (!options.includes(userChoice)) return m.reply(` Usa el comando así:\n› *${usedPrefix}ppt piedra*, *papel* o *tijera*`);
    const botChoice = options[Math.floor(Math.random() * options.length)];
    const win = (u, b) => { if (u === b) return 'tie'; if ((u === 'piedra' && b === 'tijera') || (u === 'papel' && b === 'piedra') || (u === 'tijera' && b === 'papel')) return 'win'; return 'lose'; };
    const result = win(userChoice, botChoice);
    const reward = Math.floor(Math.random() * (5500 - 3000 + 1)) + 3000;
    const loss = Math.floor(Math.random() * (3000 - 1000 + 1)) + 1000;
    const tieReward = Math.floor(Math.random() * (1500 - 800 + 1)) + 800;
    if (result === 'win') {
      user.coins = (user.coins || 0) + reward;
      await client.sendMessage(m.chat, { text: `Ganaste.\n\n✿ *Tu elección ›* ${userChoice}\n✿ *${botname} eligió ›* ${botChoice}\n✿ *${monedas} ›* ¥${reward.toLocaleString()}` }, { quoted: m });
    } else if (result === 'lose') {
      const total = (user.coins || 0) + (user.bank || 0);
      const actualLoss = Math.min(loss, total);
      if ((user.coins || 0) >= actualLoss) { user.coins -= actualLoss; } else { const r = actualLoss - (user.coins || 0); user.coins = 0; user.bank = Math.max(0, (user.bank || 0) - r); }
      await client.sendMessage(m.chat, { text: `Perdiste.\n\n✿ *Tu elección ›* ${userChoice}\n✿ *${botname} eligió ›* ${botChoice}\n✿ *${monedas} ›* -¥${actualLoss.toLocaleString()}` }, { quoted: m });
    } else {
      user.coins = (user.coins || 0) + tieReward;
      await client.sendMessage(m.chat, { text: `Empate.\n\n✿ *Tu elección ›* ${userChoice}\n✿ *${botname} eligió ›* ${botChoice}\n✿ *${monedas} ›* +¥${tieReward.toLocaleString()}` }, { quoted: m });
    }
    user.lastppt = Date.now() + 1 * 60 * 1000;
  }
};

const cmdRoulette = {
  command: ['rt', 'roulette'],
  category: 'economia', desc: 'Ruleta de apuestas.', economy: true,
  run: async (client, m, args, usedPrefix) => {
    const currency = getBotCurrency(client);
    const user = global.db.data.users[m.sender];
    if (args.length < 2) return m.reply(` Debes ingresar una cantidad de ${currency} y apostar a un color.`);
    let amount, color;
    if (!isNaN(parseInt(args[0]))) { amount = parseInt(args[0]); color = args[1].toLowerCase(); }
    else if (!isNaN(parseInt(args[1]))) { color = args[0].toLowerCase(); amount = parseInt(args[1]); }
    else return m.reply(` Formato inválido. Ejemplo: *rt 2000 black* o *rt black 2000*`);
    const validColors = ['red', 'black', 'green'];
    if (isNaN(amount) || amount < 200) return m.reply(` La cantidad mínima de ${currency} a apostar es 200.`);
    if (!validColors.includes(color)) return m.reply(` Por favor, elige un color válido: red, black, green.`);
    if ((user.coins || 0) < amount) return m.reply(` No tienes suficientes *${currency}* para hacer esta apuesta.`);
    const resultColor = validColors[Math.floor(Math.random() * validColors.length)];
    if (resultColor === color) {
      const reward = amount * (resultColor === 'green' ? 14 : 2);
      user.coins = (user.coins || 0) + reward;
      await client.sendMessage(m.chat, { text: `「✿」 La ruleta salió en *${resultColor}* y has ganado *¥${reward.toLocaleString()} ${currency}*.`, mentions: [m.sender] }, { quoted: m });
    } else {
      user.coins = (user.coins || 0) - amount;
      await client.sendMessage(m.chat, { text: `「✿」 La ruleta salió en *${resultColor}* y has perdido *¥${amount.toLocaleString()} ${currency}*.`, mentions: [m.sender] }, { quoted: m });
    }
  }
};

const cmdSlots = {
  command: ['slot'],
  category: 'economia', desc: 'Máquina tragamonedas.', economy: true,
  run: async (client, m, args, usedPrefix, command) => {
    const currency = getBotCurrency(client);
    const user = global.db.data.users[m.sender];
    user.lastslot ??= 0;
    if (!args[0] || isNaN(args[0]) || parseInt(args[0]) <= 0) return m.reply(`Por favor, ingresa la cantidad que deseas apostar.`);
    const apuesta = parseInt(args[0]);
    if (Date.now() - user.lastslot < 30000) return m.reply(`Debes esperar *${formatTime(user.lastslot + 30000 - Date.now())}* para usar *${usedPrefix + command}* nuevamente.`);
    if (apuesta < 100) return m.reply(`El mínimo para apostar es de 100 *${currency}*.`);
    if ((user.coins || 0) < apuesta) return m.reply(`Tus *${currency}* no son suficientes para apostar esa cantidad.`);
    const emojis = ['✾', '❃', '❁'];
    const getRandomEmojis = () => ({
      x: Array.from({ length: 3 }, () => emojis[Math.floor(Math.random() * emojis.length)]),
      y: Array.from({ length: 3 }, () => emojis[Math.floor(Math.random() * emojis.length)]),
      z: Array.from({ length: 3 }, () => emojis[Math.floor(Math.random() * emojis.length)])
    });
    const initialText = '「✿」| *SLOTS* \n────────\n';
    let { key } = await client.sendMessage(m.chat, { text: initialText }, { quoted: m });
    for (let i = 0; i < 5; i++) {
      const { x, y, z } = getRandomEmojis();
      await client.sendMessage(m.chat, { text: `「✿」| *SLOTS* \n────────\n${x[0]} : ${y[0]} : ${z[0]}\n${x[1]} : ${y[1]} : ${z[1]}\n${x[2]} : ${y[2]} : ${z[2]}\n────────`, edit: key }, { quoted: m });
      await delay(300);
    }
    const { x, y, z } = getRandomEmojis();
    let resultado;
    if (x[0] === y[0] && y[0] === z[0]) {
      resultado = `Ganaste! *¥${(apuesta * 2).toLocaleString()} ${currency}*.`;
      user.coins = (user.coins || 0) + apuesta;
    } else if (x[0] === y[0] || x[0] === z[0] || y[0] === z[0]) {
      resultado = `Casi lo logras. *Toma ¥10 ${currency}* por intentarlo.`;
      user.coins = (user.coins || 0) + 10;
    } else {
      resultado = `Perdiste *¥${apuesta.toLocaleString()} ${currency}*.`;
      user.coins = (user.coins || 0) - apuesta;
    }
    user.lastslot = Date.now();
    await client.sendMessage(m.chat, { text: `「✿」| *SLOTS* \n────────\n${x[0]} : ${y[0]} : ${z[0]}\n${x[1]} : ${y[1]} : ${z[1]}\n${x[2]} : ${y[2]} : ${z[2]}\n────────\n${resultado}`, edit: key }, { quoted: m });
  }
};

export default [cmdCasino, cmdCoinFlip, cmdPtt, cmdRoulette, cmdSlots];
