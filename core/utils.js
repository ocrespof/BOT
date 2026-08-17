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

  if (!metadata && client && typeof client.groupMetadata === 'function') {
    try {
      metadata = await client.groupMetadata(groupChatId);
      if (metadata) groupMetadataCache.set(groupChatId, metadata);
    } catch {
      lidCache.set(input, input);
      return input;
    }
  }

  if (metadata && Array.isArray(metadata.participants)) {
    for (const p of metadata.participants) {
      const idBase = p?.id?.split('@')[0]?.trim();
      const lidIdBase = p?.lid?.split('@')[0]?.trim();
      const phoneRaw = p?.phoneNumber || p?.jid;
      const phone = normalizeToJid(phoneRaw);
      if (phone && (idBase === lidBase || lidIdBase === lidBase)) {
        lidCache.set(input, phone);
        return phone;
      }
      if (p?.id && p.id.endsWith('@s.whatsapp.net') && (idBase === lidBase || lidIdBase === lidBase)) {
        lidCache.set(input, p.id);
        return p.id;
      }
    }
  }

  lidCache.set(input, input);
  return input;
}