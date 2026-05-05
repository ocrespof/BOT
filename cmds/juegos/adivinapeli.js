import { gameEngine } from '../../utils/gameEngine.js';
import axios from 'axios';
import https from 'https';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Imágenes de escenas icónicas o detalles, más difíciles que el póster.
const peliculas = [
  { url: 'https://images.squarespace-cdn.com/content/v1/51cdafc4e4b09eb676a64e68/1489679169733-4W66DUMBSQ4WFYG91T81/image-asset.jpeg', nombre: 'EL REY LEON' },
  { url: 'https://i.insider.com/5f91bde4c5ba280018d9cb62?width=1000&format=jpeg&auto=webp', nombre: 'TOY STORY' },
  { url: 'https://i0.wp.com/www.flickchart.com/blog/wp-content/uploads/2012/10/Finding-Nemo.jpg', nombre: 'BUSCANDO A NEMO' },
  { url: 'https://cdn.vox-cdn.com/thumbor/P0sO92T5rY6f8pGfL0M_XQz_yVw=/1400x1400/filters:format(jpeg)/cdn.vox-cdn.com/uploads/chorus_asset/file/10237731/monsters_inc_doors.jpg', nombre: 'MONSTERS INC' },
  { url: 'https://static1.srcdn.com/wordpress/wp-content/uploads/2020/04/Frozen-2-Olaf-Snowman-Elsa-Magic.jpg', nombre: 'FROZEN' },
  { url: 'https://lumiere-a.akamaihd.net/v1/images/b_aladdin_header_poststreet_mobile_18355_e49b06cb.jpeg', nombre: 'ALADDIN' },
  { url: 'https://media.vanityfair.com/photos/58c2ce16bc68bd49f3e0c0dc/master/w_2560%2Cc_limit/beauty-and-the-beast-rose.jpg', nombre: 'LA BELLA Y LA BESTIA' },
  { url: 'https://thedisinsider.com/wp-content/uploads/2021/04/the-little-mermaid-dinglehopper.jpg', nombre: 'LA SIRENITA' },
  { url: 'https://decider.com/wp-content/uploads/2020/09/mulan-haircut.jpg', nombre: 'MULAN' },
  { url: 'https://static1.colliderimages.com/wordpress/wp-content/uploads/2021/11/tangled-lanterns.jpg', nombre: 'ENREDADOS' },
  { url: 'https://www.slantmagazine.com/wp-content/uploads/2016/03/zootopia-1.jpg', nombre: 'ZOOTOPIA' },
  { url: 'https://images.lifestyleasia.com/wp-content/uploads/sites/3/2020/10/26190847/Coco.jpg', nombre: 'COCO' },
  { url: 'https://i.guim.co.uk/img/static/sys-images/Guardian/Pix/pictures/2015/7/24/1437750379100/A-scene-from-Pixars-Insid-008.jpg?width=465&dpr=1&s=none', nombre: 'INTENSAMENTE' },
  { url: 'https://cdn.theatlantic.com/thumbor/Z1E_pA7t0vHjN2_E82V8hFvJ0D4=/0x0:2000x1125/1200x675/media/img/mt/2020/05/UP_still/original.jpg', nombre: 'UP' },
  { url: 'https://pyxis.nymag.com/v1/imgs/563/6db/e5e263ab21e25e3db1e6871a2e7c9fde94-ratatouille.2x.rsocial.w600.jpg', nombre: 'RATATOUILLE' },
  { url: 'https://lumiere-a.akamaihd.net/v1/images/image_6bf1d84f.jpeg', nombre: 'MOANA' },
  { url: 'https://variety.com/wp-content/uploads/2021/11/Encanto.jpg', nombre: 'ENCANTO' },
  { url: 'https://media.gq.com.mx/photos/5d137b0bbaab786799042b4b/master/pass/Disney-Tarzan.jpg', nombre: 'TARZAN' },
  { url: 'https://static1.srcdn.com/wordpress/wp-content/uploads/2020/04/Hercules-Zero-to-Hero.jpg', nombre: 'HERCULES' },
  { url: 'https://m.media-amazon.com/images/M/MV5BMGUyZTNiZTItZWJhYi00YTFjLWI5ZmMtZGY5NDhlZTFhNmRkXkEyXkFqcGdeQXVyMjg0MTI5NjQ@._V1_.jpg', nombre: 'LILO Y STITCH' },
  { url: 'https://www.washingtonpost.com/wp-apps/imrs.php?src=https://arc-anglerfish-washpost-prod-washpost.s3.amazonaws.com/public/YBYX5F7Y64I6TADZBYY4R44NHE.jpg', nombre: 'LOS INCREIBLES' },
  { url: 'https://www.rollingstone.com/wp-content/uploads/2018/06/rs-wall-e-6e46ed71-dfec-4d40-84c2-646bc1bd793b.jpg', nombre: 'WALL E' },
  { url: 'https://media.npr.org/assets/img/2017/06/15/cars_disney_pixar_wide-1f1922c2a07f0f6c2fbbda22312d8a5628b0304a.jpg', nombre: 'CARS' }
];

async function fetchImageBuffer(url) {
  try {
    const agent = new https.Agent({ rejectUnauthorized: false });
    const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 15000, httpsAgent: agent });
    return Buffer.from(res.data);
  } catch (error) {
    console.error("Error descargando imagen de la película:", error.message);
    return null;
  }
}

export default {
  command: ['adivinapeli', 'disney'],
  category: 'juegos',
  desc: 'Adivina la película de Disney o Pixar viendo una escena discreta',
  cooldown: 10,
  run: async (client, m, args, usedPrefix, command) => {
    if (gameEngine.has(m.chat, 'adivinapeli')) return m.reply('🎬 Ya hay un juego de Adivina la Película activo en este chat.');

    const peliSeleccionada = peliculas[Math.floor(Math.random() * peliculas.length)];
    const buffer = await fetchImageBuffer(peliSeleccionada.url);

    if (!buffer) return m.reply('❌ Error de red al obtener la imagen. Inténtalo de nuevo.');

    gameEngine.start(m.chat, 'adivinapeli', m.sender, {
      nombre: peliSeleccionada.nombre,
      iniciadoPor: m.sender
    }, {
      timeout: 45000,
      onTimeout: () => {
        client.sendMessage(m.chat, { text: `⏰ *TIEMPO AGOTADO*\nNadie adivinó.\nLa película era: *${peliSeleccionada.nombre}* 🎬` });
      }
    });

    const caption = `🎬 *CINE-EMOJI / DISNEY* 🎬\n\n¿De qué película famosa de Disney o Pixar es esta escena?\n\n⏳ Tienes 45 segundos.\n💰 Premio: 350 XP`;
    await client.sendMessage(m.chat, { image: buffer, caption }, { quoted: m });
  }
};

export const before = async (client, m) => {
  const game = gameEngine.get(m.chat, 'adivinapeli');
  if (!game) return false;

  const text = m.text.trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (!text || text.length < 3) return false;

  if (text === game.nombre || (game.nombre.includes(text) && text.length >= 4)) {
    gameEngine.end(m.chat, 'adivinapeli');
    const xpPremio = 350;
    gameEngine.reward(m.sender, { xp: xpPremio, win: true });
    await client.sendMessage(m.chat, { text: `🎉 *¡CORRECTO!* 🎉\n\n@${m.sender.split('@')[0]} ha adivinado la película.\nEra: *${game.nombre}* 🎬\n🎁 Ganas *${xpPremio} XP*`, mentions: [m.sender] }, { quoted: m });
    return true;
  }
  
  return false;
};
