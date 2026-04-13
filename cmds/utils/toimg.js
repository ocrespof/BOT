import fs from 'fs';
import FormData from 'form-data';
import fetch from 'node-fetch';

const TIMEOUT = 15000;

async function webp2mp4(source) {
  let form = new FormData();
  let isUrl = typeof source === 'string' && /https?:\/\//.test(source);
  form.append('new-image-url', isUrl ? source : '');
  form.append('new-image', source, { filename: 'image.webp' });  
  let res = await fetch('https://ezgif.com/webp-to-mp4', { method: 'POST', body: form, timeout: TIMEOUT });  
  let html = await res.text();
  
  let form2 = new FormData();
  let obj = {};  
  const inputMatches = [...html.matchAll(/<input[^>]+name="([^"]+)"[^>]+value="([^"]*)"/gi)];
  for (const match of inputMatches) {
    obj[match[1]] = match[2];
    form2.append(match[1], match[2]);
  }
  
  let res2 = await fetch('https://ezgif.com/webp-to-mp4/' + obj.file, { method: 'POST', body: form2, timeout: TIMEOUT });  
  let html2 = await res2.text();
  
  const videoMatch = html2.match(/<source[^>]+src="([^"]+)"/i);
  if (!videoMatch) throw new Error("No se pudo obtener el video animado en Ezgif.");
  const videoUrl = new URL(videoMatch[1], res2.url).toString();  
  let videoRes = await fetch(videoUrl, { timeout: TIMEOUT });
  return await videoRes.buffer();
}

async function webp2png(source) {
  let form = new FormData();
  let isUrl = typeof source === 'string' && /https?:\/\//.test(source);
  form.append('new-image-url', isUrl ? source : '');
  form.append('new-image', source, { filename: 'image.webp' });  
  let res = await fetch('https://ezgif.com/webp-to-png', { method: 'POST', body: form, timeout: TIMEOUT });  
  let html = await res.text();
  
  let form2 = new FormData();
  let obj = {};  
  const inputMatches = [...html.matchAll(/<input[^>]+name="([^"]+)"[^>]+value="([^"]*)"/gi)];
  for (const match of inputMatches) {
    obj[match[1]] = match[2];
    form2.append(match[1], match[2]);
  }
  
  let res2 = await fetch('https://ezgif.com/webp-to-png/' + obj.file, { method: 'POST', body: form2, timeout: TIMEOUT });  
  let html2 = await res2.text();
  
  const imgMatch = html2.match(/<img[^>]+id="output"[^>]*src="([^"]+)"/i) || html2.match(/<p class="outfile">\s*<img src="([^"]+)"/i) || html2.match(/src="([^"]+)"/i);
  if (!imgMatch) throw new Error("No se pudo obtener la imagen PNG en Ezgif.");
  // Ezgif image paths are relative, or start with /
  let pathRaw = imgMatch[1];
  const imgUrl = new URL(pathRaw, res2.url).toString();  
  let imgRes = await fetch(imgUrl, { timeout: TIMEOUT });
  return await imgRes.buffer();
}

export default {
  command: ['toimg', 'toimage'],
  category: 'tools',
  run: async (client, m, args, usedPrefix, command, text) => {
    if (!m.quoted) {
      return client.reply(m.chat, `《✧》 Debes citar un sticker para convertir.`, m);
    }    
    await m.react('🕒');    
    try {
      const quoted = m.quoted;
      const buffer = await quoted.download();      
      if (!buffer) {
        await m.react('✖️');
        return client.reply(m.chat, `《✧》 No se pudo descargar el sticker internamente.`, m);
      }      
      const isAnimated = quoted.msg && quoted.msg.isAnimated;      
      if (isAnimated) {
        const mp4Buffer = await webp2mp4(buffer);
        await client.sendMessage(m.chat, { video: mp4Buffer, caption: 'ꕥ *Aquí tienes ฅ^•ﻌ•^ฅ*', gifPlayback: true }, { quoted: m });
      } else {
        const pngBuffer = await webp2png(buffer);
        await client.sendMessage(m.chat, { image: pngBuffer, caption: 'ꕥ *Aquí tienes ฅ^•ﻌ•^ฅ*' }, { quoted: m });
      }      
      await m.react('✔️');
    } catch (error) {
      await m.react('✖️');
      client.reply(m.chat, `《✧》 Error al comunicarse con el servidor (Timeout/RAM).\n> Info: ${error.message}`, m);
    }
  }
};