import { resolveLidToRealJid } from "../../core/utils.js"
import axios from 'axios'

// ── Banco de GIFs por reacción (URLs directas a archivos de vídeo) ──
const reactionGifs = {
  happy: [
    "https://media1.tenor.com/m/wh-44wEAtecAAAAd/my-little-pony-friendship-is-magic-pinkie-pie.gif",
    "https://media1.tenor.com/m/5EAZak2XrPgAAAAd/the-ticket-master-my-little-pony.gif",
    "https://media1.tenor.com/m/UB_sTVQu6h4AAAAd/pinkie-pie-cute-mlp-cute.gif",
    "https://media1.tenor.com/m/9gCl7d5GFfgAAAAd/my-little-pony-pinkie-pie.gif",
    "https://media1.tenor.com/m/lGVgfdsewywAAAAd/moon-dancer.gif"
  ],
  sad: [
    "https://media1.tenor.com/m/wO06q2cKuIcAAAAd/mlp-pinkie-pie.gif",
    "https://media1.tenor.com/m/jywalQW9rdQAAAAd/mlp-pinkie-pie.gif",
    "https://media1.tenor.com/m/2MOG0F2p33gAAAAd/pinkie-pie-pinkie.gif",
    "https://media1.tenor.com/m/HfPMIKPl7YIAAAAd/my-little-pony-mlp.gif",
    "https://media1.tenor.com/m/zLuRyaci43IAAAAd/llora-pinkie-pie.gif",
    "https://media1.tenor.com/m/A5fJHNSvU9QAAAAd/pinkie-pie-mlp.gif"
  ],
  angry: [
    "https://media1.tenor.com/m/pxZzYHsxWy4AAAAC/pinkie-pie-mlp.gif",
    "https://media1.tenor.com/m/UyzJXi0jErkAAAAd/my-little-pony-mlp.gif",
    "https://media1.tenor.com/m/BwYu98GJ61AAAAAd/pinkie-pie-getting-angry.gif",
    "https://media1.tenor.com/m/5uFNXO68lwUAAAAd/pinkie-pie-annoyed.gif",
    "https://media1.tenor.com/m/Wy35kqm6-UgAAAAd/pinkie-pie-my-little-pony.gif"
  ]
};


