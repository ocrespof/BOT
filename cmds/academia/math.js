import fetch from 'node-fetch';

export default {
  command: ['math', 'calcular'],
  category: 'academia',
  run: async (client, m, args, usedPrefix, command, text) => {
    if (!text) return m.reply(`《✧》 Ingresa una expresión matemática.\n*Ejemplo:* ${usedPrefix + command} 2 * (7 - 3)`);
    try {
      m.react('🔢');
      const val = text
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/pi/gi, 'Math.PI')
        .replace(/e/gi, 'Math.E');
      
      const req = await fetch(`http://api.mathjs.org/v4/?expr=${encodeURIComponent(val)}`);
      const res = await req.text();
      
      if (res.startsWith('Error')) return m.reply(`《✧》 Expresión inválida.\n*Detalle:* ${res}`);
      await m.reply(`*🔢 Resultado:* ${res}`);
    } catch (e) {
      m.reply(`《✧》 Error al resolver la expresión matemática.`);
    }
  }
};
