import { gameEngine } from '../../utils/gameEngine.js';
import { Aki } from 'aki-api';

const translateAnswer = (text) => {
  const t = text.toLowerCase().trim();
  if (t === 'si' || t === 'sí' || t === 's') return 0;
  if (t === 'no' || t === 'n') return 1;
  if (t === 'no se' || t === 'no lo se' || t === 'nose') return 2;
  if (t === 'probablemente' || t === 'tal vez' || t === 'quizas') return 3;
  if (t === 'probablemente no' || t === 'creo que no') return 4;
  return -1;
};

export default {
  command: ['akinator', 'aki'],
  category: 'juegos',
  desc: 'Juega al clásico Akinator. El genio adivinará tu personaje.',
  cooldown: 15,
  run: async (client, m, args, usedPrefix, command) => {
    if (gameEngine.has(m.chat, 'akinator')) {
      return m.reply('🧞‍♂️ Ya hay una sesión de Akinator activa en este chat. ¡Responde la pregunta actual!');
    }

    await m.reply('🧞‍♂️ *Despertando al genio...* (Esto puede tardar unos segundos)');

    try {
      const aki = new Aki({ region: 'es' });
      await aki.start();

      gameEngine.start(m.chat, 'akinator', m.sender, {
        aki: aki,
        iniciadoPor: m.sender
      }, {
        timeout: 120000,
        onTimeout: () => {
          client.sendMessage(m.chat, { text: `🧞‍♂️ *El genio se durmió...*\nTardaron mucho en responder, la sesión ha terminado.` });
        }
      });

      const caption = `🧞‍♂️ *AKINATOR GRUPAL* 🧞‍♂️\n\nPiensa en un personaje real o ficticio. El genio hará preguntas y cualquiera en el grupo puede responder.\n\n*Pregunta ${aki.currentStep + 1}:* ${aki.question}\n\n📝 *Responde con:* \n> Si | No | No se | Probablemente | Probablemente no`;
      await client.sendMessage(m.chat, { text: caption }, { quoted: m });

    } catch (e) {
      console.error("Error iniciando Akinator:", e);
      return m.reply('❌ Hubo un error al conectar con los servidores de Akinator. Inténtalo más tarde.');
    }
  }
};

export const before = async (client, m) => {
  const game = gameEngine.get(m.chat, 'akinator');
  if (!game) return false;

  const answerId = translateAnswer(m.text);
  if (answerId === -1) return false; // No es una respuesta válida para Akinator

  // Evitar múltiples peticiones simultáneas en el mismo grupo
  if (game.isProcessing) return true;
  game.isProcessing = true;

  try {
    const { aki } = game;
    await aki.step(answerId);

    // Comprobar si Akinator ya está seguro (Progreso >= 85% o límite de preguntas)
    if (aki.progress >= 85 || aki.currentStep >= 79) {
      await aki.win();
      gameEngine.end(m.chat, 'akinator');
      
      const guess = aki.answers[0];
      if (guess) {
        const caption = `🧞‍♂️ *¡LO TENGO!* 🧞‍♂️\n\nEstás pensando en:\n*${guess.name}*\n_${guess.description}_\n\nRanking: #${guess.ranking}`;
        await client.sendMessage(m.chat, { image: { url: guess.absolute_picture_path }, caption }, { quoted: m });
      } else {
        await client.sendMessage(m.chat, { text: `🧞‍♂️ Me rindo... ¡Me has ganado! No pude adivinar tu personaje.` }, { quoted: m });
      }
      return true;
    }

    // Renovar el timeout al haber actividad
    gameEngine.renew(m.chat, 'akinator', 120000);

    // Enviar siguiente pregunta
    const caption = `🧞‍♂️ *Pregunta ${aki.currentStep + 1}:* ${aki.question}\n\n📊 Confianza: ${Math.round(aki.progress)}%`;
    await client.sendMessage(m.chat, { text: caption }, { quoted: m });

  } catch (error) {
    console.error("Error en paso de Akinator:", error);
    gameEngine.end(m.chat, 'akinator');
    await client.sendMessage(m.chat, { text: `❌ El genio tuvo un problema técnico y se fue. Inténtalo más tarde.` }, { quoted: m });
  } finally {
    if (game) game.isProcessing = false;
  }

  return true;
};
