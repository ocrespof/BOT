// utils/downloader.js
/**
 * Centralized media downloader for Facebook, Instagram, TikTok, Pinterest, Studocu, Scribd, YouTube, and Google Images.
 * Employs a robust fallback mechanism to ensure high availability.
 */
import config from '../config.js';
import axios from 'axios';
import { cache } from './cache.js';

const delay = ms => new Promise(res => setTimeout(res, ms));

function cacheKey(platform, identifier) {
  return `downloader|${platform}|${identifier}`;
}

/**
 * Generic API fallback executor.
 * Reduces boilerplate for looping through APIs, handling errors, and caching.
 */
async function executeWithFallback(platform, identifier, apis, customOptions = {}) {
  const key = cacheKey(platform, identifier);
  if (!customOptions.skipCache) {
    const cached = cache.get(key);
    if (cached) return cached;
  }

  for (const api of apis) {
    try {
      const isPost = api.method === 'POST';
      const options = {
        timeout: customOptions.timeout || 10000,
        headers: api.headers || {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      };

      let res;
      if (isPost) {
        res = (await axios.post(api.endpoint, api.data, options)).data;
      } else {
        res = (await axios.get(api.endpoint, options)).data;
      }

      const result = api.extractor(res);
      if (result) {
        // Validación para evitar arrays vacíos o respuestas exitosas pero sin datos útiles
        if (Array.isArray(result) && result.length === 0) {
           throw new Error('Empty array result');
        }
        if (result.status === false && !result.data && !result.url) {
           throw new Error('API returned false status');
        }

        if (!customOptions.skipCache) {
          cache.set(key, result);
        }
        return result;
      }
    } catch (e) {
      // Falla silenciosa: el bucle intentará con la siguiente API de respaldo
    }
    await delay(500);
  }
  return null;
}

export async function getFacebookMedia(url) {
  const apis = [
    {
      endpoint: `${config.APIs.stellar.url}/dl/facebook?url=${encodeURIComponent(url)}&key=${config.APIs.stellar.key}`,
      extractor: res => {
        if (!res.status || !Array.isArray(res.resultados)) return null;
        const media = res.resultados.find(x => x.quality?.includes('720p')) || res.resultados.find(x => x.quality?.includes('360p'));
        return media?.url ? { type: 'video', title: null, resolution: media.quality || null, format: 'mp4', url: media.url } : null;
      }
    },
    {
      endpoint: `${config.APIs.ootaizumi.url}/downloader/facebook?url=${encodeURIComponent(url)}`,
      extractor: res => {
        if (!res.status || !res.result?.downloads?.length) return null;
        const media = res.result.downloads.find(x => x.quality?.includes('720p')) || res.result.downloads.find(x => x.quality?.includes('360p'));
        return media?.url ? { type: media.url.includes('.jpg') ? 'image' : 'video', title: null, resolution: media.quality || null, format: media.url.includes('.jpg') ? 'jpg' : 'mp4', url: media.url, thumbnail: res.result.thumbnail || null } : null;
      }
    },
    {
      endpoint: `${config.APIs.vreden.url}/api/v1/download/facebook?url=${encodeURIComponent(url)}`,
      extractor: res => {
        if (!res.status || !res.result?.download) return null;
        const urlVideo = res.result.download.hd || res.result.download.sd;
        return urlVideo ? { type: 'video', title: res.result.title || null, resolution: res.result.download.hd ? 'HD' : 'SD', format: 'mp4', url: urlVideo, thumbnail: res.result.thumbnail || null, duration: res.result.durasi || null } : null;
      }
    },
    {
      endpoint: `${config.APIs.delirius.url}/download/facebook?url=${encodeURIComponent(url)}`,
      extractor: res => {
        if (!res.urls || !Array.isArray(res.urls)) return null;
        const urlVideo = res.urls.find(x => x.hd)?.hd || res.urls.find(x => x.sd)?.sd;
        return urlVideo ? { type: 'video', title: res.title || null, resolution: res.urls.find(x => x.hd)?.hd ? 'HD' : 'SD', format: 'mp4', url: urlVideo } : null;
      }
    }
  ];
  return executeWithFallback('facebook', url, apis);
}

export async function getInstagramMedia(url) {
  const apis = [
    {
      endpoint: `${config.APIs.stellar.url}/dl/instagram?url=${encodeURIComponent(url)}&key=${config.APIs.stellar.key}`,
      extractor: res => {
        if (!res.status || !Array.isArray(res.data) || !res.data.length) return null;
        const urls = res.data.filter(m => m.url).map(m => ({ type: m.tipo === 'video' ? 'video' : 'image', url: m.url }));
        return urls.length ? { isCarousel: urls.length > 1, urls, title: null, caption: null } : null;
      }
    },
    {
      endpoint: `${config.APIs.stellar.url}/dl/instagramv2?url=${encodeURIComponent(url)}&key=${config.APIs.stellar.key}`,
      extractor: res => {
        if (!res.status) return null;
        const mediaUrls = res.data.mediaUrls?.length ? res.data.mediaUrls : [res.data.url].filter(Boolean);
        if (!mediaUrls.length) return null;
        const urls = mediaUrls.map(u => ({ type: u.includes('.mp4') || res.data.type === 'video' ? 'video' : 'image', url: u }));
        return { isCarousel: urls.length > 1, urls, title: res.data.username || null, caption: res.data.caption || null };
      }
    },
    {
      endpoint: `${config.APIs.nekolabs.url}/downloader/instagram?url=${encodeURIComponent(url)}`,
      extractor: res => {
        if (!res.success || !res.result?.downloadUrl?.length) return null;
        const urls = res.result.downloadUrl.map(u => ({ type: u.includes('.mp4') || res.result.metadata?.isVideo ? 'video' : 'image', url: u }));
        return { isCarousel: urls.length > 1, urls, title: res.result.metadata?.username || null, caption: res.result.metadata?.caption || null };
      }
    },
    {
      endpoint: `${config.APIs.delirius.url}/download/instagram?url=${encodeURIComponent(url)}`,
      extractor: res => {
        if (!res.status || !Array.isArray(res.data) || !res.data.length) return null;
        const urls = res.data.filter(m => m.url).map(m => ({ type: m.type === 'video' ? 'video' : 'image', url: m.url }));
        return urls.length ? { isCarousel: urls.length > 1, urls, title: null, caption: null } : null;
      }
    },
    {
      endpoint: `${config.APIs.ootaizumi.url}/downloader/instagram/v2?url=${encodeURIComponent(url)}`,
      extractor: res => {
        if (!res.status || !res.result?.url?.length) return null;
        const urls = res.result.url.filter(m => m.url).map(m => ({ type: m.type === 'mp4' || m.ext === 'mp4' ? 'video' : 'image', url: m.url }));
        return urls.length ? { isCarousel: urls.length > 1, urls, title: res.result.meta?.username || null, caption: res.result.meta?.title || null } : null;
      }
    },
    {
      endpoint: `${config.APIs.ootaizumi.url}/downloader/instagram/v1?url=${encodeURIComponent(url)}`,
      extractor: res => {
        if (!res.status || !res.result?.media?.length) return null;
        const urls = res.result.media.filter(m => m.url).map(m => ({ type: m.isVideo ? 'video' : 'image', url: m.url }));
        return urls.length ? { isCarousel: urls.length > 1, urls, title: res.result.metadata?.author || null, caption: null } : null;
      }
    }
  ];
  return executeWithFallback('instagram', url, apis);
}

export async function getTikTokData(input, isUrl) {
  if (isUrl) {
    const apis = [
      {
        method: 'POST',
        endpoint: 'https://www.tikwm.com/api/',
        data: new URLSearchParams({ url: input, hd: 1 }),
        headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
        extractor: res => {
          if (res && res.code === 0) {
            const d = res.data;
            return {
              status: true,
              data: {
                title: d.title || '',
                duration: d.duration || 0,
                dl: d.images ? d.images : (d.hdplay || d.play),
                author: { nickname: d.author?.nickname || '', unique_id: d.author?.unique_id || '' },
                stats: { likes: d.digg_count || 0, comments: d.comment_count || 0, views: d.play_count || 0, shares: d.share_count || 0 },
                created_at: new Date(d.create_time * 1000).toLocaleDateString(),
                type: d.images ? 'image' : 'video'
              }
            };
          }
          return null;
        }
      },
      { endpoint: `${config.APIs.stellar.url}/dl/tiktok?url=${encodeURIComponent(input)}&key=${config.APIs.stellar.key}`, extractor: res => res.status ? res : null },
      { endpoint: `https://api.ryzendesu.vip/api/downloader/ttdl?url=${encodeURIComponent(input)}`, extractor: res => {
          if (!res.success && !res.data) return null;
          const data = res.data || res;
          return { status: true, data: { title: data.title || '', duration: data.duration || 0, dl: data.play || data.play_url || data.video || (data.images ? data.images : []), author: { nickname: data.author?.nickname || '' }, stats: { likes: data.digg_count || 0 }, type: data.images ? 'image' : 'video' } };
        }
      }
    ];
    return executeWithFallback('tiktok', `${input}|url`, apis);
  } else {
    const apis = [
      { endpoint: `${config.APIs.stellar.url}/search/tiktok?query=${encodeURIComponent(input)}&key=${config.APIs.stellar.key}`, extractor: res => res.status ? res : null },
      { endpoint: `${config.APIs.vreden.url}/api/v1/search/tiktok?query=${encodeURIComponent(input)}`, extractor: res => {
          if (!res.status || !res.result?.search_data) return null;
          const mapped = res.result.search_data.map(v => ({
            title: v.title,
            dl: v.data?.find(d => d.type === 'no_watermark')?.url || v.data?.[0]?.url,
            author: { nickname: v.author?.nickname, unique_id: v.author?.id },
            duration: v.duration,
            stats: { likes: v.stats?.likes, comments: v.stats?.comment, views: v.stats?.views, shares: v.stats?.share }
          }));
          return { status: true, data: mapped };
        }
      }
    ];
    return executeWithFallback('tiktok', `${input}|search`, apis);
  }
}

export async function getPinterestData(input, isUrl) {
  if (isUrl) {
    const apis = [
      { endpoint: `${config.APIs.stellar.url}/dl/pinterest?url=${encodeURIComponent(input)}&key=${config.APIs.stellar.key}`, extractor: res => (res.status && res.data?.dl) ? { type: res.data.type, title: res.data.title || null, author: res.data.author || null, username: res.data.username || null, uploadDate: res.data.uploadDate || null, format: res.data.type === 'video' ? 'mp4' : 'jpg', url: res.data.dl, thumbnail: res.data.thumbnail || null } : null },
      { endpoint: `${config.APIs.vreden.url}/api/v1/download/pinterest?url=${encodeURIComponent(input)}`, extractor: res => {
          if (!res.status || !res.result?.media_urls?.length) return null;
          const media = res.result.media_urls.find(m => m.quality === 'original') || res.result.media_urls[0];
          return media?.url ? { type: media.type, title: res.result.title || null, description: res.result.description || null, author: res.result.uploader?.full_name || null, username: res.result.uploader?.username || null, uploadDate: res.result.created_at || null, likes: res.result.statistics?.likes || null, views: res.result.statistics?.views || null, saved: res.result.statistics?.saved || null, format: media.type, url: media.url } : null;
        }
      },
      { endpoint: `${config.APIs.nekolabs.url}/downloader/pinterest?url=${encodeURIComponent(input)}`, extractor: res => {
          if (!res.success || !res.result?.medias?.length) return null;
          const media = res.result.medias.find(m => m.extension === 'mp4' || m.extension === 'jpg');
          return media?.url ? { type: media.extension === 'mp4' ? 'video' : 'image', title: res.result.title || null, description: null, format: media.extension, url: media.url, thumbnail: res.result.thumbnail || null, duration: res.result.duration || null } : null;
        }
      },
      { endpoint: `${config.APIs.delirius.url}/download/pinterestdl?url=${encodeURIComponent(input)}`, extractor: res => (res.status && res.data?.download?.url) ? { type: res.data.download.type, title: res.data.title || null, description: res.data.description || null, author: res.data.author_name || null, username: res.data.username || null, followers: res.data.followers || null, uploadDate: res.data.upload || null, likes: res.data.likes || null, comments: res.data.comments || null, format: res.data.download.type, url: res.data.download.url, thumbnail: res.data.thumbnail || null, source: res.data.source || null } : null },
      { endpoint: `${config.APIs.ootaizumi.url}/downloader/pinterest?url=${encodeURIComponent(input)}`, extractor: res => (res.status && res.result?.download) ? { type: res.result.download.includes('.mp4') ? 'video' : 'image', title: res.result.title || null, description: null, author: res.result.author?.name || null, username: res.result.author?.username || null, uploadDate: res.result.upload || null, format: res.result.download.includes('.mp4') ? 'mp4' : 'jpg', url: res.result.download, thumbnail: res.result.thumb || null, source: res.result.source || null } : null }
    ];
    return executeWithFallback('pinterest', `${input}|url`, apis);
  } else {
    const endpoints = [`${config.APIs.stellar.url}/search/pinterest?query=${encodeURIComponent(input)}&key=${config.APIs.stellar.key}`, `${config.APIs.stellar.url}/search/pinterestv2?query=${encodeURIComponent(input)}&key=${config.APIs.stellar.key}`, `${config.APIs.delirius.url}/search/pinterestv2?text=${encodeURIComponent(input)}`, `${config.APIs.vreden.url}/api/v1/search/pinterest?query=${encodeURIComponent(input)}`, `${config.APIs.vreden.url}/api/v2/search/pinterest?query=${encodeURIComponent(input)}&limit=10&type=videos`, `${config.APIs.delirius.url}/search/pinterest?text=${encodeURIComponent(input)}`, `${config.APIs.siputzx.url}/api/s/pinterest?query=${encodeURIComponent(input)}&type=image`];
    
    const apis = endpoints.map(endpoint => ({
      endpoint,
      extractor: res => {
        let result = null;
        if (res?.data?.length) {
          result = res.data.map(d => ({ type: 'image', title: d.title || d.grid_title || null, description: d.description || null, name: d.full_name || d.name || d.pinner?.full_name || null, username: d.username || d.pinner?.username || null, followers: d.followers || d.pinner?.follower_count || null, likes: d.likes || d.reaction_counts?.[1] || null, created_at: d.created || d.created_at || null, image: d.hd || d.image || d.image_url || d.images?.orig?.url || d.media_urls?.[0]?.url || d.url || null }));
        } else if (res?.response?.pins?.length) {
          result = res.response.pins.map(p => ({ type: p.media?.video ? 'video' : 'image', title: p.title || null, description: p.description || null, name: p.uploader?.full_name || null, username: p.uploader?.username || null, followers: p.uploader?.followers || null, likes: null, created_at: null, image: p.media?.images?.orig?.url || null }));
        } else if (res?.results?.length) {
          result = res.results.map(url => ({ type: 'image', title: null, description: null, name: null, username: null, followers: null, likes: null, created_at: null, image: typeof url === 'string' ? url : (url.image || url.url || null) }));
        } else if (res?.result?.search_data?.length) {
          result = res.result.search_data.map(url => ({ type: 'image', title: null, description: null, name: null, username: null, followers: null, likes: null, created_at: null, image: typeof url === 'string' ? url : (url.image || url.url || null) }));
        } else if (res?.result?.result?.length) {
          result = res.result.result.map(d => ({ type: d.media_urls?.[0]?.type || 'video', title: d.title || null, description: d.description || null, name: d.uploader?.full_name || null, username: d.uploader?.username || null, followers: d.uploader?.followers || null, likes: null, created_at: null, image: d.media_urls?.[0]?.url || null }));
        }
        return (result && result.length > 0 && result.some(r => r.image)) ? result : null;
      }
    }));
    return executeWithFallback('pinterest', `${input}|search`, apis);
  }
}

export async function getStudocuData(url) {
  const apis = [
    { endpoint: `https://api.ryzendesu.vip/api/downloader/studocu?url=${encodeURIComponent(url)}`, extractor: res => (res.success || res.url || res.data) ? { title: res.title || res.data?.title || 'Documento', url: res.url || res.data?.url || res.download || res.data } : null },
    { endpoint: `${config.APIs.vreden.url}/api/v1/download/studocu?url=${encodeURIComponent(url)}`, extractor: res => (res.status && res.result?.url) ? { title: res.result.title || 'Documento', url: res.result.url } : null },
    { endpoint: `https://api.siputzx.my.id/api/d/studocu?url=${encodeURIComponent(url)}`, extractor: res => (res.status && res.data) ? { title: res.data?.title || 'Documento', url: res.data?.url || res.data } : null },
    { endpoint: `https://api.agatz.xyz/api/studocu?url=${encodeURIComponent(url)}`, extractor: res => (res.status && res.data) ? { title: 'Documento', url: res.data?.url || res.data } : null },
    { endpoint: `https://deliriusapi-official.vercel.app/download/studocu?url=${encodeURIComponent(url)}`, extractor: res => (res.status && res.data) ? { title: res.data.title || 'Documento', url: res.data.download || res.data.url } : null }
  ];
  return executeWithFallback('studocu', url, apis);
}

export async function getYouTubeAudioData(url) {
  const apis = [
    { endpoint: `${config.APIs.axi.url}/down/ytaudio?url=${encodeURIComponent(url)}`, extractor: res => res?.resultado?.url_dl ? { url: res.resultado.url_dl, api: 'Axi' } : null },
    { endpoint: `${config.APIs.ootaizumi.url}/downloader/youtube/play?query=${encodeURIComponent(url)}`, extractor: res => res.result?.download ? { url: res.result.download, api: 'Ootaizumi' } : null },
    { endpoint: `${config.APIs.vreden.url}/api/v1/download/youtube/audio?url=${encodeURIComponent(url)}&quality=256`, extractor: res => res.result?.download?.url ? { url: res.result.download.url, api: 'Vreden' } : null },
    { endpoint: `${config.APIs.stellar.url}/dl/ytdl?url=${encodeURIComponent(url)}&format=mp3&key=${config.APIs.stellar.key}`, extractor: res => res.result?.download ? { url: res.result.download, api: 'Stellar' } : null },
    { endpoint: `${config.APIs.ootaizumi.url}/downloader/youtube?url=${encodeURIComponent(url)}&format=mp3`, extractor: res => res.result?.download ? { url: res.result.download, api: 'Ootaizumi v2' } : null },
    { endpoint: `${config.APIs.vreden.url}/api/v1/download/play/audio?query=${encodeURIComponent(url)}`, extractor: res => res.result?.download?.url ? { url: res.result.download.url, api: 'Vreden v2' } : null },
    { endpoint: `${config.APIs.nekolabs.url}/downloader/youtube/v1?url=${encodeURIComponent(url)}&format=mp3`, extractor: res => res.result?.downloadUrl ? { url: res.result.downloadUrl, api: 'Nekolabs' } : null }
  ];
  return executeWithFallback('youtube_audio', url, apis, { timeout: 15000 });
}

export async function getGoogleImageData(query) {
  const apis = [
    { endpoint: `${config.APIs.stellar.url}/search/googleimagen?query=${encodeURIComponent(query)}&key=${config.APIs.stellar.key}`, extractor: res => res.data?.length ? res.data.map(d => ({ url: d.url, title: d.title || null, domain: d.domain || null, resolution: d.width && d.height ? `${d.width}x${d.height}` : null })) : null },
    { endpoint: `${config.APIs.siputzx.url}/api/images?query=${encodeURIComponent(query)}`, extractor: res => res.data?.length ? res.data.map(d => ({ url: d.url, title: null, domain: null, resolution: d.width && d.height ? `${d.width}x${d.height}` : null })) : null },
    { endpoint: `${config.APIs.delirius.url}/search/gimage?query=${encodeURIComponent(query)}`, extractor: res => res.data?.length ? res.data.map(d => ({ url: d.url, title: d.origin?.title || null, domain: d.origin?.website?.domain || null, resolution: d.width && d.height ? `${d.width}x${d.height}` : null })) : null },
    { endpoint: `${config.APIs.apifaa.url}/faa/google-image?query=${encodeURIComponent(query)}`, extractor: res => res.result?.length ? res.result.map(u => ({ url: u, title: null, domain: null, resolution: null })) : null }
  ];
  return executeWithFallback('google_image', query, apis) || [];
}

export async function getScribdData(url) {
  const apis = [
    { endpoint: `https://api.vreden.my.id/api/v1/download/scribd?url=${encodeURIComponent(url)}`, extractor: res => (res.status && res.result?.download) ? { title: res.result.title || 'Scribd Document', url: res.result.download } : null },
    { endpoint: `https://api.ryzendesu.vip/api/downloader/scribd?url=${encodeURIComponent(url)}`, extractor: res => (res.success || res.url || res.data) ? { title: res.title || 'Scribd Document', url: res.url || res.data || res.download } : null },
    { endpoint: `https://api.siputzx.my.id/api/d/scribd?url=${encodeURIComponent(url)}`, extractor: res => (res.status && res.data) ? { title: res.data.title || 'Scribd Document', url: res.data.url || res.data.download || res.data } : null },
    { endpoint: `https://api.agatz.xyz/api/scribd?url=${encodeURIComponent(url)}`, extractor: res => (res.status && res.data) ? { title: 'Scribd Document', url: res.data } : null },
    { endpoint: `https://deliriusapi-official.vercel.app/download/scribd?url=${encodeURIComponent(url)}`, extractor: res => (res.status && res.data) ? { title: res.data.title || 'Scribd Document', url: res.data.download || res.data.url } : null }
  ];
  return executeWithFallback('scribd', url, apis);
}

export async function isImageUrl(url) {
  try {
    const res = await axios.head(url);
    return res.headers['content-type']?.startsWith('image/');
  } catch {
    return false;
  }
}

// Export a generic dispatcher for ease of use in command files
export async function getMedia(platform, url, options = {}) {
  switch (platform) {
    case 'facebook': return await getFacebookMedia(url);
    case 'instagram': return await getInstagramMedia(url);
    case 'tiktok': return await getTikTokData(url, options.isUrl);
    case 'pinterest': return await getPinterestData(url, options.isUrl);
    case 'studocu': return await getStudocuData(url);
    case 'scribd': return await getScribdData(url);
    case 'youtube_audio': return await getYouTubeAudioData(url);
    case 'google_image': return await getGoogleImageData(url);
    default: throw new Error(`Unsupported platform: ${platform}`);
  }
}