// ── Captions ──
const captions = {
  peek: (from, to, g) => from === to ? 'está espiando detrás de una puerta por diversión.' : `está espiando a`,
  comfort: (from, to) => (from === to ? 'se está consolando a sí mismo.' : 'está consolando a'),
  thinkhard: (from, to) => from === to ? 'se quedó pensando muy intensamente.' : 'está pensando profundamente en',
  curious: (from, to) => from === to ? 'se muestra curioso por todo.' : 'está curioso por lo que hace',
  sniff: (from, to) => from === to ? 'se olfatea como si buscara algo raro.' : 'está olfateando a',
  stare: (from, to) => from === to ? 'se queda mirando al techo sin razón.' : 'se queda mirando fijamente a',
  trip: (from, to) => from === to ? 'se tropezó consigo mismo, otra vez.' : 'tropezó accidentalmente con',
  blowkiss: (from, to) => (from === to ? 'se manda un beso al espejo.' : 'le lanzó un beso a'),
  snuggle: (from, to) => from === to ? 'se acurruca con una almohada suave.' : 'se acurruca dulcemente con',
  sleep: (from, to) => from === to ? 'está durmiendo plácidamente.' : 'está durmiendo con',
  cold: (from, to) => (from === to ? 'tiene mucho frío.' : 'se congela por el frío de'),
  sing: (from, to) => (from === to ? 'está cantando.' : 'le está cantando a'),
  tickle: (from, to) => from === to ? 'se está haciendo cosquillas.' : 'le está haciendo cosquillas a',
  scream: (from, to) => (from === to ? 'está gritando al viento.' : 'le está gritando a'),
  push: (from, to) => (from === to ? 'se empujó a sí mismo.' : 'empujó a'),
  nope: (from, to) => (from === to ? 'expresa claramente su desacuerdo.' : 'dice "¡No!" a'),
  jump: (from, to) => (from === to ? 'salta de felicidad.' : 'salta feliz con'),
  heat: (from, to) => (from === to ? 'siente mucho calor.' : 'tiene calor por'),
  gaming: (from, to) => (from === to ? 'está jugando solo.' : 'está jugando con'),
  draw: (from, to) => (from === to ? 'hace un lindo dibujo.' : 'dibuja inspirado en'),
  call: (from, to) => from === to ? 'marca su propio número esperando respuesta.' : 'llamó al número de',
  seduce: (from, to) => from === to ? 'lanzó una mirada seductora al vacío.' : 'está intentando seducir a',
  shy: (from, to, g) => from === to ? `se sonrojó tímidamente y desvió la mirada.` : `se siente demasiado ${g === 'Hombre' ? 'tímido' : g === 'Mujer' ? 'tímida' : 'tímide'} para mirar a`,
  slap: (from, to, g) => from === to ? `se dio una bofetada a sí ${g === 'Hombre' ? 'mismo' : g === 'Mujer' ? 'misma' : 'mismx'}.` : 'le dio una bofetada a',
  bath: (from, to) => (from === to ? 'se está bañando.' : 'está bañando a'),
  angry: (from, to, g) => from === to ? `está muy ${g === 'Hombre' ? 'enojado' : g === 'Mujer' ? 'enojada' : 'enojadx'}.` : `está super ${g === 'Hombre' ? 'enojado' : g === 'Mujer' ? 'enojada' : 'enojadx'} con`,
  bored: (from, to, g) => from === to ? `está muy ${g === 'Hombre' ? 'aburrido' : g === 'Mujer' ? 'aburrida' : 'aburridx'}.` : `está ${g === 'Hombre' ? 'aburrido' : g === 'Mujer' ? 'aburrida' : 'aburridx'} de`,
  bite: (from, to, g) => from === to ? `se mordió ${g === 'Hombre' ? 'solito' : g === 'Mujer' ? 'solita' : 'solitx'}.` : 'mordió a',
  bleh: (from, to) => from === to ? 'se sacó la lengua frente al espejo.' : 'le está haciendo muecas con la lengua a',
  bonk: (from, to, g) => from === to ? `se dio un bonk a sí ${g === 'Hombre' ? 'mismo' : g === 'Mujer' ? 'misma' : 'mismx'}.` : 'le dio un golpe a',
  blush: (from, to) => (from === to ? 'se sonrojó.' : 'se sonrojó por'),
  impregnate: (from, to) => (from === to ? 'se embarazó.' : 'embarazó a'),
  bully: (from, to, g) => from === to ? `se hace bullying ${g === 'Hombre' ? 'el mismo' : g === 'Mujer' ? 'ella misma' : 'el/ella mismx'}…` : 'le está haciendo bullying a',
  cry: (from, to) => (from === to ? 'está llorando.' : 'está llorando por'),
  happy: (from, to) => (from === to ? 'está feliz.' : 'está feliz con'),
  coffee: (from, to) => (from === to ? 'está tomando café.' : 'está tomando café con'),
  clap: (from, to) => (from === to ? 'está aplaudiendo por algo.' : 'está aplaudiendo por'),
  cringe: (from, to) => (from === to ? 'siente cringe.' : 'siente cringe por'),
  dance: (from, to) => (from === to ? 'está bailando.' : 'está bailando con'),
  cuddle: (from, to, g) => from === to ? `se acurrucó ${g === 'Hombre' ? 'solo' : g === 'Mujer' ? 'sola' : 'solx'}.` : 'se acurrucó con',
  drunk: (from, to, g) => from === to ? `está demasiado ${g === 'Hombre' ? 'borracho' : g === 'Mujer' ? 'borracha' : 'borrachx'}` : `está ${g === 'Hombre' ? 'borracho' : g === 'Mujer' ? 'borracha' : 'borrachx'} con`,
  dramatic: (from, to) => from === to ? 'está haciendo un drama exagerado.' : 'le está haciendo un drama a',
  handhold: (from, to, g) => from === to ? `se dio la mano consigo ${g === 'Hombre' ? 'mismo' : g === 'Mujer' ? 'misma' : 'mismx'}.` : 'le agarró la mano a',
  eat: (from, to) => (from === to ? 'está comiendo algo delicioso.' : 'está comiendo con'),
  highfive: (from, to) => from === to ? 'se chocó los cinco frente al espejo.' : 'chocó los 5 con',
  hug: (from, to, g) => from === to ? `se abrazó a sí ${g === 'Hombre' ? 'mismo' : g === 'Mujer' ? 'misma' : 'mismx'}.` : 'le dio un abrazo a',
  kill: (from, to) => (from === to ? 'se autoeliminó en modo dramático.' : 'asesinó a'),
  kiss: (from, to) => (from === to ? 'se mandó un beso al aire.' : 'le dio un beso a'),
  kisscheek: (from, to) => from === to ? 'se besó en la mejilla usando un espejo.' : 'le dio un beso en la mejilla a',
  lick: (from, to) => (from === to ? 'se lamió por curiosidad.' : 'lamió a'),
  laugh: (from, to) => (from === to ? 'se está riendo de algo.' : 'se está burlando de'),
  pat: (from, to) => (from === to ? 'se acarició la cabeza con ternura.' : 'le dio una caricia a'),
  love: (from, to, g) => from === to ? `se quiere mucho a sí ${g === 'Hombre' ? 'mismo' : g === 'Mujer' ? 'misma' : 'mismx'}.` : 'siente atracción por',
  pout: (from, to, g) => from === to ? `está haciendo pucheros ${g === 'Hombre' ? 'solo' : g === 'Mujer' ? 'sola' : 'solx'}.` : 'está haciendo pucheros con',
  punch: (from, to) => (from === to ? 'lanzó un puñetazo al aire.' : 'le dio un puñetazo a'),
  run: (from, to) => (from === to ? 'está corriendo por su vida.' : 'está corriendo con'),
  scared: (from, to, g) => from === to ? `está ${g === 'Hombre' ? 'asustado' : g === 'Mujer' ? 'asustada' : 'asustxd'} por algo.` : `está ${g === 'Hombre' ? 'asustado' : g === 'Mujer' ? 'asustada' : 'asustxd'} por`,
  sad: (from, to) => (from === to ? `está triste` : `está expresando su tristeza a`),
  smoke: (from, to) => (from === to ? 'está fumando tranquilamente.' : 'está fumando con'),
  smile: (from, to) => (from === to ? 'está sonriendo.' : 'le sonrió a'),
  spit: (from, to, g) => from === to ? `se escupió a sí ${g === 'Hombre' ? 'mismo' : g === 'Mujer' ? 'misma' : 'mismx'} por accidente.` : 'le escupió a',
  smug: (from, to) => (from === to ? 'está presumiendo mucho últimamente.' : 'está presumiendo a'),
  think: (from, to) => from === to ? 'está pensando profundamente.' : 'no puede dejar de pensar en',
  step: (from, to, g) => from === to ? `se pisó a sí ${g === 'Hombre' ? 'mismo' : g === 'Mujer' ? 'misma' : 'mismx'} por accidente.` : 'está pisando a',
  wave: (from, to, g) => from === to ? `se saludó a sí ${g === 'Hombre' ? 'mismo' : g === 'Mujer' ? 'misma' : 'mismx'} en el espejo.` : 'está saludando a',
  walk: (from, to) => (from === to ? 'salió a caminar en soledad.' : 'decidió dar un paseo con'),
  wink: (from, to, g) => from === to ? `se guiñó a sí ${g === 'Hombre' ? 'mismo' : g === 'Mujer' ? 'misma' : 'mismx'} en el espejo.` : 'le guiñó a',
};

