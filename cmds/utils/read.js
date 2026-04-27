import { downloadContentFromMessage } from '@whiskeysockets/baileys'

export default {
  command: ['readviewonce', 'read', 'readvo', 'viewonce', 'vv'],
  category: 'tools',
  description: 'Re-send a view-once image or video.',
  usage: '.viewonce (responder a un mensaje de vista única)',
  run: async (client, m, args, usedPrefix, command) => {
    try {
      const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      
      // Sometimes it is nested inside viewOnceMessage
      const viewOnceMsg = quoted?.viewOnceMessage?.message || quoted?.viewOnceMessageV2?.message || quoted?.viewOnceMessageV2Extension?.message || quoted;

      const quotedImage = viewOnceMsg?.imageMessage;
      const quotedVideo = viewOnceMsg?.videoMessage;
      const quotedAudio = viewOnceMsg?.audioMessage;

      if (quotedImage && quotedImage.viewOnce) {
        const stream = await downloadContentFromMessage(quotedImage, 'image');
        let buffer = Buffer.from([]);
        for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
        await client.sendMessage(m.chat, {
          image: buffer,
          caption: quotedImage.caption || ''
        }, { quoted: m });
      }
      else if (quotedVideo && quotedVideo.viewOnce) {
        const stream = await downloadContentFromMessage(quotedVideo, 'video');
        let buffer = Buffer.from([]);
        for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
        await client.sendMessage(m.chat, {
          video: buffer,
          caption: quotedVideo.caption || '',
          mimetype: 'video/mp4'
        }, { quoted: m });
      }
      else if (quotedAudio && quotedAudio.viewOnce) {
        const stream = await downloadContentFromMessage(quotedAudio, 'audio');
        let buffer = Buffer.from([]);
        for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
        await client.sendMessage(m.chat, {
          audio: buffer,
          mimetype: 'audio/ogg; codecs=opus',
          ptt: quotedAudio.ptt || false
        }, { quoted: m });
      }
      else {
        await client.sendMessage(m.chat, {
          text: '《✧》 Por favor, responde a un mensaje de "Ver una vez" (ViewOnce).'
        }, { quoted: m });
      }

    } catch(error) {
      console.error('Error in viewonceCommand:', error);
      await client.sendMessage(m.chat, {
        text: '❌ Falló al recuperar el archivo multimedia. Inténtalo de nuevo más tarde.'
      }, { quoted: m });
    }
  }
}