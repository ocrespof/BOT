/**
 * 🔄 Trade — Intercambiar items únicos con otro jugador
 * Uso: .trade @usuario item_id
 */
import { RARE_MAP } from './shopData.js';
import { resolveLidToRealJid } from '../../core/utils.js';

export default {
  command: ['trade', 'tradear', 'intercambiar'],
  category: 'economia',
  economy: true,
  desc: 'Intercambia un item raro con otro jugador.',
  usage: '.trade @usuario <item_id>',
  cooldown: 10,
  run: async (client, m, args, usedPrefix, command) => {
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
