/**
 * 📅 utils_productivity.js — Comandos de productividad, recordatorios y visualización ViewOnce.
 * Reúne: read, recordar
 */
import { downloadContentFromMessage } from '@whiskeysockets/baileys';

const cmdReadViewOnce = {
  command: ['readviewonce', 'read', 'readvo', 'viewonce', 'vv'],
  category: 'utils', desc: 'Ver mensaje ViewOnce.',
  description: 'Re-send a view-once image or video.',
  usage: '.viewonce (responder a un mensaje de vista única)',
  run: async (client, m) => {
    try {
      const quoted = m.quoted?.message || m.message?.extendedTextMessage?.contextInfo?.quotedMessage || m.quoted;
      const viewOnceMsg = quoted?.viewOnceMessage?.message || quoted?.viewOnceMessageV2?.message || quoted?.viewOnceMessageV2Extension?.message || quoted?.ephemeralMessage?.message || quoted;

      const quotedImage = viewOnceMsg?.imageMessage || (quoted?.imageMessage?.viewOnce ? quoted.imageMessage : null);
      const quotedVideo = viewOnceMsg?.videoMessage || (quoted?.videoMessage?.viewOnce ? quoted.videoMessage : null);
      const quotedAudio = viewOnceMsg?.audioMessage || (quoted?.audioMessage?.viewOnce ? quoted.audioMessage : null);

      if (quotedImage) {
        await m.react?.('🕒');
        const stream = await downloadContentFromMessage(quotedImage, 'image');
        let buffer = Buffer.from([]);
        for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
        await client.sendMessage(m.chat, {
          image: buffer,
          caption: quotedImage.caption || ''
        }, { quoted: m });
        await m.react?.('✔️');
      }
      else if (quotedVideo) {
        await m.react?.('🕒');
        const stream = await downloadContentFromMessage(quotedVideo, 'video');
        let buffer = Buffer.from([]);
        for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
        await client.sendMessage(m.chat, {
          video: buffer,
          caption: quotedVideo.caption || '',
          mimetype: quotedVideo.mimetype || 'video/mp4'
        }, { quoted: m });
        await m.react?.('✔️');
      }
      else if (quotedAudio) {
        await m.react?.('🕒');
        const stream = await downloadContentFromMessage(quotedAudio, 'audio');
        let buffer = Buffer.from([]);
        for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
        await client.sendMessage(m.chat, {
          audio: buffer,
          mimetype: quotedAudio.mimetype || 'audio/ogg; codecs=opus',
          ptt: quotedAudio.ptt || false
        }, { quoted: m });
        await m.react?.('✔️');
      }
      else {
        await client.sendMessage(m.chat, {
          text: '⚠️ Por favor, responde a un mensaje de "Ver una vez" (ViewOnce).'
        }, { quoted: m });
      }
    } catch(error) {
      console.error('Error in viewonceCommand:', error);
      await m.react?.('❌');
      await client.sendMessage(m.chat, {
        text: `❌ Falló al recuperar el archivo multimedia: ${error.message || error}`
      }, { quoted: m });
    }
  }
};

const cmdRecordar = {
  command: ['recordar', 'rec', 'remind'],
  category: 'utils', desc: 'Establecer recordatorios.',
  run: async (client, m, args, usedPrefix, command) => {
    const input = args.join(' ').trim();
    const dividerMatch = input.match(/\s*\|\s*/);
    
    if (!dividerMatch) {
        return m.reply(` Formato incorrecto. Usa el separador |\n*Ejemplo:* ${usedPrefix + command} 10 | sacar la basura`);
    }
    
    const [tiempoRaw, ...msgArr] = input.split(dividerMatch[0]);
    const mensaje = msgArr.join(dividerMatch[0]).trim();
    const minutos = parseFloat(tiempoRaw);
    
    if (isNaN(minutos) || minutos <= 0) return m.reply(` Por favor ingresa minutos válidos.\n*Ejemplo:* ${usedPrefix + command} 5 | apagar el horno`);
    if (minutos > 1440) return m.reply(` El tiempo límite es de 1440 minutos (24 horas).`);
    
    m.reply(`⏰ *Recordatorio Guardado*\n\nTe notificaré en *${minutos} minuto(s)* sobre:\n"${mensaje}"`);
    
    setTimeout(async () => {
      try {
        await client.sendMessage(m.chat, { 
          text: `⏰ *RECORDATORIO* ⏰\n\nHola @${m.sender.split('@')[0]}:\n\n*${mensaje}*`,
          mentions: [m.sender]
        });
      } catch (e) {}
    }, minutos * 60 * 1000);
  }
};

export default [cmdReadViewOnce, cmdRecordar];
