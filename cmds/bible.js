/**
 * BibleBot — Interceptor de versículos bíblicos
 * Detecta referencias como "Mateo 3:12-14", "Juan 3:16", "Genesis 1:1"
 * y responde automáticamente con el texto de la Reina-Valera (1909).
 * 
 * API: https://query.getbible.net/v2/
 * Traducción: rv1858 (Reina-Valera 1909, dominio público)
 */

import axios from 'axios';

// Nombres en español con variaciones comunes
const BOOK_ALIASES = {
  // Antiguo Testamento
  'genesis': 'Genesis', 'gen': 'Genesis', 'gn': 'Genesis', 'gén': 'Genesis',
  'exodo': 'Exodus', 'éxodo': 'Exodus', 'ex': 'Exodus',
  'levitico': 'Leviticus', 'levítico': 'Leviticus', 'lv': 'Leviticus', 'lev': 'Leviticus',
  'numeros': 'Numbers', 'números': 'Numbers', 'nm': 'Numbers', 'num': 'Numbers',
  'deuteronomio': 'Deuteronomy', 'dt': 'Deuteronomy', 'deut': 'Deuteronomy',
  'josue': 'Joshua', 'josué': 'Joshua', 'jos': 'Joshua',
  'jueces': 'Judges', 'jue': 'Judges', 'jc': 'Judges',
  'rut': 'Ruth', 'rt': 'Ruth',
  '1 samuel': '1 Samuel', '1samuel': '1 Samuel', '1sam': '1 Samuel', '1 sam': '1 Samuel',
  '2 samuel': '2 Samuel', '2samuel': '2 Samuel', '2sam': '2 Samuel', '2 sam': '2 Samuel',
  '1 reyes': '1 Kings', '1reyes': '1 Kings', '1rey': '1 Kings', '1 rey': '1 Kings',
  '2 reyes': '2 Kings', '2reyes': '2 Kings', '2rey': '2 Kings', '2 rey': '2 Kings',
  '1 cronicas': '1 Chronicles', '1cronicas': '1 Chronicles', '1 crónicas': '1 Chronicles', '1crónicas': '1 Chronicles', '1cr': '1 Chronicles', '1 cr': '1 Chronicles',
  '2 cronicas': '2 Chronicles', '2cronicas': '2 Chronicles', '2 crónicas': '2 Chronicles', '2crónicas': '2 Chronicles', '2cr': '2 Chronicles', '2 cr': '2 Chronicles',
  'esdras': 'Ezra', 'esd': 'Ezra',
  'nehemias': 'Nehemiah', 'nehemías': 'Nehemiah', 'neh': 'Nehemiah',
  'ester': 'Esther', 'est': 'Esther',
  'job': 'Job',
  'salmos': 'Psalms', 'salmo': 'Psalms', 'sal': 'Psalms', 'sl': 'Psalms',
  'proverbios': 'Proverbs', 'prov': 'Proverbs', 'pr': 'Proverbs',
  'eclesiastes': 'Ecclesiastes', 'eclesiastés': 'Ecclesiastes', 'ecl': 'Ecclesiastes', 'ec': 'Ecclesiastes',
  'cantares': 'Song of Solomon', 'cantar': 'Song of Solomon', 'cnt': 'Song of Solomon', 'ct': 'Song of Solomon', 'cantar de los cantares': 'Song of Solomon',
  'isaias': 'Isaiah', 'isaías': 'Isaiah', 'is': 'Isaiah',
  'jeremias': 'Jeremiah', 'jeremías': 'Jeremiah', 'jer': 'Jeremiah', 'jr': 'Jeremiah',
  'lamentaciones': 'Lamentations', 'lam': 'Lamentations',
  'ezequiel': 'Ezekiel', 'ez': 'Ezekiel',
  'daniel': 'Daniel', 'dn': 'Daniel', 'dan': 'Daniel',
  'oseas': 'Hosea', 'os': 'Hosea',
  'joel': 'Joel', 'jl': 'Joel',
  'amos': 'Amos', 'amós': 'Amos', 'am': 'Amos',
  'abdias': 'Obadiah', 'abdías': 'Obadiah', 'abd': 'Obadiah',
  'jonas': 'Jonah', 'jonás': 'Jonah', 'jon': 'Jonah',
  'miqueas': 'Micah', 'miq': 'Micah', 'mi': 'Micah',
  'nahum': 'Nahum', 'nahúm': 'Nahum', 'nah': 'Nahum',
  'habacuc': 'Habakkuk', 'hab': 'Habakkuk',
  'sofonias': 'Zephaniah', 'sofonías': 'Zephaniah', 'sof': 'Zephaniah',
  'hageo': 'Haggai', 'hag': 'Haggai',
  'zacarias': 'Zechariah', 'zacarías': 'Zechariah', 'zac': 'Zechariah',
  'malaquias': 'Malachi', 'malaquías': 'Malachi', 'mal': 'Malachi',
  // Nuevo Testamento
  'mateo': 'Matthew', 'mt': 'Matthew', 'mat': 'Matthew',
  'marcos': 'Mark', 'mr': 'Mark', 'mc': 'Mark', 'mar': 'Mark',
  'lucas': 'Luke', 'lc': 'Luke', 'luc': 'Luke',
  'juan': 'John', 'jn': 'John',
  'hechos': 'Acts', 'hch': 'Acts', 'hec': 'Acts',
  'romanos': 'Romans', 'ro': 'Romans', 'rom': 'Romans',
  '1 corintios': '1 Corinthians', '1corintios': '1 Corinthians', '1cor': '1 Corinthians', '1 cor': '1 Corinthians', '1co': '1 Corinthians',
  '2 corintios': '2 Corinthians', '2corintios': '2 Corinthians', '2cor': '2 Corinthians', '2 cor': '2 Corinthians', '2co': '2 Corinthians',
  'galatas': 'Galatians', 'gálatas': 'Galatians', 'gal': 'Galatians', 'gl': 'Galatians',
  'efesios': 'Ephesians', 'ef': 'Ephesians',
  'filipenses': 'Philippians', 'fil': 'Philippians', 'flp': 'Philippians',
  'colosenses': 'Colossians', 'col': 'Colossians',
  '1 tesalonicenses': '1 Thessalonians', '1tesalonicenses': '1 Thessalonians', '1tes': '1 Thessalonians', '1 tes': '1 Thessalonians', '1ts': '1 Thessalonians',
  '2 tesalonicenses': '2 Thessalonians', '2tesalonicenses': '2 Thessalonians', '2tes': '2 Thessalonians', '2 tes': '2 Thessalonians', '2ts': '2 Thessalonians',
  '1 timoteo': '1 Timothy', '1timoteo': '1 Timothy', '1tim': '1 Timothy', '1 tim': '1 Timothy', '1ti': '1 Timothy',
  '2 timoteo': '2 Timothy', '2timoteo': '2 Timothy', '2tim': '2 Timothy', '2 tim': '2 Timothy', '2ti': '2 Timothy',
  'tito': 'Titus', 'tit': 'Titus',
  'filemon': 'Philemon', 'filemón': 'Philemon', 'flm': 'Philemon',
  'hebreos': 'Hebrews', 'heb': 'Hebrews', 'he': 'Hebrews',
  'santiago': 'James', 'stg': 'James', 'stgo': 'James',
  '1 pedro': '1 Peter', '1pedro': '1 Peter', '1pe': '1 Peter', '1 pe': '1 Peter', '1p': '1 Peter',
  '2 pedro': '2 Peter', '2pedro': '2 Peter', '2pe': '2 Peter', '2 pe': '2 Peter', '2p': '2 Peter',
  '1 juan': '1 John', '1juan': '1 John', '1jn': '1 John', '1 jn': '1 John',
  '2 juan': '2 John', '2juan': '2 John', '2jn': '2 John', '2 jn': '2 John',
  '3 juan': '3 John', '3juan': '3 John', '3jn': '3 John', '3 jn': '3 John',
  'judas': 'Jude', 'jud': 'Jude',
  'apocalipsis': 'Revelation', 'ap': 'Revelation', 'apoc': 'Revelation',
  // English names also accepted
  'genesis': 'Genesis', 'exodus': 'Exodus', 'leviticus': 'Leviticus',
  'numbers': 'Numbers', 'deuteronomy': 'Deuteronomy', 'joshua': 'Joshua',
  'judges': 'Judges', 'ruth': 'Ruth', 'psalms': 'Psalms', 'psalm': 'Psalms',
  'proverbs': 'Proverbs', 'isaiah': 'Isaiah', 'jeremiah': 'Jeremiah',
  'ezekiel': 'Ezekiel', 'hosea': 'Hosea', 'amos': 'Amos',
  'obadiah': 'Obadiah', 'jonah': 'Jonah', 'micah': 'Micah',
  'nahum': 'Nahum', 'habakkuk': 'Habakkuk', 'zephaniah': 'Zephaniah',
  'haggai': 'Haggai', 'zechariah': 'Zechariah', 'malachi': 'Malachi',
  'matthew': 'Matthew', 'mark': 'Mark', 'luke': 'Luke', 'john': 'John',
  'acts': 'Acts', 'romans': 'Romans', 'galatians': 'Galatians',
  'ephesians': 'Ephesians', 'philippians': 'Philippians', 'colossians': 'Colossians',
  'titus': 'Titus', 'philemon': 'Philemon', 'hebrews': 'Hebrews',
  'revelation': 'Revelation',
};