// ── Alias de comandos ──
const alias = {
  angry: ['angry', 'enojado', 'enojada'],
  bleh: ['bleh'],
  bored: ['bored', 'aburrido', 'aburrida'],
  clap: ['clap', 'aplaudir'],
  coffee: ['coffee', 'cafe'],
  dramatic: ['dramatic', 'drama'],
  drunk: ['drunk'],
  cold: ['cold'],
  impregnate: ['impregnate', 'preg', 'preñar', 'embarazar'],
  kisscheek: ['kisscheek', 'beso', 'besar'],
  laugh: ['laugh'],
  love: ['love', 'amor'],
  pout: ['pout', 'mueca'],
  punch: ['punch', 'golpear'],
  run: ['run', 'correr'],
  sad: ['sad', 'triste'],
  scared: ['scared', 'asustado'],
  seduce: ['seduce', 'seducir'],
  shy: ['shy', 'timido', 'timida'],
  sleep: ['sleep', 'dormir'],
  smoke: ['smoke', 'fumar'],
  spit: ['spit', 'escupir'],
  step: ['step', 'pisar'],
  think: ['think', 'pensar'],
  walk: ['walk', 'caminar'],
  hug: ['hug', 'abrazar'],
  kill: ['kill', 'matar'],
  eat: ['eat', 'nom', 'comer'],
  kiss: ['kiss', 'muak', 'besar'],
  wink: ['wink', 'guiñar'],
  pat: ['pat', 'acariciar'],
  happy: ['happy', 'feliz'],
  bully: ['bully', 'molestar'],
  bite: ['bite', 'morder'],
  blush: ['blush', 'sonrojarse'],
  wave: ['wave', 'saludar'],
  bath: ['bath', 'bañarse'],
  smug: ['smug', 'presumir'],
  smile: ['smile', 'sonreir'],
  highfive: ['highfive', 'choca'],
  handhold: ['handhold', 'tomar'],
  cringe: ['cringe'],
  bonk: ['bonk', 'golpe'],
  cry: ['cry', 'llorar'],
  lick: ['lick', 'lamer'],
  slap: ['slap', 'bofetada'],
  dance: ['dance', 'bailar'],
  cuddle: ['cuddle', 'acurrucar'],
  sing: ['sing', 'cantar'],
  tickle: ['tickle', 'cosquillas'],
  scream: ['scream', 'gritar'],
  push: ['push', 'empujar'],
  nope: ['nope'],
  jump: ['jump', 'saltar'],
  heat: ['heat', 'calor'],
  gaming: ['gaming'],
  draw: ['draw'],
  call: ['call', 'llamar'],
  snuggle: ['snuggle', 'acurrucarse'],
  blowkiss: ['blowkiss', 'besito'],
  trip: ['trip', 'tropezar'],
  stare: ['stare'],
  sniff: ['sniff', 'oler'],
  curious: ['curious', 'curioso', 'curiosa'],
  thinkhard: ['thinkhard'],
  comfort: ['comfort', 'consolar'],
  peek: ['peek']
};

