import NodeCache from 'node-cache';

// TTL de 5 segundos para metadatos de grupo (previene saturar WS y mantiene info fresca)
const groupMetadataCache = new NodeCache({ stdTTL: 5, checkperiod: 10, useClones: false });
// TTL de 24 horas para los números LID, ya que rara vez cambian. (Memory Leak Fixed)
const lidCache = new NodeCache({ stdTTL: 86400, checkperiod: 600, useClones: false });

function getCachedMetadata(groupChatId) {
  return groupMetadataCache.get(groupChatId) || null;
}

function normalizeToJid(phone) {
  if (!phone) return null;
  const base = typeof phone === 'number' ? phone.toString() : phone.replace(/\D/g, '');
  return base ? `${base}@s.whatsapp.net` : null;
}

export async function resolveLidToRealJid(lid, client, groupChatId) {
  const input = lid?.toString().trim();
  if (!input || !groupChatId?.endsWith('@g.us')) return input;

  if (input.endsWith('@s.whatsapp.net')) return input;

  if (lidCache.has(input)) return lidCache.get(input);

  const lidBase = input.split('@')[0];
  let metadata = getCachedMetadata(groupChatId);

  if (!metadata) {
    try {
      metadata = await client.groupMetadata(groupChatId);
      groupMetadataCache.set(groupChatId, metadata);
    } catch {
      lidCache.set(input, input);
      return input;
    }
  }

  for (const p of metadata.participants || []) {
    const idBase = p?.id?.split('@')[0]?.trim();
    const phoneRaw = p?.phoneNumber;
    const phone = normalizeToJid(phoneRaw);
    if (!idBase || !phone) continue;
    if (idBase === lidBase) {
      lidCache.set(input, phone);
      return phone;
    }
  }

  lidCache.set(input, input);
  return input;
}