// Traducción al español para mostrar en el mensaje
const SPANISH_NAMES = {
  'Genesis': 'Génesis', 'Exodus': 'Éxodo', 'Leviticus': 'Levítico', 'Numbers': 'Números',
  'Deuteronomy': 'Deuteronomio', 'Joshua': 'Josué', 'Judges': 'Jueces', 'Ruth': 'Rut',
  '1 Samuel': '1 Samuel', '2 Samuel': '2 Samuel', '1 Kings': '1 Reyes', '2 Kings': '2 Reyes',
  '1 Chronicles': '1 Crónicas', '2 Chronicles': '2 Crónicas', 'Ezra': 'Esdras', 'Nehemiah': 'Nehemías',
  'Esther': 'Ester', 'Job': 'Job', 'Psalms': 'Salmos', 'Proverbs': 'Proverbios',
  'Ecclesiastes': 'Eclesiastés', 'Song of Solomon': 'Cantares', 'Isaiah': 'Isaías', 'Jeremiah': 'Jeremías',
  'Lamentations': 'Lamentaciones', 'Ezekiel': 'Ezequiel', 'Daniel': 'Daniel', 'Hosea': 'Oseas',
  'Joel': 'Joel', 'Amos': 'Amós', 'Obadiah': 'Abdías', 'Jonah': 'Jonás', 'Micah': 'Miqueas',
  'Nahum': 'Nahúm', 'Habakkuk': 'Habacuc', 'Zephaniah': 'Sofonías', 'Haggai': 'Hageo',
  'Zechariah': 'Zacarías', 'Malachi': 'Malaquías', 'Matthew': 'Mateo', 'Mark': 'Marcos',
  'Luke': 'Lucas', 'John': 'Juan', 'Acts': 'Hechos', 'Romans': 'Romanos', '1 Corinthians': '1 Corintios',
  '2 Corinthians': '2 Corintios', 'Galatians': 'Gálatas', 'Ephesians': 'Efesios', 'Philippians': 'Filipenses',
  'Colossians': 'Colosenses', '1 Thessalonians': '1 Tesalonicenses', '2 Thessalonians': '2 Tesalonicenses',
  '1 Timothy': '1 Timoteo', '2 Timothy': '2 Timoteo', 'Titus': 'Tito', 'Philemon': 'Filemón',
  'Hebrews': 'Hebreos', 'James': 'Santiago', '1 Peter': '1 Pedro', '2 Peter': '2 Pedro',
  '1 John': '1 Juan', '2 John': '2 Juan', '3 John': '3 Juan', 'Jude': 'Judas', 'Revelation': 'Apocalipsis'
};

