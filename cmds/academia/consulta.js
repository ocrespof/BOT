/**
 * 📚 consulta.js — Comandos de consulta lexicográfica, enciclopédica, frases célebres y sorteos.
 * Reúne: def, wiki, frase, ruleta
 */
import { getAIResponse } from '../../utils/ai.js';
import { translate } from '../../utils/tools.js';

const cmdDef = {
  command: ['def', 'significado', 'diccionario'],
  category: 'academia', desc: 'Diccionario virtual.',
  run: async (client, m, args, usedPrefix, command) => {
    let text = args.join(' ').trim();
    if (m.quoted && m.quoted.text) text = m.quoted.text;
    if (!text) return m.reply(` Escribe o cita la palabra que deseas buscar.\n*Ejemplo:* ${usedPrefix + command} Hipotenusa`);
    
    try {
      await m.react('📖');
      const logic = "Actúa como un lexicógrafo de la Real Academia Española con rigor absoluto. Formato obligatorio para cada palabra: 1. Categoría gramatical (sustantivo, verbo, adjetivo, etc. con género y número). 2. Definición principal exacta y concisa. 3. Etimología (latín, griego, árabe, etc.) si es verificable. 4. Un ejemplo de uso en contexto académico. No agregues comentarios conversacionales, emojis ni saludos. Devuelve únicamente la entrada lexicográfica.";
      
      const responseText = await getAIResponse({ content: text, prompt: logic, user: m.sender });
      if (!responseText) throw new Error("Vacio");
      
      let titulo = text.length > 25 ? "CONCEPTO" : text;
      await client.sendMessage(m.chat, { text: `*📕 DICCIONARIO: ${titulo.toUpperCase()}*\n\n${responseText.trim()}` }, { quoted: m });
      await m.react('✅');
    } catch (e) {
      await m.react('❌');
      m.reply(` Error al buscar la definición. Verifica la conexión o intenta más tarde.`);
    }
  }
};

const cmdWiki = {
  command: ['wiki', 'wikipedia'],
  category: 'academia', desc: 'Búsqueda en Wikipedia.',
  run: async (client, m, args, usedPrefix, command, text) => {
    if (!text) return m.reply(` Escribe qué deseas buscar.\n*Ejemplo:* ${usedPrefix + command} Segunda Guerra Mundial`);
    try {
      m.react('⏳');
      const api = `https://es.wikipedia.org/w/api.php?format=json&action=query&prop=extracts&exintro&explaintext&redirects=1&titles=${encodeURIComponent(text)}`;
      const req = await fetch(api);
      const res = await req.json();
      const pages = res.query.pages;
      const pageId = Object.keys(pages)[0];
      if (pageId === '-1') return m.reply(` No se encontró ningún artículo para: *${text}*`);
      const extract = pages[pageId].extract;
      const title = pages[pageId].title;
      const responseText = `*📚 WIKIPEDIA: ${title}*\n\n${extract}`;
      await client.sendMessage(m.chat, { text: responseText }, { quoted: m });
      m.react('✅');
    } catch (e) {
      m.react('❌');
      m.reply(' Error al comunicarse con Wikipedia.');
    }
  }
};

const cmdFrase = {
  command: ['frase', 'motivacion'],
  category: 'academia', desc: 'Frase motivacional.',
  run: async (client, m) => {
    try {
      m.react('💡');
      const res = await fetch('https://zenquotes.io/api/random');
      const json = await res.json();
      
      if (!json || !json[0] || !json[0].q) throw new Error("API err");
      
      const enQuote = json[0].q;
      const author = json[0].a;
      const translatedText = await translate(enQuote, 'es', 'en');
      const finalMsg = `*🎓 FRASE DEL DÍA*\n\n"${translatedText}"\n\n— _${author}_`;
      
      await client.sendMessage(m.chat, { text: finalMsg }, { quoted: m });
      m.react('✅');
    } catch (e) {
      m.react('❌');
      m.reply(` Ups, no pude traer una frase en este momento.`);
    }
  }
};

const cmdRuleta = {
  command: ['ruleta', 'sorteo', 'asignar'],
  category: 'academia', desc: 'Selector al azar.',
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
};

export default [cmdDef, cmdWiki, cmdFrase, cmdRuleta];
