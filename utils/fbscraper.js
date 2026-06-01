// utils/fbscraper.js
/**
 * Facebook GraphQL Scraper — Busca usuarios, videos y fotos en Facebook.
 * Basado en el scraper de Ado (2026), mejorado para el ecosistema YukiBot.
 * Usa axios en lugar de node-fetch para consistencia con el proyecto.
 */
import axios from 'axios';

// --- Configuración ---
const FB_COOKIES = [
  { name: "datr", value: "3H0KagKVy04s29ssF98-WSmO" },
  { name: "sb", value: "3H0KajCaDC3fIQ7DCs7TmE8k" },
  { name: "c_user", value: "61589734632097" },
  { name: "xs", value: "48%3ArnyxX0VX-Zfo6w%3A2%3A1779072562%3A-1%3A-1%3A%3AAcwvd6NMHQS0Y3aIbYnB81X24lTq698wJ7MkORPYHA" },
  { name: "fr", value: "1EJ4nDpNhzRoDMyyi.AWdKEdDm8izeYubi1NZIxfRag1Yvc5Y1KHejjLiDoDtVAjbh50k.BqCn5M..AAA.0.0.BqCn5P.AWexcoYrrh2Zz15vIPTfrweQw2c" },
  { name: "presence", value: "C%7B%22t3%22%3A%5B%5D%2C%22utc3%22%3A1779072597776%2C%22v%22%3A1%7D" },
  { name: "wd", value: "1366x633" }
];

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const FB_BASE = "https://www.facebook.com";
const GRAPHQL_URL = `${FB_BASE}/api/graphql/`;
const SEARCH_DOC_ID = "27004494905847061";

// --- Helpers ---
function getCookieString() {
  return FB_COOKIES.map(c => `${c.name}=${c.value}`).join("; ");
}

