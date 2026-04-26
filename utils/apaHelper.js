// utils/apaHelper.js
/**
 * Formatea una referencia APA 7ª edición a partir de una URL.
 * @param {string} url - URL del recurso a citar.
 * @param {object} client - Instancia de Baileys (para logs si se requiere).
 * @param {object} m - Mensaje de origen (para reaccionar en caso de error).
 * @returns {Promise<string>} - Cadena con la cita APA formateada.
 * @throws {Error} - Mensaje descriptivo si falla la extracción.
 */
export async function formatAPA(url, client, m) {
  // 1️⃣ Validar la URL
  if (!/^https?:\/\/[^\s]+$/.test(url)) {
    throw new Error('URL inválida');
  }

  // 2️⃣ HEAD para detectar redirecciones o bloqueos (sin lanzar error si falla)
  let finalUrl = url;
  try {
    const head = await (await import('axios')).default.head(url, { maxRedirects: 5, timeout: 5000 });
    finalUrl = head?.request?.res?.responseUrl || url;
  } catch (_) {
    // Si HEAD falla, seguimos con la URL original.
  }

  // 3️⃣ GET el contenido HTML
  const { data: html } = await (await import('axios')).default.get(finalUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; YukiBot/1.0)' },
    timeout: 12000,
  });

  // 4️⃣ Parsear con Cheerio
  const cheerio = (await import('cheerio')).default;
  const $ = cheerio.load(html);

  const title = $('title').first().text().trim() || 'Documento sin título';
  const site =
    $('meta[property="og:site_name"]').attr('content') ||
    $('meta[name="application-name"]').attr('content') ||
    new URL(finalUrl).hostname;

  // 5️⃣ Autor (varios patrones)
  let author =
    $('meta[name="author"]').attr('content') ||
    $('meta[property="article:author"]').attr('content') ||
    $('meta[name="citation_author"]').attr('content') ||
    'Autor Anónimo / Institucional';

  // 6️⃣ Fecha
  let dateStr = 's.f.';
  const dateMeta =
    $('meta[name="citation_date"]').attr('content') ||
    $('meta[property="article:published_time"]').attr('content') ||
    null;
  if (dateMeta) {
    const d = new Date(dateMeta);
    if (!isNaN(d.getTime())) {
      const months = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
      ];
      dateStr = `${d.getFullYear()}, ${d.getDate()} de ${months[d.getMonth()]}`;
    }
  }

  // 7️⃣ Formatear autor al estilo APA
  let formattedAuthor = author;
  if (
    !author.includes('/') &&
    !author.includes(',') &&
    author.split(' ').length >= 2 &&
    author.length < 35
  ) {
    const parts = author.trim().split(' ');
    const lastName = parts.pop();
    const initials = parts.map(p => p[0].toUpperCase() + '.').join(' ');
    formattedAuthor = `${lastName}, ${initials}`;
  }

  // 8️⃣ Truncar título si es muy largo (máx 120 caracteres)
  const maxTitle = 120;
  const safeTitle = title.length > maxTitle ? title.slice(0, maxTitle - 1) + '…' : title;

  // 9️⃣ Construir la cita
  const citation = `${formattedAuthor} (${dateStr}). *${safeTitle}*. ${site}. ${finalUrl}`;

  return citation;
}
