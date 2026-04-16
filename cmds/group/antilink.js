const URL_REGEX = /(https?:\\/\\/[^\\s]+)/gi;
const SUSPICIOUS_KEYWORDS = [
  'free-robux', 'free-nitro', 'robux-gratis', 'whatsapp-gold', 
  'generator', 'hack', 'regalo', 'premio', 'money-free', 
  'coin-gratis', 'giftcard', 'virus', 'wa.me/settings', 
  'bit.ly/', 'cutt.ly/', 'tinyurl.com/', 'is.gd/', 'v.ht/',
  'peligro', 'phishing', 'steamcommunnity', 'steam-free'
];

export default async (client, m) => {
  if (!m.isGroup || !m.text) return;
  const groupMetadata = await client.groupMetadata(m.chat).catch(() => null);
  if (!groupMetadata) return;
  
  const participants = groupMetadata.participants || [];
  const groupAdmins = participants.filter(p => p.admin).map(p => p.phoneNumber || p.jid || p.id || p.lid);
  const isAdmin = groupAdmins.includes(m.sender);
  const botId = client.user.id.split(':')[0] + '@s.whatsapp.net';
  const isBotAdmin = groupAdmins.includes(botId);
  const isSelf = global.db.data.settings[botId]?.self ?? false;
  
  if (isSelf || isAdmin || !isBotAdmin) return;
  
  const chat = global?.db?.data?.chats?.[m.chat];
  const primaryBotId = chat?.primaryBot;
  const isPrimary = !primaryBotId || primaryBotId === botId;
  
  if (!isPrimary || !chat?.antilinks) return;

  const textLower = m.text.toLowerCase();
  
  // Extraemos las URL si las hay, aunque también podemos simplemente buscar en todo el texto,
  // pero asegurarnos de que la palabra clave de phishing suele estar en el enlace o texto adjunto ayuda.
  const hasUrl = URL_REGEX.test(m.text);
  
  // Si prefieres que detecte el phishing INCLUSO si no hay "https://", 
  // puedes comentar este `if (!hasUrl) return;`. Pero como es un "Anti-Link" tiene sentido requerir una URL.
  if (!hasUrl) return;

  // Verificar si contiene palabras o acortadores sospechosos
  const isSuspicious = SUSPICIOUS_KEYWORDS.some(keyword => textLower.includes(keyword));
  
  if (!isSuspicious) return; // Permite todo enlace de grupos, canales de WhatsApp y normales

  const command = (m.command || '').toLowerCase();
  
  await client.sendMessage(m.chat, { delete: { remoteJid: m.chat, fromMe: false, id: m.key.id, participant: m.key.participant }});

  if (command !== 'invite') {
    const userName = global.db.data.users[m.sender]?.name || 'Usuario';
    await client.reply(m.chat, `> ⚠️ ꕥ Se ha eliminado a *${userName}* del grupo por \`Anti-Link/Phishing\`.\n> Se detectó un enlace *sospechoso/peligroso*.`, null);
    await client.groupParticipantsUpdate(m.chat, [m.sender], 'remove');
  }
};
