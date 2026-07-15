/**
 * 🕸️ utils_network.js — Comandos de red, consulta del clima, códigos QR y análisis de enlaces.
 * Reúne: clima, qr, tinyurl, inspect
 */
import { getUrlFromDirectPath } from "@whiskeysockets/baileys";
import { getGroupMeta, getBotSettings } from '../../utils/tools.js';

// Native startCase — eliminates lodash dependency
const startCase = (str) => str.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

function formatDate(n, locale = "es", includeTime = true) {
  if (n > 1e12) {
    n = Math.floor(n / 1000);
  } else if (n < 1e10) {
    n = Math.floor(n * 1000);
  }
  const date = new Date(n);
  if (isNaN(date)) return "Fecha no válida";
  const optionsDate = { day: '2-digit', month: '2-digit', year: 'numeric' };
  const formattedDate = date.toLocaleDateString(locale, optionsDate);
  if (!includeTime) return formattedDate;
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  const period = hours < 12 ? 'AM' : 'PM';
  const formattedTime = `${hours}:${minutes}:${seconds} ${period}`;
  return `${formattedDate}, ${formattedTime}`;
}

function newsletterKey(key) {
  return startCase(key.replace(/_/g, " "))
    .replace("Id", "🆔 Identificador")
    .replace("State", "📌 Estado")
    .replace("Creation Time", "📅 Fecha de creación")
    .replace("Name Time", "✏️ Fecha de modificación del nombre")
    .replace("Name", "🏷️ Nombre")
    .replace("Description Time", "📝 Fecha de modificación de la descripción")
    .replace("Description", "📜 Descripción")
    .replace("Invite", "📩 Invitación")
    .replace("Handle", "👤 Alias")
    .replace("Picture", "🖼️ Imagen")
    .replace("Preview", "👀 Vista previa")
    .replace("Reaction Codes", "😃 Reacciones")
    .replace("Subscribers", "👥 Suscriptores")
    .replace("Verification", "✅ Verificación")
    .replace("Viewer Metadata", "🔍 Datos avanzados");
}

function formatValue(key, value, preview) {
  switch (key) {
    case "subscribers":
      return value ? value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") : "No hay suscriptores";
    case "creation_time":
    case "nameTime":
    case "descriptionTime":
      return formatDate(value);
    case "description": 
    case "name":
      return value || "No hay información disponible";
    case "state":
      switch (value) {
        case "ACTIVE": return "Activo";
        case "GEOSUSPENDED": return "Suspendido por región";
        case "SUSPENDED": return "Suspendido";
        default: return "Desconocido";
      }
    case "reaction_codes":
      switch (value) {
        case "ALL": return "Todas las reacciones permitidas";
        case "BASIC": return "Reacciones básicas permitidas";
        case "NONE": return "No se permiten reacciones";
        default: return "Desconocido";
      }
    case verificationValue:
      switch (value) {
        case "VERIFIED": return "Verificado";
        case "UNVERIFIED": return "No verificado";
        default: return "Desconocido";
      }
    case "mute":
      switch (value) {
        case "ON": return "Silenciado";
        case "OFF": return "No silenciado";
        case "UNDEFINED": return "Sin definir";
        default: return "Desconocido";
      }
    case "view_role":
      switch (value) {
        case "ADMIN": return "Administrador";
        case "OWNER": return "Propietario";
        case "SUBSCRIBER": return "Suscriptor";
        case "GUEST": return "Invitado";
        default: return "Desconocido";
      }
    case "picture":
      if (preview) {
        return getUrlFromDirectPath(preview);
      } else {
        return "No hay imagen disponible";
      }
    default:
      return value !== null && value !== undefined ? value.toString() : "No hay información disponible";
  }
}
const verificationValue = "verification"; // avoidance of linting issue/duplicate case

function processObject(obj, prefix = "", preview) {
  let caption = "";
  Object.keys(obj).forEach(key => {
    const value = obj[key];
    if (typeof value === "object" && value !== null) {
      if (Object.keys(value).length > 0) {
        const sectionName = newsletterKey(prefix + key);
        caption += `\n*\`${sectionName}\`*\n`;
        caption += processObject(value, `${prefix}${key}_`);
      }
    } else {
      const shortKey = prefix ? prefix.split("_").pop() + "_" + key : key;
      const displayValue = formatValue(shortKey, value, preview);
      const translatedKey = newsletterKey(shortKey);
      caption += `- *${translatedKey}:*\n${displayValue}\n`;
    }
  });
  return caption;
}

// ── COMANDOS ──

