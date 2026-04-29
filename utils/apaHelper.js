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

  // Intentar extraer metadatos de JSON-LD (Schema.org)
  let ldJson = null;
  $('script[type="application/ld+json"]').each((i, el) => {
    try {
      const data = JSON.parse($(el).html());
      if (data['@type'] === 'Article' || data['@type'] === 'NewsArticle' || data['@type'] === 'WebPage') {
        ldJson = data;
      }
    } catch (e) {}
  });

  const title = ldJson?.headline || ldJson?.name || $('title').first().text().trim() || 'Documento sin título';
  const site =
    ldJson?.publisher?.name ||
    $('meta[property="og:site_name"]').attr('content') ||
    $('meta[name="application-name"]').attr('content') ||
    new URL(finalUrl).hostname.replace('www.', '');

  // 5️⃣ Autor (varios patrones y JSON-LD)
  let author = 'Autor Anónimo / Institucional';
  if (ldJson?.author?.name) {
    author = ldJson.author.name;
  } else if (Array.isArray(ldJson?.author) && ldJson.author[0]?.name) {
    author = ldJson.author[0].name;
  } else {
    author =
      $('meta[name="author"]').attr('content') ||
      $('meta[property="article:author"]').attr('content') ||
      $('meta[name="citation_author"]').attr('content') ||
      author;
  }

  // 6️⃣ Fecha
  let dateStr = 's.f.';
  const dateMeta =
    ldJson?.datePublished ||
    $('meta[name="citation_date"]').attr('content') ||
    $('meta[property="article:published_time"]').attr('content') ||
    null;
  if (dateMeta) {
    const d = new Date(dateMeta);
    if (!isNaN(d.getTime())) {
      const months = [
        'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
        'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
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

  // 9️⃣ Construir la cita (BibGuru / APA 7 Style)
  const citation = `${formattedAuthor}. (${dateStr}). _${safeTitle}_. ${site}. ${finalUrl}`;

  return citation;
}