// ── Mapeo de comandos a categoría de GIF local ──
const gifCategory = {
  happy: 'happy', feliz: 'happy', smile: 'happy', laugh: 'happy', jump: 'happy',
  clap: 'happy', dance: 'happy', highfive: 'happy', wink: 'happy', blush: 'happy',
  coffee: 'happy', gaming: 'happy', sing: 'happy', wave: 'happy',
  sad: 'sad', cry: 'sad', triste: 'sad', bored: 'sad', cold: 'sad', sleep: 'sad',
  pout: 'sad', dramatic: 'sad', comfort: 'sad',
  angry: 'angry', enojado: 'angry', enojada: 'angry', slap: 'angry', punch: 'angry',
  kill: 'angry', bonk: 'angry', push: 'angry', scream: 'angry', nope: 'angry',
  bully: 'angry', bite: 'angry', spit: 'angry', step: 'angry',
};

// Generar lista plana de comandos desde los alias
const allCommands = Object.values(alias).flat();

/**
 * Obtiene un GIF de Giphy como buffer de vídeo descargable (MP4).
 */
async function fetchGifBuffer(query) {
  const giphyKey = '80fK562JEwSX0HM6CjJ6Me2QmOrnIaiB';
  // Modificamos la búsqueda para que sea exclusivamente de Pinkie Pie / Equestria Girls
  const res = await axios.get(`https://api.giphy.com/v1/gifs/search`, {
    params: { api_key: giphyKey, q: `pinkie pie ${query}`, limit: 20, rating: 'g' },
    timeout: 10000
  });

  if (!res.data?.data?.length) return null;

  const randomGif = res.data.data[Math.floor(Math.random() * res.data.data.length)];
  const mp4Url = randomGif.images?.original?.mp4 || randomGif.images?.fixed_height?.mp4;

  if (!mp4Url) return null;

  const videoRes = await axios.get(mp4Url, { responseType: 'arraybuffer', timeout: 15000 });
  return Buffer.from(videoRes.data);
}

export default {
  command: allCommands,
  category: 'anime',
  desc: 'Reacciones animadas convertidas en stickers de Pinkie Pie.',
  run: async (client, m, args, usedPrefix, command) => {
    const currentCommand = Object.keys(alias).find(key => alias[key].includes(command)) || command;
    if (!captions[currentCommand]) return;

    let mentionedJid = m.mentionedJid;
    let who2 = mentionedJid.length > 0 ? mentionedJid[0] : (m.quoted ? m.quoted.sender : m.sender);
    const who = who2.endsWith('@lid') ? await resolveLidToRealJid(who2, client, m.chat) : who2;
    const fromName = global.db.data.users[m.sender]?.name || '@' + m.sender.split('@')[0];
    const toName = global.db.data.users[who]?.name || '@' + who.split('@')[0];
    const genero = global.db.data.users[m.sender]?.genre || 'Oculto';
    const captionText = captions[currentCommand](fromName, toName, genero);
    const caption = who !== m.sender
      ? `\`${fromName}\` ${captionText} \`${toName}\`.`
      : `\`${fromName}\` ${captionText}`;

    try {
      // Enviar el texto de la reacción primero
      await client.sendMessage(m.chat, { text: caption, mentions: [who, m.sender] }, { quoted: m });

      // Buscar animación de Pinkie Pie en Giphy (formato MP4 válido para convertir a Sticker)
      let videoBuffer = await fetchGifBuffer(currentCommand);

      if (videoBuffer) {
        // Enviar como sticker animado
        if (typeof client.sendVideoAsSticker === 'function') {
           await client.sendVideoAsSticker(m.chat, videoBuffer, m, { packname: "Pinkie Pie", author: "Reacciones" });
        } else {
           // Fallback en caso de que sendVideoAsSticker no esté disponible
           await client.sendMessage(m.chat, { video: videoBuffer, gifPlayback: true }, { quoted: m });
        }
      }
    } catch (e) {
      await m.reply(`Ha ocurrido un error inesperado al ejecutar el comando.\n[Error: ${e.message}]`);
    }
  },
};