const cmdClima = {
  command: ['clima', 'weather'],
  category: 'utils', desc: 'Consulta el clima de una ciudad.', usage: '[ciudad]',
  run: async (client, m, args, usedPrefix, command) => {
    const ciudad = args.join(' ').trim();
    if (!ciudad) return m.reply(` Por favor ingresa el nombre de una ciudad.\n*Ejemplo:* ${usedPrefix + command} Bogotá`);
    
    try {
      m.react('🌤️');
      const req = await fetch(`https://wttr.in/${encodeURIComponent(ciudad)}?format=j1`);
      const res = await req.json();
      
      const current = res.current_condition[0];
      const name = res.nearest_area[0].areaName[0].value;
      const country = res.nearest_area[0].country[0].value;
      
      const temp = current.temp_C;
      const desc = current.lang_es ? current.lang_es[0].value : current.weatherDesc[0].value;
      const humidity = current.humidity;
      const wind = current.windspeedKmph;
      
      const txt = `*🌤️ CLIMA EN ${name.toUpperCase()} (${country})*\n\n` +
                  `> 🌡️ *Temperatura:* ${temp}°C\n` +
                  `> ☁️ *Condición:* ${desc}\n` +
                  `> 💧 *Humedad:* ${humidity}%\n` +
                  `> 💨 *Viento:* ${wind} km/h`;
                  
      await client.sendMessage(m.chat, { text: txt }, { quoted: m });
      m.react('✅');
    } catch (e) {
      m.react('❌');
      m.reply(` No se pudo obtener el clima de *${ciudad}*. Verifica el nombre de la ciudad.`);
    }
  }
};

