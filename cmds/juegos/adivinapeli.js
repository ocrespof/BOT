import { gameEngine } from '../../utils/gameEngine.js';

const peliculas = [
  { url: 'https://lumiere-a.akamaihd.net/v1/images/p_thelionking_19752_1_06425cb0.jpeg', nombre: 'EL REY LEON' },
  { url: 'https://lumiere-a.akamaihd.net/v1/images/p_toy_story_19639_a08891bf.jpeg', nombre: 'TOY STORY' },
  { url: 'https://lumiere-a.akamaihd.net/v1/images/p_findingnemo_19752_05271d3f.jpeg', nombre: 'BUSCANDO A NEMO' },
  { url: 'https://lumiere-a.akamaihd.net/v1/images/p_monstersinc_19751_55afa07a.jpeg', nombre: 'MONSTERS INC' },
  { url: 'https://lumiere-a.akamaihd.net/v1/images/p_frozen_18373_3131259c.jpeg', nombre: 'FROZEN' },
  { url: 'https://lumiere-a.akamaihd.net/v1/images/p_aladdin_19746_09117be5.jpeg', nombre: 'ALADDIN' },
  { url: 'https://lumiere-a.akamaihd.net/v1/images/p_beautyandthebeast_19752_49f87498.jpeg', nombre: 'LA BELLA Y LA BESTIA' },
  { url: 'https://lumiere-a.akamaihd.net/v1/images/p_thelittlemermaid_19749_763eb259.jpeg', nombre: 'LA SIRENITA' },
  { url: 'https://lumiere-a.akamaihd.net/v1/images/p_mulan_19749_61c92dcd.jpeg', nombre: 'MULAN' },
  { url: 'https://lumiere-a.akamaihd.net/v1/images/p_tangled_19749_dcdcc596.jpeg', nombre: 'ENREDADOS' },
  { url: 'https://lumiere-a.akamaihd.net/v1/images/p_zootopia_19753_93976359.jpeg', nombre: 'ZOOTOPIA' },
  { url: 'https://lumiere-a.akamaihd.net/v1/images/p_coco_19736_fd5fa537.jpeg', nombre: 'COCO' },
  { url: 'https://lumiere-a.akamaihd.net/v1/images/p_insideout_19751_af12240c.jpeg', nombre: 'INTENSAMENTE' },
  { url: 'https://lumiere-a.akamaihd.net/v1/images/p_up_19753_e6f911e3.jpeg', nombre: 'UP' },
  { url: 'https://lumiere-a.akamaihd.net/v1/images/p_ratatouille_19736_0814231f.jpeg', nombre: 'RATATOUILLE' },
  { url: 'https://lumiere-a.akamaihd.net/v1/images/p_moana_20530_27606fb5.jpeg', nombre: 'MOANA' },
  { url: 'https://lumiere-a.akamaihd.net/v1/images/p_encanto_homeent_22359_4892ae1c.jpeg', nombre: 'ENCANTO' },
  { url: 'https://lumiere-a.akamaihd.net/v1/images/p_tarzan_19746_94bbd417.jpeg', nombre: 'TARZAN' },
  { url: 'https://lumiere-a.akamaihd.net/v1/images/p_hercules_19749_2b1e6005.jpeg', nombre: 'HERCULES' },
  { url: 'https://lumiere-a.akamaihd.net/v1/images/p_liloandstitch_19755_0e5efcb6.jpeg', nombre: 'LILO Y STITCH' },
  { url: 'https://lumiere-a.akamaihd.net/v1/images/p_theincredibles_19742_90bfd725.jpeg', nombre: 'LOS INCREIBLES' },
  { url: 'https://lumiere-a.akamaihd.net/v1/images/p_wall-e_19753_8bbfae35.jpeg', nombre: 'WALL E' },
  { url: 'https://lumiere-a.akamaihd.net/v1/images/p_cars_19643_4405006d.jpeg', nombre: 'CARS' }
];

export default {
  command: ['adivinapeli', 'disney'],
  category: 'juegos',
  desc: 'Adivina la película de Disney o Pixar viendo el póster recortado',
  cooldown: 10,
  run: async (client, m, args, usedPrefix, command) => {
    if (gameEngine.has(m.chat, 'adivinapeli')) return m.reply('🎬 Ya hay un juego de Adivina la Película activo en este chat.');

    const peliSeleccionada = peliculas[Math.floor(Math.random() * peliculas.length)];

    gameEngine.start(m.chat, 'adivinapeli', m.sender, {
      nombre: peliSeleccionada.nombre,
      iniciadoPor: m.sender
    }, {
      timeout: 45000,
      onTimeout: () => {
        client.sendMessage(m.chat, { text: `⏰ *TIEMPO AGOTADO*\nNadie adivinó.\nLa película era: *${peliSeleccionada.nombre}* 🎬` });
      }
    });

    const caption = `🎬 *CINE-EMOJI / DISNEY* 🎬\n\n¿De qué película famosa de Disney o Pixar es esta imagen?\n\n⏳ Tienes 45 segundos.\n💰 Premio: 250 XP`;
    await client.sendMessage(m.chat, { image: { url: peliSeleccionada.url }, caption }, { quoted: m });
  }
};

export const before = async (client, m) => {
  const game = gameEngine.get(m.chat, 'adivinapeli');
  if (!game) return false;

  const text = m.text.trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (!text || text.length < 3) return false;

  if (text === game.nombre || game.nombre.includes(text) && text.length > 5) {
    gameEngine.end(m.chat, 'adivinapeli');
    const xpPremio = 250;
    gameEngine.reward(m.sender, { xp: xpPremio, win: true });
    await client.sendMessage(m.chat, { text: `🎉 *¡CORRECTO!* 🎉\n\n@${m.sender.split('@')[0]} ha adivinado la película.\nEra: *${game.nombre}* 🎬\n🎁 Ganas *${xpPremio} XP*`, mentions: [m.sender] }, { quoted: m });
    return true;
  }
  
  return false;
};
