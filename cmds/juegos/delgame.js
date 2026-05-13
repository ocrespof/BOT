import { gameEngine } from '../../utils/gameEngine.js';

export default {
  command: ['delgame', 'endgame', 'cancelar', 'rendirse'],
  category: 'juegos',
  desc: 'Cancela un juego activo en el chat (Si eres el creador, jugador o Administrador)',
  run: async (client, m, args, usedPrefix, command) => {
    // Variable para verificar si se canceló algo
    let canceledCount = 0;
    
    let isAdmins = false;
    if (m.isGroup) {
      const groupMetadata = await client.groupMetadata(m.chat).catch(() => null);
      if (groupMetadata) {
        const groupAdmins = groupMetadata.participants.filter(p => p.admin === 'admin' || p.admin === 'superadmin');
        isAdmins = groupAdmins.some(p => p.id === m.sender || p.jid === m.sender);
      }
    }
    const isOwners = global.config?.owner?.includes(m.sender.split('@')[0]) || false;

    // Buscar sesiones activas en este chat
    for (const [key, session] of gameEngine.sessions.entries()) {
      if (key.startsWith(m.chat)) {
        // Verificar si el usuario tiene permisos para cancelar este juego
        let canCancel = false;
        
        // 1. Es Admin o Owner
        if (isAdmins || isOwners) canCancel = true;
        
        // 2. Es el creador/iniciador del juego
        if (session.sender === m.sender || session.iniciadoPor === m.sender) canCancel = true;
        
        // 3. Es un jugador activo (Ej. TicTacToe players)
        if (session.players && (session.players.X === m.sender || session.players.O === m.sender)) canCancel = true;
        if (session.jugador === m.sender) canCancel = true;

        if (canCancel) {
          // Reembolsar apuestas si es necesario (Ej. TicTacToe)
          if (session.apuesta > 0) {
            if (session.players) {
              gameEngine.refundBet(session.players.X, session.apuesta);
              gameEngine.refundBet(session.players.O, session.apuesta);
            } else if (session.sender || session.iniciadoPor) {
              gameEngine.refundBet(session.sender || session.iniciadoPor, session.apuesta);
            }
          }

          // Limpiar timeout y borrar
          if (session.timeoutId) clearTimeout(session.timeoutId);
          gameEngine.sessions.delete(key);
          canceledCount++;
        }
      }
    }

    if (canceledCount > 0) {
      await m.reply(`✅ Se han cancelado **${canceledCount}** juego(s) activo(s) en este chat. Las apuestas (si había) han sido reembolsadas.`);
    } else {
      await m.reply(`❌ No tienes ningún juego activo que puedas cancelar en este momento.\n\n_(Solo los Administradores o los creadores del juego pueden cancelarlo)_`);
    }
  }
};