// Regex para detectar referencias bíblicas en un mensaje
// Soporta: "Mateo 3:16", "1 Juan 3:16-18", "Gn 1:1", "Sal 23:1-6", "Ap 21:4"
// El patrón exige al menos libro + capítulo:versículo
const BIBLE_REF_REGEX = /(?:^|\s)((?:[123]\s?)?(?:[A-ZÁÉÍÓÚÑa-záéíóúñ]{2,20}))\s+(\d{1,3})\s*[:]\s*(\d{1,3})(?:\s*[-]\s*(\d{1,3}))?(?=\s|$|[.,;!?)])/gi;

/**
 * Extrae todas las referencias bíblicas de un texto.
 * @returns {Array<{book: string, chapter: number, verseStart: number, verseEnd: number|null, original: string}>}
 */
function extractReferences(text) {
  if (!text || text.length < 4) return [];
  const refs = [];
  let match;
  BIBLE_REF_REGEX.lastIndex = 0;
  
  while ((match = BIBLE_REF_REGEX.exec(text)) !== null) {
    const rawBook = match[1].trim();
    const chapter = parseInt(match[2]);
    const verseStart = parseInt(match[3]);
    const verseEnd = match[4] ? parseInt(match[4]) : null;
    
    // Normalizar el nombre del libro
    const normalized = rawBook.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const alsoWithAccents = rawBook.toLowerCase();
    
    // Buscar en el mapa de alias
    const apiBookName = BOOK_ALIASES[alsoWithAccents] || BOOK_ALIASES[normalized];
    if (!apiBookName) continue;
    
    // Validación básica
    if (chapter < 1 || chapter > 150) continue;
    if (verseStart < 1 || verseStart > 176) continue;
    if (verseEnd && (verseEnd < verseStart || verseEnd > 176)) continue;
    
    refs.push({
      book: apiBookName,
      chapter,
      verseStart,
      verseEnd,
      original: match[0].trim()
    });
  }
  return refs;
}

