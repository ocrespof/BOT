export default {
  command: ['ruleta', 'sorteo', 'asignar'],
  category: 'academia',
  desc: 'Selector al azar.',
  run: async (client, m, args, usedPrefix, command) => {
    const text = args.join(' ').trim();
    if (!text.includes('|')) {
      return m.reply(` Formato incorrecto. Debes usar el símbolo "|" para separar estudiantes de los temas.\n*Ejemplo:* ${usedPrefix + command} Juan, Ana, Pedro | Fotosíntesis, Células, Ecosistemas`);
    }

    try {
      m.react('🎲');
      let parts = text.split('|');
      let estudiantesCrudo = parts[0].trim();
      let temasCrudo = parts.slice(1).join('|').trim();

      if (!estudiantesCrudo || !temasCrudo) {
         return m.reply(` Asegúrate de incluir texto en ambos lados de la barrera "|".`);
      }

      let estudiantes = estudiantesCrudo.includes(',') 
        ? estudiantesCrudo.split(',').map(e => e.trim()).filter(e => e)
        : estudiantesCrudo.split(' ').map(e => e.trim()).filter(e => e);

      let temas = temasCrudo.split(',').map(t => t.trim()).filter(t => t);

      if (estudiantes.length === 0 || temas.length === 0) {
        return m.reply(` No se detectaron estudiantes o temas válidos.`);
      }

      for (let i = estudiantes.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [estudiantes[i], estudiantes[j]] = [estudiantes[j], estudiantes[i]];
      }
      
      for (let i = temas.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [temas[i], temas[j]] = [temas[j], temas[i]];
      }

      let txt = `*🎯 RULETA ACADÉMICA (RESULTADOS)*\n\n`;
      let t_index = 0;
      
      for(let e of estudiantes) {
        let temaAsignado = temas[t_index % temas.length]; 
        txt += `> 👤 ${e} ➔ 📚 *${temaAsignado}*\n`;
        t_index++;
      }

      await client.sendMessage(m.chat, { text: txt.trim() }, { quoted: m });
      m.react('✅');
    } catch (e) {
      m.react('❌');
      m.reply(` Ocurrió un error inesperado al sortear.`);
    }
  }
}
