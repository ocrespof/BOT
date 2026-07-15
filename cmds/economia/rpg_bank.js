/**
 * 🏦 rpg_bank.js — Comandos de finanzas, banco y transferencias RPG.
 * Incluye: balance, deposit, withdraw, givecoins, trade
 */
import { getBotCurrency } from '../../utils/tools.js';
import { resolveLidToRealJid } from '../../core/utils.js';
import { RARE_MAP } from './rpg_shop.js';

const cmdBalance = {
  command: ['balance', 'bal', 'saldo', 'coins', 'money'],
  category: 'economia', desc: 'Ver tu saldo.', economy: true,
  run: async (client, m) => {
    const monedas = getBotCurrency(client);
    const user = global.db.data.users[m.sender];
    const coins = user.coins || 0;
    const bank = user.bank || 0;
    const total = coins + bank;
    const health = user.health ?? 100;
    const name = user.name || m.sender.split('@')[0];
    await client.sendMessage(m.chat, {
      text: `「✿」 *Balance de ${name}*\n\n🪙 Cartera › *¥${coins.toLocaleString()} ${monedas}*\n🏦 Banco › *¥${bank.toLocaleString()} ${monedas}*\n💰 Total › *¥${total.toLocaleString()} ${monedas}*\n❤️ Salud › *${health}/100*`
    }, { quoted: m });
  }
};

const cmdDeposit = {
  command: ['dep', 'deposit', 'd'],
  category: 'economia', desc: 'Depositar coins al banco.', economy: true,
  run: async (client, m, args) => {
    const monedas = getBotCurrency(client);
    const user = global.db.data.users[m.sender];
    if (!args[0]) return m.reply(` Ingresa la cantidad de *${monedas}* que quieras *depositar*.`);
    if (args[0].toLowerCase() === 'all') {
      if ((user.coins || 0) <= 0) return m.reply(`No tienes *${monedas}* para depositar en tu *banco*`);
      const count = user.coins;
      user.coins = 0;
      user.bank = (user.bank || 0) + count;
      return m.reply(`Has depositado *¥${count.toLocaleString()} ${monedas}* en tu Banco`);
    }
    const count = parseInt(args[0]);
    if (isNaN(count) || count < 1) return m.reply(' Ingresa una cantidad *válida* para depositar');
    if ((user.coins || 0) < count) return m.reply(`No tienes suficientes *${monedas}* para depositar`);
    user.coins -= count;
    user.bank = (user.bank || 0) + count;
    await m.reply(`Has depositado *¥${count.toLocaleString()} ${monedas}* en tu Banco`);
  }
};

const cmdWithdraw = {
  command: ['withdraw', 'with', 'retirar'],
  category: 'economia', desc: 'Retirar coins del banco.', economy: true,
  run: async (client, m, args, usedPrefix, command) => {
    const monedas = getBotCurrency(client);
    const user = global.db.data.users[m.sender];
    if (!args[0]) return m.reply(` Ingresa la cantidad de *${monedas}* que quieras retirar.`);
    if (args[0].toLowerCase() === 'all') {
      if ((user.bank || 0) <= 0) return m.reply(`No tienes suficientes *${monedas}* en tu Banco para poder retirar.`);
      const amount = user.bank;
      user.bank = 0;
      user.coins = (user.coins || 0) + amount;
      return m.reply(`Has retirado *¥${amount.toLocaleString()} ${monedas}* del banco, ahora podras usarlo pero tambien podran robartelo.`);
    }
    const count = parseInt(args[0]);
    if (isNaN(count) || count < 1) return m.reply(` Debes retirar una cantidad válida.\n > Ejemplo 1 *${usedPrefix + command} ¥25000*\nEjemplo 2 *${usedPrefix + command} all*`);
    if ((user.bank || 0) < count) return m.reply(` No tienes suficientes *${monedas}* en tu banco para retirar esa cantidad.\nSolo tienes *¥${(user.bank || 0).toLocaleString()} ${monedas}* en tu cuenta.`);
    user.bank -= count;
    user.coins = (user.coins || 0) + count;
    await m.reply(`Has retirado *¥${count.toLocaleString()} ${monedas}* del banco, ahora podras usarlo pero tambien podran robartelo.`);
  }
};

const cmdGiveCoins = {
  command: ['givecoins', 'pay', 'coinsgive'],
  category: 'economia', desc: 'Transferir coins a otro usuario.', economy: true, group: true,
  run: async (client, m, args, usedPrefix, command) => {
    const db = global.db.data;
    const monedas = getBotCurrency(client);
    const mentioned = m.mentionedJid || [];
    const who2 = m.quoted ? m.quoted.sender : mentioned[0] || (args[1] ? (args[1].replace(/[@ .+-]/g, '') + '@s.whatsapp.net') : '');
    if (!who2) return m.reply(`Debes mencionar a quien quieras transferir *${monedas}*.\nEjemplo *${usedPrefix + command} 25000 @mencion*`);
    const who = await resolveLidToRealJid(who2, client, m.chat);
    const senderData = db.users[m.sender];
    const targetData = db.users[who];
    if (!targetData) return m.reply(`El usuario mencionado no está registrado en el bot.`);
    const cantidadInput = args[0]?.toLowerCase();
    let cantidad = cantidadInput === 'all' ? (senderData.bank || 0) : parseInt(cantidadInput);
    if (!cantidadInput || isNaN(cantidad) || cantidad <= 0) return m.reply(`Ingresa una cantidad válida de *${monedas}* para transferir.`);
    if (typeof senderData.bank !== 'number') senderData.bank = 0;
    if (senderData.bank < cantidad) return m.reply(`No tienes suficientes *${monedas}* en el banco para transferir.\nTu saldo actual: *¥${senderData.bank.toLocaleString()} ${monedas}*`);
    senderData.bank -= cantidad;
    if (typeof targetData.bank !== 'number') targetData.bank = 0;
    targetData.bank += cantidad;
    let name = targetData.name || who.split('@')[0];
    await client.sendMessage(m.chat, { text: `Transferiste *¥${cantidad.toLocaleString()} ${monedas}* a *${name}*\nAhora tienes *¥${senderData.bank.toLocaleString()} ${monedas}* en tu banco.`, mentions: [who] }, { quoted: m });
  }
};

