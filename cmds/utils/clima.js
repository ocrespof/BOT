import fetch from 'node-fetch';

export default {
  command: ['clima', 'weather'],
  category: 'utils',
  run: async (client, m, args, usedPrefix, command) => {
    const ciudad = args.join(' ').trim();
    if (!ciudad) return m.reply(`《✧》 Por favor ingresa el nombre de una ciudad.\n*Ejemplo:* ${usedPrefix + command} Bogotá`);
    
    try {
      m.react('🌤️');
      const req = await fetch(`https://wttr.in/${encodeURIComponent(ciudad)}?format=j1`);
      const res = await req.json();
      
      const current = res.current_condition[0];
      const name = res.nearest_area[0].areaName[0].value;
      const country = res.nearest_area[0].country[0].value;
      
      const temp = current.temp_C;
      const desc = current.lang_es ? current.lang_es[0].value : current.weatherDesc[0].value;
      const humidity = current.humidity;
      const wind = current.windspeedKmph;
      
      const txt = `*🌤️ CLIMA EN ${name.toUpperCase()} (${country})*\n\n` +
                  `> 🌡️ *Temperatura:* ${temp}°C\n` +
                  `> ☁️ *Condición:* ${desc}\n` +
                  `> 💧 *Humedad:* ${humidity}%\n` +
                  `> 💨 *Viento:* ${wind} km/h`;
                  
      await client.sendMessage(m.chat, { text: txt }, { quoted: m });
      m.react('✅');
    } catch (e) {
      m.react('❌');
      m.reply(`《✧》 No se pudo obtener el clima de *${ciudad}*. Verifica el nombre de la ciudad.`);
    }
  }
}