async function getSessionTokens() {
  const cookieStr = getCookieString();
  const { data: html } = await axios.get(FB_BASE, {
    headers: {
      "User-Agent": UA,
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "es-LA,es;q=0.9",
      "sec-ch-ua": '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
      "sec-fetch-dest": "document",
      "sec-fetch-mode": "navigate",
      "sec-fetch-site": "none",
      "sec-fetch-user": "?1",
      "upgrade-insecure-requests": "1",
      Cookie: cookieStr,
    },
    timeout: 15000
  });

  const extract = (p) => { const m = html.match(p); return m ? m[1] : ""; };

  const fb_dtsg = extract(/\["DTSGInitData",\[\],\{"token":"([^"]+)"/) || extract(/"dtsg":\{"token":"([^"]+)"/);
  const lsd = extract(/\["LSD",\[\],\{"token":"([^"]+)"/) || extract(/name="lsd"\s+value="([^"]+)"/);
  const hsi = extract(/"hsi":"(\d+)"/) || Date.now().toString();
  const rev = extract(/"server_revision":(\d+)/) || extract(/"__spin_r":(\d+)/) || "1039686045";
  const jazoest = extract(/jazoest=(\d+)/) || extract(/"jazoest["\s:]+(\d+)/) || "25227";
  const hs = extract(/"haste_session":"([^"]+)"/) || "20591.HYP:comet_pkg.2.1...0";
  const userId = extract(/"USER_ID":"(\d+)"/);

  if (!fb_dtsg || !userId || userId === "0") {
    throw new Error("Cookies de Facebook inválidas o expiradas.");
  }

  return { fb_dtsg, lsd, hsi, rev, jazoest, hs, userId, cookieStr };
}

function buildSearchVariables(query, limit) {
  return {
    allow_streaming: false,
    args: {
      callsite: "COMET_GLOBAL_SEARCH",
      config: { exact_match: false, high_confidence_config: null, intercept_config: null, sts_disambiguation: null, watch_config: null },
      context: { bsid: crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`, tsid: Math.random().toString() },
      experience: { client_defined_experiences: ["ADS_PARALLEL_FETCH"], encoded_server_defined_params: null, fbid: null, type: "GLOBAL_SEARCH" },
      filters: [],
      text: query
    },
    count: limit,
    cursor: null,
    feedLocation: "SEARCH",
    feedbackSource: 23,
    fetch_filters: true,
    focusCommentID: null,
    locale: null,
    privacySelectorRenderLocation: "COMET_STREAM",
    referringStoryRenderLocation: null,
    renderLocation: "search_results_page",
    scale: 1,
    stream_initial_count: 0,
    useDefaultActor: false,
    // relay internal providers (required by FB GraphQL)
    "__relay_internal__pv__GHLShouldChangeAdIdFieldNamerelayprovider": true,
    "__relay_internal__pv__GHLShouldChangeSponsoredDataFieldNamerelayprovider": true,
    "__relay_internal__pv__CometFeedStory_enable_reactor_facepilerelayprovider": false,
    "__relay_internal__pv__CometFeedStory_enable_post_permalink_white_space_clickrelayprovider": false,
    "__relay_internal__pv__CometUFICommentActionLinksRewriteEnabledrelayprovider": false,
    "__relay_internal__pv__CometUFICommentAvatarStickerAnimatedImagerelayprovider": true,
    "__relay_internal__pv__IsWorkUserrelayprovider": false,
    "__relay_internal__pv__TestPilotShouldIncludeDemoAdUseCaserelayprovider": false,
    "__relay_internal__pv__FBReels_deprecate_short_form_video_context_gkrelayprovider": true,
    "__relay_internal__pv__FBReels_enable_view_dubbed_audio_type_gkrelayprovider": true,
    "__relay_internal__pv__CometFeedShareMedia_shouldPrefetchShareImagerelayprovider": false,
    "__relay_internal__pv__CometImmersivePhotoCanUserDisable3DMotionrelayprovider": false,
    "__relay_internal__pv__WorkCometIsEmployeeGKProviderrelayprovider": false,
    "__relay_internal__pv__IsMergQAPollsrelayprovider": false,
    "__relay_internal__pv__FBReelsMediaFooter_comet_enable_reels_ads_gkrelayprovider": true,
    "__relay_internal__pv__CometUFIReactionsEnableShortNamerelayprovider": false,
    "__relay_internal__pv__CometUFICommentAutoTranslationTyperelayprovider": "AUTO_TRANSLATE",
    "__relay_internal__pv__CometUFIShareActionMigrationrelayprovider": true,
    "__relay_internal__pv__CometUFISingleLineUFIrelayprovider": true,
    "__relay_internal__pv__relay_provider_comet_ufi_ssr_seo_deferrelayprovider": true,
    "__relay_internal__pv__CometUFI_dedicated_comment_routable_dialog_gkrelayprovider": true,
    "__relay_internal__pv__ReelsIFUCard_reelsIFULikeCountrelayprovider": true,
    "__relay_internal__pv__FBReelsIFUTileContent_reelsIFUPlayOnHoverrelayprovider": true,
    "__relay_internal__pv__GroupsCometGYSJFeedItemHeightrelayprovider": 206,
    "__relay_internal__pv__ShouldEnableBakedInTextStoriesrelayprovider": false,
    "__relay_internal__pv__StoriesShouldIncludeFbNotesrelayprovider": true
  };
}

function buildBody(tokens, friendlyName, docId, variables) {
  const p = new URLSearchParams();
  p.set("av", tokens.userId);
  p.set("__user", tokens.userId);
  p.set("__a", "1");
  p.set("__req", "a");
  p.set("__hs", tokens.hs);
  p.set("dpr", "1");
  p.set("__ccg", "GOOD");
  p.set("__rev", tokens.rev);
  p.set("__hsi", tokens.hsi);
  p.set("__comet_req", "15");
  p.set("fb_dtsg", tokens.fb_dtsg);
  p.set("jazoest", tokens.jazoest);
  p.set("lsd", tokens.lsd);
  p.set("fb_api_caller_class", "RelayModern");
  p.set("fb_api_req_friendly_name", friendlyName);
  p.set("variables", JSON.stringify(variables));
  p.set("server_timestamps", "true");
  p.set("doc_id", docId);
  return p.toString();
}

// --- Parser de respuestas GraphQL ---
function parseEdges(text) {
  const usersMap = new Map();
  const videos = [];
  const photos = [];

  for (const line of text.split("\n")) {
    try {
      const j = JSON.parse(line);
      const edges = j?.data?.serpResponse?.results?.edges || [];
      
      for (const edge of edges) {
        const node = edge.node || {};
        if (node.__typename === "User" || node.__typename === "Page") {
          if (!usersMap.has(node.id)) {
            usersMap.set(node.id, {
              id: node.id,
              name: node.name || "",
              url: node.url || `${FB_BASE}/${node.id}`,
              verified: node.is_verified || false,
              avatar: node.profile_picture?.uri || ""
            });
          }
        }

        const story = edge.rendering_strategy?.view_model?.click_model?.story;
        if (!story) continue;

        const owner = story.feedback?.owning_profile || {};
        const s = JSON.stringify(edge);

        if (owner.id && !usersMap.has(owner.id)) {
          usersMap.set(owner.id, {
            id: owner.id,
            name: owner.name || "",
            url: (s.match(/"profile_url":\s*"([^"]+)"/) || [])[1] || `${FB_BASE}/${owner.id}`,
            verified: false,
            avatar: (s.match(/"profile_picture":\{"uri":"([^"]+)"/) || [])[1] || ""
          });
        }

        const statsObj = {
          likes: parseInt((s.match(/"reaction_count":\s*\{"count":\s*(\d+)/) || s.match(/"reaction_count":(\d+)/) || [])[1] || "0"),
          comments: parseInt((s.match(/"total_comment_count":\s*(\d+)/) || [])[1] || "0"),
          shares: parseInt((s.match(/"share_count":\s*\{"count":\s*(\d+)/) || s.match(/"share_count":(\d+)/) || [])[1] || "0"),
          views: parseInt((s.match(/"video_view_count":\s*(\d+)/) || [])[1] || "0")
        };

        const postText = ((s.match(/"message":\s*\{"text":\s*"([^"]+)"/) || s.match(/"text":"([^"]+)"/) || [])[1] || "")
          .replace(/\\n/g, "\n")
          .replace(/\\u[\dA-F]{4}/gi, match => String.fromCharCode(parseInt(match.replace(/\\u/g, ''), 16)));

        const sd_url = (s.match(/"progressive_url":"([^"]+)","failure_reason":null,"metadata":\{"quality":"SD"\}/) || [])[1] || "";
        const hd_url = (s.match(/"progressive_url":"([^"]+)","failure_reason":null,"metadata":\{"quality":"HD"\}/) || [])[1] || "";
        const fallback_url = (s.match(/"playable_url":"([^"]+)"/) || [])[1] || "";
        const fallback_hd = (s.match(/"playable_url_quality_hd":"([^"]+)"/) || [])[1] || "";
        
        const duration_ms = parseInt((s.match(/"playable_duration_in_ms":(\d+)/) || [])[1] || "0");
        const duration_sec = duration_ms > 0 ? Math.floor(duration_ms / 1000) : parseInt((s.match(/"length_in_second":([\d\.]+)/) || [])[1] || "0");
        
        const thumb = (s.match(/"first_frame_thumbnail":"([^"]+)"/) || s.match(/"preferred_thumbnail":\{"image":\{"uri":"([^"]+)"/) || [])[1] || "";
        const photo_url = (s.match(/"image":\{"uri":"([^"]+)"/) || s.match(/"photo_image":\{"uri":"([^"]+)"/) || [])[1] || "";
        const w = parseInt((s.match(/"original_width":(\d+)/) || s.match(/"width":(\d+)/) || [])[1] || "0");
        const h = parseInt((s.match(/"original_height":(\d+)/) || s.match(/"height":(\d+)/) || [])[1] || "0");

        let foundMedia = false;

        for (const att of story.attachments || []) {
          const media = att.media || att.styles?.attachment?.media;
          if (!media) continue;

          if (media.__typename === "Video" || s.includes('"__isMedia":"Video"')) {
            foundMedia = true;
            videos.push({
              id: story.id || media.id || "",
              author_id: owner.id || "",
              text: postText,
              media_type: "Video",
              thumbnail: (thumb || media.first_frame_thumbnail || media.preferred_thumbnail?.image?.uri || "").replace(/\\/g, ''),
              url: ((s.match(/"url":\s*"(https:\/\/www\.facebook\.com\/[^"]+)"/) || [])[1] || media.playable_url || "").replace(/\\/g, ''),
              download_sd: (sd_url || fallback_url || media.playable_url || "").replace(/\\/g, ''),
              download_hd: (hd_url || fallback_hd || media.playable_url_quality_hd || "").replace(/\\/g, ''),
              duration: duration_sec || media.length_in_second || 0,
              width: w || media.original_width || media.width || 0,
              height: h || media.original_height || media.height || 0,
              stats: statsObj
            });
          } else if (media.__typename === "Photo" || s.includes('"__isMedia":"Photo"') || s.includes('PhotoAttachment')) {
            foundMedia = true;
            photos.push({
              id: story.id || media.id,
              author_id: owner.id || "",
              text: postText,
              media_type: "Photo",
              url: ((s.match(/"url":\s*"(https:\/\/www\.facebook\.com\/[^"]+)"/) || [])[1] || media.image?.uri || "").replace(/\\/g, ''),
              download_url: (photo_url || media.image?.uri || media.photo_image?.uri || "").replace(/\\/g, ''),
              width: w || media.original_width || media.width || 0,
              height: h || media.original_height || media.height || 0,
              stats: statsObj
            });
          }
        }
        
        // Fallback: si no entramos en attachments pero detectamos media por regex
        if (!foundMedia && sd_url) {
          videos.push({
            id: story.id || "",
            author_id: owner.id || "",
            text: postText,
            media_type: "Video",
            thumbnail: thumb.replace(/\\/g, ''),
            url: ((s.match(/"url":\s*"(https:\/\/www\.facebook\.com\/[^"]+)"/) || [])[1] || "").replace(/\\/g, ''),
            download_sd: sd_url.replace(/\\/g, ''),
            download_hd: hd_url.replace(/\\/g, ''),
            duration: duration_sec,
            width: w,
            height: h,
            stats: statsObj
          });
        } else if (!foundMedia && photo_url && !sd_url) {
          photos.push({
            id: story.id || "",
            author_id: owner.id || "",
            text: postText,
            media_type: "Photo",
            url: ((s.match(/"url":\s*"(https:\/\/www\.facebook\.com\/[^"]+)"/) || [])[1] || "").replace(/\\/g, ''),
            download_url: photo_url.replace(/\\/g, ''),
            width: w,
            height: h,
            stats: statsObj
          });
        }
      }
    } catch { /* línea no parseó, continuar */ }
  }
  return {
    users: Array.from(usersMap.values()),
    videos,
    photos
  };
}

// --- API Pública ---

/**
 * Busca contenido en Facebook usando GraphQL.
 * @param {string} query - Texto de búsqueda
 * @param {number} limit - Máximo de resultados (default 10)
 * @returns {{ users: Array, videos: Array, photos: Array, stats: Object }}
 */
export async function searchFacebook(query, limit = 10) {
  const tokens = await getSessionTokens();
  const variables = buildSearchVariables(query, limit);
  const body = buildBody(tokens, "SearchCometResultsPaginatedResultsQuery", SEARCH_DOC_ID, variables);

  const { data: text } = await axios.post(GRAPHQL_URL, body, {
    headers: {
      "User-Agent": UA,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "*/*",
      Referer: `${FB_BASE}/search/top/?q=${encodeURIComponent(query)}`,
      "x-fb-friendly-name": "SearchCometResultsPaginatedResultsQuery",
      "x-fb-lsd": tokens.lsd,
      "x-asbd-id": "359341",
      "sec-ch-ua": '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      Origin: FB_BASE,
      Cookie: tokens.cookieStr,
    },
    timeout: 20000,
    // axios devuelve string si no es JSON válido (multi-line NDJSON)
    transformResponse: [data => data]
  });

  if (text.includes("errorSummary")) {
    try {
      const errObj = JSON.parse(text.split("\n")[0].replace("for (;;);", ""));
      if (errObj.errorSummary) throw new Error(`${errObj.errorSummary}: ${errObj.errorDescription}`);
    } catch (e) {
      if (e.message.includes("errorSummary")) throw e;
    }
  }

  const { users, videos, photos } = parseEdges(text);
  return {
    query,
    limit,
    stats: { users: users.length, videos: videos.length, photos: photos.length },
    users,
    videos,
    photos
  };
}

/**
 * Descarga directa de un video de Facebook por URL usando el scraper GraphQL.
 * Intenta extraer la URL directa HD/SD del video.
 * Se usa como fallback final en getFacebookMedia().
 * @param {string} fbUrl - URL del video/post de Facebook
 * @returns {{ type, title, resolution, url, thumbnail, duration }} | null
 */
export async function scrapeFacebookVideo(fbUrl) {
  try {
    // Buscar el post en Facebook usando una query derivada de la URL
    const result = await searchFacebook(fbUrl, 5);
    if (result.videos.length > 0) {
      const v = result.videos[0];
      const dlUrl = v.download_hd || v.download_sd;
      if (dlUrl) {
        return {
          type: 'video',
          title: v.text?.slice(0, 100) || null,
          resolution: v.download_hd ? 'HD' : 'SD',
          format: 'mp4',
          url: dlUrl,
          thumbnail: v.thumbnail || null,
          duration: v.duration || null
        };
      }
    }
    return null;
  } catch {
    return null;
  }
}