/**
 * Consulta la API de Midvash y retorna los versículos formateados en NVI.
 */
async function fetchVerses(ref) {
  const verseRange = ref.verseEnd 
    ? `${ref.verseStart}-${ref.verseEnd}` 
    : `${ref.verseStart}`;
    
  // Convertir a formato de slug para Midvash (ej: "1 John" -> "1-john")
  const bookParam = ref.book.toLowerCase().replace(/\s+/g, '-');
  const url = `https://api.midvash.com/v1/nvies/${bookParam}/${ref.chapter}/${verseRange}`;
  
  const { data: response } = await axios.get(url, { timeout: 10000 });
  
  if (!response || !response.data || !response.data.verses || response.data.verses.length === 0) return null;
  
  const result = response.data;
  const bookName = SPANISH_NAMES[ref.book] || ref.book;
  
  // Formatear los versículos
  let formatted = `📖 *${bookName} ${result.chapter}:${verseRange}*\n`;
  formatted += `_Nueva Versión Internacional (NVI)_\n\n`;
  
  let currentVerse = result.verse;
  for (const text of result.verses) {
    const cleanText = text.replace(/\s+/g, ' ').trim();
    formatted += `*${currentVerse}.* ${cleanText}\n`;
    currentVerse++;
  }
  
  return formatted.trim();
}

// ═══════════════════════════════════════════
// Plugin: before hook (interceptor pasivo)
// ═══════════════════════════════════════════

export default {
  command: ['bible', 'biblia'],
  category: 'utils',
  desc: 'Activa o desactiva la detección automática de versículos bíblicos en el grupo.',
  isAdmin: true,

  async run(client, m, args, usedPrefix, command) {
    const chat = global.db.data.chats[m.chat] ||= {};
    if (args[0] === 'on') {
      chat.bible = true;
      return m.reply('📖 *BibleBot activado.*\nEscribe una referencia como _Mateo 3:16_ y el bot responderá con el versículo.');
    } else if (args[0] === 'off') {
      chat.bible = false;
      return m.reply('📖 *BibleBot desactivado* en este grupo.');
    }
    const status = chat.bible !== false ? '✅ Activado' : '❌ Desactivado';
    return m.reply(`📖 *BibleBot* — ${status}\n\nUso:\n*${usedPrefix}${command} on* — Activar\n*${usedPrefix}${command} off* — Desactivar\n\n_Escribe una referencia como_ *Juan 3:16* _para ver el versículo._`);
  }
};

// ═══════════════════════════════════════════
// Before hook: interceptor pasivo de versículos
// ═══════════════════════════════════════════

export async function before(client, m) {
  if (!m.text || m.text.length < 5) return false;

  // Verificar si el feature está habilitado en el chat
  const chat = global.db.data.chats[m.chat];
  if (chat && chat.bible === false) return false;

  // Extraer referencias
  const refs = extractReferences(m.text);
  if (refs.length === 0) return false;

  // Limitar a 3 referencias por mensaje para evitar spam
  const limitedRefs = refs.slice(0, 3);

  try {
    const results = [];
    for (const ref of limitedRefs) {
      const text = await fetchVerses(ref).catch(() => null);
      if (text) results.push(text);
    }

    if (results.length === 0) return false;

    const response = results.join('\n\n───────────────\n\n');
    await client.sendMessage(m.chat, { text: response }, { quoted: m });
  } catch {
    // Silenciar errores — no interrumpir el flujo del bot
  }

  return false; // No interceptar — permite que otros plugins y comandos sigan
}
