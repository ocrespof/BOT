export default {
  command: ['recordar', 'rec', 'remind'],
  category: 'utils',
  desc: 'Establecer recordatorios.',
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
      } catch (e) {} // Silent si el grupo ya no existe
    }, minutos * 60 * 1000);
  }
}