const cmdQr = {
  command: ['qr', 'qrcode'],
  category: 'utils', desc: 'Generar código QR.',
  run: async (client, m, args, usedPrefix, command) => {
    const text = args.join(' ').trim();
    if (!text) return m.reply(` Escribe un texto o URL para generar el Código QR.\n*Ejemplo:* ${usedPrefix + command} https://google.com`);
    
    try {
      m.react('📷');
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(text)}`;
      
      await client.sendMessage(m.chat, { image: { url: qrUrl }, caption: `> *Código QR Generado Exitosamente*` }, { quoted: m });
      m.react('✅');
    } catch (e) {
      m.react('❌');
      m.reply(` Hubo un error al crear tu Código QR.`);
    }
  }
};

const cmdTinyUrl = {
  command: ['tiny', 'shorturl', 'acortar'],
  category: 'utils', desc: 'Acorta un enlace usando TinyURL.', usage: '[enlace]',
  run: async (client, m, args, usedPrefix, command) => {
    const link = args[0];
    if (!link || !link.startsWith('http')) return m.reply(` Proporciona un enlace válido con http o https.\n*Ejemplo:* ${usedPrefix + command} https://ejemplo.com/enlace/muy/largo/abcd`);
    
    try {
      const res = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(link)}`);
      const short = await res.text();
      
      if (short === 'Error') throw new Error('Error API');
      m.reply(`🔗 *Enlace Acortado*\n\nOriginal: ${link}\n*Acortado:* ${short}`);
    } catch (e) {
      m.reply(` Error al acortar el enlace. Revise si es válido.`);
    }
  }
};

const cmdInspect = {
  command: ["inspect","inspeccionar"],
  category: 'utils', desc: "Inspeccionar grupo/enlace.",
  run: async (client, m, args, usedPrefix, command, text) => {
    if (!text) return client.reply(m.chat, ` Por favor, ingrese el enlace de grupo/comunidad o canal.`, m);
    const channelUrl = text?.match(/(?:https:\/\/)?(?:www\.)?(?:chat\.|wa\.)?whatsapp\.com\/(?:channel\/|joinchat\/)?([0-9A-Za-z]{22,24})/i)?.[1];
    const settings = getBotSettings(client);
    let thumb = settings.icon;
    let pp;
    let inviteCode;
    const MetadataGroupInfo = async (res) => {
      let nameCommunity = "";
      if (res.linkedParent) {
        let linkedGroupMeta = await getGroupMeta(client, res.linkedParent);
        nameCommunity = linkedGroupMeta ? "`Nombre:` " + linkedGroupMeta.subject : "";
      }
      pp = await client.profilePictureUrl(res.id, 'image').catch(() => null);
      inviteCode = await client.groupInviteCode(m.chat).catch(() => null);
      const formatParticipants = (participants) => participants && participants.length > 0 ? participants.map((user, i) => `${i + 1}. @${user.id?.split("@")[0]}${user.admin === "superadmin" ? " (superadmin)" : user.admin === "admin" ? " (admin)" : ""}`).join("\n") : "No encontrado";
      let caption = `🆔 *Identificador del grupo:*\n${res.id || "No encontrado"}\n\n` +
      `👑 *Creado por:*\n${res.owner ? `@${res.owner?.split("@")[0]}` : "No encontrado"} ${res.creation ? `el ${formatDate(res.creation)}` : "(Fecha no encontrada)"}\n\n` +
      `🏷️ *Nombre:*\n${res.subject || "No encontrado"}\n\n` +
      `✏️ *Nombre cambiado por:*\n${res.subjectOwner ? `@${res.subjectOwner?.split("@")[0]}` : "No encontrado"} ${res.subjectTime ? `el ${formatDate(res.subjectTime)}` : "(Fecha no encontrada)"}\n\n` +
      `📄 *Descripción:*\n${res.desc || "No encontrado"}\n\n` +
      `📝 *Descripción cambiado por:*\n${res.descOwner ? `@${res.descOwner?.split("@")[0]}` : "No encontrado"}\n\n` +
      `🗃️ *Id de la descripción:*\n${res.descId || "No encontrado"}\n\n` +
      `🖼️ *Imagen del grupo:*\n${pp ? pp : "No se pudo obtener"}\n\n` +
      `💫 *Autor:*\n${res.author || "No encontrado"}\n\n` +
      `🎫 *Código de invitación:*\n${res.inviteCode || inviteCode || "No disponible"}\n\n` +
      `⌛ *Duración:*\n${res.ephemeralDuration !== undefined ? `${res.ephemeralDuration} segundos` : "Desconocido"}\n\n` +
      `🛃 *Admins:*\n${formatParticipants(res.participants)}\n\n` +
      `🔰 *Usuarios en total:*\n${res.size || "Cantidad no encontrada"}\n\n` +
      `✨ *Información avanzada* ✨\n\n🔎 *Comunidad vinculada al grupo:*\n${res.linkedParent ? "`Id:` " + res.linkedParent + (nameCommunity ? "\n" + nameCommunity : "") : res.isCommunity ? "Este grupo es una comunidad" : "No pertenece a ninguna comunidad"}\n\n` +
      `⚠️ *Restricciones:* ${res.restrict ? "✅" : "❌"}\n` +
      `📢 *Anuncios:* ${res.announce ? "✅" : "❌"}\n` +
      `🏘️ *¿Es comunidad?:* ${res.isCommunity ? "✅" : "❌"}\n` +
      `📯 *¿Es anuncio de comunidad?:* ${res.isCommunityAnnounce ? "✅" : "❌"}\n` +
      `🤝 *Tiene aprobación de miembros:* ${res.joinApprovalMode ? "✅" : "❌"}\n` +
      `🆕 *Puede Agregar futuros miembros:* ${res.memberAddMode ? "✅" : "❌"}\n\n`;
      return caption.trim();
    };
    const inviteGroupInfo = async (groupData) => {
      const { id, subject, subjectOwner, subjectTime, size, creation, owner, desc, descId, linkedParent, announce, isCommunity, isCommunityAnnounce, joinApprovalMode } = groupData;
      let nameCommunity = "";
      if (linkedParent) {
        let linkedGroupMeta = await getGroupMeta(client, linkedParent);
        nameCommunity = linkedGroupMeta ? "`Nombre:` " + linkedGroupMeta.subject : "";
      }
      pp = await client.profilePictureUrl(id, 'image').catch(() => null);
      const formatParticipants = (participants) => participants && participants.length > 0 ? participants.map((user, i) => `${i + 1}. @${user.id?.split("@")[0]}${user.admin === "superadmin" ? " (superadmin)" : user.admin === "admin" ? " (admin)" : ""}`).join("\n") : "No encontrado";
      let caption = `🆔 *Identificador del grupo:*\n${id || "No encontrado"}\n\n` +
      `👑 *Creado por:*\n${owner ? `@${owner?.split("@")[0]}` : "No encontrado"} ${creation ? `el ${formatDate(creation)}` : "(Fecha no encontrada)"}\n\n` +
      `🏷️ *Nombre:*\n${subject || "No encontrado"}\n\n` +
      `✏️ *Nombre cambiado por:*\n${subjectOwner ? `@${subjectOwner?.split("@")[0]}` : "No encontrado"} ${subjectTime ? `el ${formatDate(subjectTime)}` : "(Fecha no encontrada)"}\n\n` +
      `📄 *Descripción:*\n${desc || "No encontrada"}\n\n` +
      `💠 *ID de la descripción:*\n${descId || "No encontrado"}\n\n` +
      `🖼️ *Imagen del grupo:*\n${pp ? pp : "No se pudo obtener"}\n\n` +
      `🏆 *Miembros destacados:*\n${formatParticipants(groupData.participants)}\n\n` +
      `👥 *Destacados total:*\n${size || "Cantidad no encontrada"}\n\n` +
      `✨ *Información avanzada* ✨\n\n🔎 *Comunidad vinculada al grupo:*\n${linkedParent ? "`Id:` " + linkedParent + (nameCommunity ? "\n" + nameCommunity : "") : isCommunity ? "Este grupo es una comunidad" : "No pertenece a ninguna comunidad"}\n\n` +      
      `📢 *Anuncios:* ${announce ? "✅ Si" : "❌ No"}\n` +
      `🏘️ *¿Es comunidad?:* ${isCommunity ? "✅ Si" : "❌ No"}\n` +
      `📯 *¿Es anuncio de comunidad?:* ${isCommunityAnnounce ? "✅" : "❌"}\n` +
      `🤝 *Tiene aprobación de miembros:* ${joinApprovalMode ? "✅" : "❌"}\n`;
      return caption.trim();
    };
    let info;
    let res;
    let inviteInfo;
    try {
      res = text ? null : await getGroupMeta(client, m.chat);
      info = await MetadataGroupInfo(res);
    } catch {
      const inviteUrl = text?.match(/(?:https:\/\/)?(?:www\.)?(?:chat\.|wa\.)?whatsapp\.com\/(?:invite\/|joinchat\/)?([0-9A-Za-z]{22,24})/i)?.[1];      
      if (inviteUrl) {
        try {
          inviteInfo = await client.groupGetInviteInfo(inviteUrl);
          info = await inviteGroupInfo(inviteInfo);
        } catch (e) {
          m.reply(' Grupo no encontrado.');
          return;
        }
      }
    }
    if (info) {
      const mentions = (res?.participants || inviteInfo?.participants || []).filter(p => p && p.id && (p.admin === "admin" || p.admin === "superadmin" || p.id === (res?.owner || inviteInfo?.owner))).map(p => p.id).filter(id => id && typeof id === 'string' && id.includes('@'));
      await client.sendMessage(m.chat, { text: info, contextInfo: {
        mentionedJid: mentions,
        externalAdReply: {
          title: "Inspector de Grupos",
          body: "✧ ¡Super Inspectador!",
          thumbnailUrl: pp ? pp : thumb,
          sourceUrl: args[0] ? args[0] : inviteCode ? `https://chat.whatsapp.com/${inviteCode}` : usedPrefix,
          mediaType: 1,
          showAdAttribution: false,
          renderLargerThumbnail: false
        }
      }}, { quoted: m });
    } else {
      let newsletterInfo;
      if (!channelUrl) return client.reply(m.chat, " Verifique que sea un enlace de canal de WhatsApp.", m);
      if (channelUrl) {
        try {
          newsletterInfo = await client.newsletterMetadata("invite", channelUrl).catch(() => null);
          if (!newsletterInfo) return client.reply(m.chat, " No se encontró información del canal. Verifique que el enlace sea correcto.", m);
          let caption = "*Inspector de enlaces de Canales*\n\n" + processObject(newsletterInfo, "", newsletterInfo?.preview);
          if (newsletterInfo?.preview) {
            pp = getUrlFromDirectPath(newsletterInfo.preview);
          } else {
            pp = thumb;
          }
          if (channelUrl && newsletterInfo) {
            await client.sendMessage(m.chat, { text: caption, contextInfo: {
              mentionedJid: Array.isArray(client.parseMention(caption)) ? client.parseMention(caption) : [],
              externalAdReply: {
                title: "Inspector de Canales",
                body: "✧ ¡Super Inspectador!",
                thumbnailUrl: pp,
                sourceUrl: args[0],
                mediaType: 1,
                showAdAttribution: false,
                renderLargerThumbnail: false
              }
            }}, { quoted: m });
          }
          newsletterInfo.id ? client.sendMessage(m.chat, { text: newsletterInfo.id }, { quoted: null }) : '';
        } catch (e) {
          await m.reply(`> Error al ejecutar el comando.\n[Error: *${e.message}*]`);
        }
      }
    }
  }
};

export default [cmdClima, cmdQr, cmdTinyUrl, cmdInspect];