const cmdTrade = {
  command: ['trade', 'tradear', 'intercambiar'],
  category: 'economia', desc: 'Intercambia un item raro con otro jugador.', economy: true,
  usage: '.trade @usuario <item_id>', cooldown: 10,
  run: async (client, m, args, usedPrefix) => {
    const mentioned = m.mentionedJid || [];
    const who2 = mentioned[0] || (m.quoted ? m.quoted.sender : null);
    if (!who2) return m.reply(`❌ Menciona al usuario con quien quieres intercambiar.\n\n*Uso:* \`${usedPrefix}trade @usuario item_id\``);
    
    const target = await resolveLidToRealJid(who2, client, m.chat);
    if (target === m.sender) return m.reply('❌ No puedes tradearte contigo mismo.');

    const itemId = args.find(a => !a.startsWith('@'))?.toLowerCase();
    if (!itemId) return m.reply(`❌ Especifica el ID del item a tradear.\n\n*Uso:* \`${usedPrefix}trade @usuario gema_dragon\``);

    const db = global.db.data;
    const sender = db.users[m.sender] ||= {};
    const receiver = db.users[target];
    
    if (!receiver) return m.reply('❌ Ese usuario no está registrado en el bot.');

    if (!sender.inventory) sender.inventory = [];
    if (!receiver.inventory) receiver.inventory = [];

    const idx = sender.inventory.indexOf(itemId);
    if (idx === -1) return m.reply(`❌ No tienes \`${itemId}\` en tu inventario.`);

    const rareItem = RARE_MAP.get(itemId);
    if (!rareItem) return m.reply(`❌ Solo puedes tradear items raros (obtenidos de lootboxes). Los items de tienda no son tradeables.`);

    // Transfer the item
    sender.inventory.splice(idx, 1);
    receiver.inventory.push(itemId);

    const senderName = sender.name || m.sender.split('@')[0];
    const receiverName = receiver.name || target.split('@')[0];

    await client.sendMessage(m.chat, {
      text: `🔄 *TRADEO COMPLETADO* 🔄\n\n*${senderName}* le ha dado *${rareItem.name}* a *${receiverName}*.\n\n_${rareItem.desc}_`,
      mentions: [m.sender, target]
    }, { quoted: m });
  }
};

const cmdEconomyBoard = {
  command: ['economyboard', 'eboard', 'baltop'],
  category: 'economia', desc: 'Ranking de riqueza.', economy: true,
  run: async (client, m, args, usedPrefix, command) => {
    const monedas = getBotCurrency(client);
    try {
      const users = Object.entries(global.db.data.users || {}).filter(([_, data]) => {
        const total = (data.coins || 0) + (data.bank || 0);
        return total >= 1000;
      }).map(([key, data]) => {
        const name = data.name || 'Usuario';
        return { ...data, jid: key, name };
      });
      if (users.length === 0) return m.reply(`No hay usuarios con más de 1,000 ${monedas}.`);
      const sorted = users.sort((a, b) => (b.coins || 0) + (b.bank || 0) - ((a.coins || 0) + (a.bank || 0)));
      const page = parseInt(args[0]) || 1;
      const pageSize = 10;
      const totalPages = Math.ceil(sorted.length / pageSize);
      if (isNaN(page) || page < 1 || page > totalPages) return m.reply(` La página *${page}* no existe. Hay *${totalPages}* páginas.`);
      const start = (page - 1) * pageSize;
      let text = `*✩ EconomyBoard (✿◡‿◡)*\n\n`;
      text += sorted.slice(start, start + pageSize).map(({ name, coins, bank }, i) => {
        const total = (coins || 0) + (bank || 0);
        return `✩ ${start + i + 1} › *${name}*\n     Total → *¥${total.toLocaleString()} ${monedas}*`;
      }).join('\n');
      text += `\n\n⌦ Página *${page}* de *${totalPages}*`;
      if (page < totalPages) text += `\nPara ver la siguiente página › *${usedPrefix + command} ${page + 1}*`;
      await client.sendMessage(m.chat, { text }, { quoted: m });
    } catch (e) {
      await m.reply(`> Error al ejecutar el comando.\n[Error: *${e.message}*]`);
    }
  }
};

export default [cmdBalance, cmdDeposit, cmdWithdraw, cmdGiveCoins, cmdTrade, cmdEconomyBoard];
