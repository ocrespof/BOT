// utils/downloader.js
/**
 * Centralized media downloader for Facebook, Instagram, and TikTok.
 * Each function returns a normalized object containing the essential fields
 * needed by the command modules (type, url, title, caption, etc.).
 */
import fetch from 'node-fetch';
import { cache } from './cache.js';

/** Helper to pause between API attempts */
const delay = ms => new Promise(res => setTimeout(res, ms));

function cacheKey(platform, identifier) {
  return `downloader|${platform}|${identifier}`;
}

/** Facebook media extraction (same logic as original fb.js) */
export async function getFacebookMedia(url) {
  const key = cacheKey('facebook', url);
  const cached = cache.get(key);
  if (cached) return cached;
  const apis = [
    {
      endpoint: `${global.APIs.stellar.url}/dl/facebook?url=${encodeURIComponent(url)}&key=${global.APIs.stellar.key}`,
      extractor: res => {
        if (!res.status || !Array.isArray(res.resultados)) return null;
        const hd = res.resultados.find(x => x.quality?.includes('720p'));
        const sd = res.resultados.find(x => x.quality?.includes('360p'));
        const media = hd || sd;
        if (!media?.url) return null;
        return { type: 'video', title: null, resolution: media.quality || null, format: 'mp4', url: media.url };
      },
    },
    {
      endpoint: `${global.APIs.ootaizumi.url}/downloader/facebook?url=${encodeURIComponent(url)}`,
      extractor: res => {
        if (!res.status || !res.result?.downloads?.length) return null;
        const hd = res.result.downloads.find(x => x.quality?.includes('720p'));
        const sd = res.result.downloads.find(x => x.quality?.includes('360p'));
        const media = hd || sd;
        if (!media?.url) return null;
        return { type: media.url.includes('.jpg') ? 'image' : 'video', title: null, resolution: media.quality || null, format: media.url.includes('.jpg') ? 'jpg' : 'mp4', url: media.url, thumbnail: res.result.thumbnail || null };
      },
    },
    {
      endpoint: `${global.APIs.vreden.url}/api/v1/download/facebook?url=${encodeURIComponent(url)}`,
      extractor: res => {
        if (!res.status || !res.result?.download) return null;
        const hd = res.result.download.hd;
        const sd = res.result.download.sd;
        const urlVideo = hd || sd;
        if (!urlVideo) return null;
        return { type: 'video', title: res.result.title || null, resolution: hd ? 'HD' : 'SD', format: 'mp4', url: urlVideo, thumbnail: res.result.thumbnail || null, duration: res.result.durasi || null };
      },
    },
    {
      endpoint: `${global.APIs.delirius.url}/download/facebook?url=${encodeURIComponent(url)}`,
      extractor: res => {
        if (!res.urls || !Array.isArray(res.urls)) return null;
        const hd = res.urls.find(x => x.hd)?.hd;
        const sd = res.urls.find(x => x.sd)?.sd;
        const urlVideo = hd || sd;
        if (!urlVideo) return null;
        return { type: 'video', title: res.title || null, resolution: hd ? 'HD' : 'SD', format: 'mp4', url: urlVideo };
      },
    },
  ];

  for (const { endpoint, extractor } of apis) {
    try {
      const res = await fetch(endpoint).then(r => r.json());
      const result = extractor(res);
      if (result) {
        cache.set(key, result);
        return result;
      }
    } catch (_) { }
    await delay(500);
  }
  return null;
}

/** Instagram media extraction (same logic as original instagram.js) */
export async function getInstagramMedia(url) {
  const key = cacheKey('instagram', url);
  const cached = cache.get(key);
  if (cached) return cached;
  const apis = [
    {
      endpoint: `${global.APIs.stellar.url}/dl/instagram?url=${encodeURIComponent(url)}&key=${global.APIs.stellar.key}`,
      extractor: res => {
        if (!res.status || !Array.isArray(res.data) || !res.data.length) return null;
        const media = res.data[0];
        if (!media?.url) return null;
        return { type: media.tipo === 'video' ? 'video' : 'image', title: null, caption: null, resolution: null, format: media.tipo === 'video' ? 'mp4' : 'jpg', url: media.url };
      },
    },
    {
      endpoint: `${global.APIs.stellar.url}/dl/instagramv2?url=${encodeURIComponent(url)}&key=${global.APIs.stellar.key}`,
      extractor: res => {
        if (!res.status || !res.data?.url) return null;
        const mediaUrl = res.data.mediaUrls?.[0] || res.data.url;
        if (!mediaUrl) return null;
        return {
          type: res.data.type === 'video' ? 'video' : 'image',
          title: res.data.username || null,
          caption: res.data.caption || null,
          resolution: null,
          format: res.data.type === 'video' ? 'mp4' : 'jpg',
          url: mediaUrl,
          thumbnail: res.data.thumbnail || null,
          duration: res.data.videoMeta?.duration ? `${Math.round(res.data.videoMeta.duration)}s` : null,
        };
      },
    },
    {
      endpoint: `${global.APIs.nekolabs.url}/downloader/instagram?url=${encodeURIComponent(url)}`,
      extractor: res => {
        if (!res.success || !res.result?.downloadUrl?.length) return null;
        const mediaUrl = res.result.downloadUrl[0];
        if (!mediaUrl) return null;
        return {
          type: res.result.metadata?.isVideo ? 'video' : 'image',
          title: res.result.metadata?.username || null,
          caption: res.result.metadata?.caption || null,
          like: res.result.metadata?.like || null,
          comment: res.result.metadata?.comment || null,
          resolution: null,
          format: res.result.metadata?.isVideo ? 'mp4' : 'jpg',
          url: mediaUrl,
        };
      },
    },
    {
      endpoint: `${global.APIs.delirius.url}/download/instagram?url=${encodeURIComponent(url)}`,
      extractor: res => {
        if (!res.status || !Array.isArray(res.data) || !res.data.length) return null;
        const media = res.data[0];
        if (!media?.url) return null;
        return { type: media.type === 'video' ? 'video' : 'image', title: null, caption: null, resolution: null, format: media.type === 'video' ? 'mp4' : 'jpg', url: media.url };
      },
    },
    {
      endpoint: `${global.APIs.ootaizumi.url}/downloader/instagram/v2?url=${encodeURIComponent(url)}`,
      extractor: res => {
        if (!res.status || !res.result?.url?.length) return null;
        const media = res.result.url[0];
        if (!media?.url) return null;
        return {
          type: media.type === 'mp4' ? 'video' : 'image',
          title: res.result.meta?.username || null,
          caption: res.result.meta?.title || null,
          like: res.result.meta?.like_count || null,
          comment: res.result.meta?.comment_count || null,
          resolution: null,
          format: media.ext || null,
          url: media.url,
          thumbnail: res.result.thumb || null,
        };
      },
    },
    {
      endpoint: `${global.APIs.ootaizumi.url}/downloader/instagram/v1?url=${encodeURIComponent(url)}`,
      extractor: res => {
        if (!res.status || !res.result?.media?.length) return null;
        const media = res.result.media[0];
        if (!media?.url) return null;
        return {
          type: media.isVideo ? 'video' : 'image',
          title: res.result.metadata?.author || null,
          caption: null,
          like: res.result.metadata?.like || null,
          views: res.result.metadata?.views || null,
          duration: res.result.metadata?.duration ? `${Math.round(res.result.metadata.duration)}s` : null,
          resolution: null,
          format: media.isVideo ? 'mp4' : 'jpg',
          url: media.url,
          thumbnail: res.result.ppc || null,
        };
      },
    },
  ];

  for (const { endpoint, extractor } of apis) {
    try {
      const res = await fetch(endpoint).then(r => r.json());
      const result = extractor(res);
      if (result) return result;
    } catch (_) { }
    await delay(500);
  }
  return null;
}

/** TikTok handling – supports direct URL download and search queries */
export async function getTikTokData(input, isUrl) {
  const cacheIdentifier = isUrl ? `${input}|url` : `${input}|search`;
  const key = cacheKey('tiktok', cacheIdentifier);
  const cached = cache.get(key);
  if (cached) return cached;
  const endpoint = isUrl
    ? `${global.APIs.stellar.url}/dl/tiktok?url=${encodeURIComponent(input)}&key=${global.APIs.stellar.key}`
    : `${global.APIs.stellar.url}/search/tiktok?query=${encodeURIComponent(input)}&key=${global.APIs.stellar.key}`;
  try {
    const res = await fetch(endpoint);
    if (!res.ok) throw new Error(`Server responded with ${res.status}`);
    const json = await res.json();
    if (!json.status) return null;
    cache.set(key, json);
    return json;
  } catch (e) {
    console.warn('TikTok fetch error:', e.message);
    return null;
  }
}

export async function getPinterestData(input, isUrl) {
  const cacheIdentifier = isUrl ? `${input}|url` : `${input}|search`;
  const key = cacheKey('pinterest', cacheIdentifier);
  const cached = cache.get(key);
  if (cached) return cached;

  if (isUrl) {
    const apis = [
      {
        endpoint: `${global.APIs.stellar.url}/dl/pinterest?url=${encodeURIComponent(input)}&key=${global.APIs.stellar.key}`, extractor: res => {
          if (!res.status || !res.data?.dl) return null;
          return { type: res.data.type, title: res.data.title || null, author: res.data.author || null, username: res.data.username || null, uploadDate: res.data.uploadDate || null, format: res.data.type === 'video' ? 'mp4' : 'jpg', url: res.data.dl, thumbnail: res.data.thumbnail || null };
        }
      },
      {
        endpoint: `${global.APIs.vreden.url}/api/v1/download/pinterest?url=${encodeURIComponent(input)}`, extractor: res => {
          if (!res.status || !res.result?.media_urls?.length) return null;
          const media = res.result.media_urls.find(m => m.quality === 'original') || res.result.media_urls[0];
          if (!media?.url) return null;
          return { type: media.type, title: res.result.title || null, description: res.result.description || null, author: res.result.uploader?.full_name || null, username: res.result.uploader?.username || null, uploadDate: res.result.created_at || null, likes: res.result.statistics?.likes || null, views: res.result.statistics?.views || null, saved: res.result.statistics?.saved || null, format: media.type, url: media.url };
        }
      },
      {
        endpoint: `${global.APIs.nekolabs.url}/downloader/pinterest?url=${encodeURIComponent(input)}`, extractor: res => {
          if (!res.success || !res.result?.medias?.length) return null;
          const media = res.result.medias.find(m => m.extension === 'mp4' || m.extension === 'jpg');
          if (!media?.url) return null;
          return { type: media.extension === 'mp4' ? 'video' : 'image', title: res.result.title || null, description: null, format: media.extension, url: media.url, thumbnail: res.result.thumbnail || null, duration: res.result.duration || null };
        }
      },
      {
        endpoint: `${global.APIs.delirius.url}/download/pinterestdl?url=${encodeURIComponent(input)}`, extractor: res => {
          if (!res.status || !res.data?.download?.url) return null;
          return { type: res.data.download.type, title: res.data.title || null, description: res.data.description || null, author: res.data.author_name || null, username: res.data.username || null, followers: res.data.followers || null, uploadDate: res.data.upload || null, likes: res.data.likes || null, comments: res.data.comments || null, format: res.data.download.type, url: res.data.download.url, thumbnail: res.data.thumbnail || null, source: res.data.source || null };
        }
      },
      {
        endpoint: `${global.APIs.ootaizumi.url}/downloader/pinterest?url=${encodeURIComponent(input)}`, extractor: res => {
          if (!res.status || !res.result?.download) return null;
          return { type: res.result.download.includes('.mp4') ? 'video' : 'image', title: res.result.title || null, description: null, author: res.result.author?.name || null, username: res.result.author?.username || null, uploadDate: res.result.upload || null, format: res.result.download.includes('.mp4') ? 'mp4' : 'jpg', url: res.result.download, thumbnail: res.result.thumb || null, source: res.result.source || null };
        }
      }
    ];

    for (const { endpoint, extractor } of apis) {
      try {
        const res = await fetch(endpoint).then(r => r.json());
        const result = extractor(res);
        if (result) {
          cache.set(key, result);
          return result;
        }
      } catch (_) { }
      await delay(500);
    }
    return null;
  } else {
    const apis = [`${global.APIs.stellar.url}/search/pinterest?query=${encodeURIComponent(input)}&key=${global.APIs.stellar.key}`, `${global.APIs.stellar.url}/search/pinterestv2?query=${encodeURIComponent(input)}&key=${global.APIs.stellar.key}`, `${global.APIs.delirius.url}/search/pinterestv2?text=${encodeURIComponent(input)}`, `${global.APIs.vreden.url}/api/v1/search/pinterest?query=${encodeURIComponent(input)}`, `${global.APIs.vreden.url}/api/v2/search/pinterest?query=${encodeURIComponent(input)}&limit=10&type=videos`, `${global.APIs.delirius.url}/search/pinterest?text=${encodeURIComponent(input)}`, `${global.APIs.siputzx.url}/api/s/pinterest?query=${encodeURIComponent(input)}&type=image`];

    for (const endpoint of apis) {
      try {
        const res = await fetch(endpoint).then(r => r.json());
        let result = null;
        if (res?.data?.length) {
          result = res.data.map(d => ({ type: 'image', title: d.title || null, description: d.description || null, name: d.full_name || d.name || null, username: d.username || null, followers: d.followers || null, likes: d.likes || null, created_at: d.created || d.created_at || null, image: d.hd || d.image || null }));
        } else if (res?.response?.pins?.length) {
          result = res.response.pins.map(p => ({ type: p.media?.video ? 'video' : 'image', title: p.title || null, description: p.description || null, name: p.uploader?.full_name || null, username: p.uploader?.username || null, followers: p.uploader?.followers || null, likes: null, created_at: null, image: p.media?.images?.orig?.url || null }));
        } else if (res?.results?.length) {
          result = res.results.map(url => ({ type: 'image', title: null, description: null, name: null, username: null, followers: null, likes: null, created_at: null, image: url }));
        } else if (res?.result?.search_data?.length) {
          result = res.result.search_data.map(url => ({ type: 'image', title: null, description: null, name: null, username: null, followers: null, likes: null, created_at: null, image: url }));
        } else if (res?.result?.result?.length) {
          result = res.result.result.map(d => ({ type: d.media_urls?.[0]?.type || 'video', title: d.title || null, description: d.description || null, name: d.uploader?.full_name || null, username: d.uploader?.username || null, followers: d.uploader?.followers || null, likes: null, created_at: null, image: d.media_urls?.[0]?.url || null }));
        } else if (res?.data?.length && res.data[0]?.image_url) {
          result = res.data.map(d => ({ type: d.type || 'image', title: d.grid_title || null, description: d.description || null, name: d.pinner?.full_name || null, username: d.pinner?.username || null, followers: d.pinner?.follower_count || null, likes: d.reaction_counts?.[1] || null, created_at: d.created_at || null, image: d.image_url || null }));
        }

        if (result && result.length > 0) {
          cache.set(key, result);
          return result;
        }
      } catch (_) { }
    }
    return [];
  }
}

export async function getStudocuData(url) {
  const key = cacheKey('studocu', url);
  const cached = cache.get(key);
  if (cached) return cached;

  const customHeaders = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  };

  const apis = [
    { endpoint: `https://api.ryzendesu.vip/api/downloader/studocu?url=${encodeURIComponent(url)}`, extractor: res => {
        if (!res.success && !res.url) return null;
        return { title: res.title || res.data?.title || 'Documento', url: res.url || res.data?.url || res.download };
      }
    },
    { endpoint: `${global.APIs.vreden.url}/api/studocu?url=${encodeURIComponent(url)}`, extractor: res => {
        if (!res.status || !res.result?.url) return null;
        return { title: res.result.title || null, url: res.result.url };
      }
    },
    { endpoint: `https://api.siputzx.my.id/api/d/studocu?url=${encodeURIComponent(url)}`, extractor: res => {
        if (!res.status || !res.data) return null;
        return { title: res.data?.title || null, url: res.data?.url || res.data };
      }
    },
    { endpoint: `https://api.agatz.xyz/api/studocu?url=${encodeURIComponent(url)}`, extractor: res => {
        if (!res.status || !res.data) return null;
        return { title: null, url: res.data };
      }
    }
  ];

  for (const { endpoint, extractor } of apis) {
    try {
      const res = await fetch(endpoint, { headers: customHeaders }).then(r => r.json());
      const result = extractor(res);
      if (result && result.url) {
        cache.set(key, result);
        return result;
      }
    } catch {}
    await delay(500);
  }
  return null;
}

export async function getYouTubeAudioData(url) {
  const key = cacheKey('youtube_audio', url);
  const cached = cache.get(key);
  if (cached) return cached;

  const apis = [
    { api: 'Axi', endpoint: `${global.APIs.axi.url}/down/ytaudio?url=${encodeURIComponent(url)}`, extractor: res => res?.resultado?.url_dl },    
    { api: 'Ootaizumi', endpoint: `${global.APIs.ootaizumi.url}/downloader/youtube/play?query=${encodeURIComponent(url)}`, extractor: res => res.result?.download },
    { api: 'Vreden', endpoint: `${global.APIs.vreden.url}/api/v1/download/youtube/audio?url=${encodeURIComponent(url)}&quality=256`, extractor: res => res.result?.download?.url },
    { api: 'Stellar', endpoint: `${global.APIs.stellar.url}/dl/ytdl?url=${encodeURIComponent(url)}&format=mp3&key=${global.APIs.stellar.key}`, extractor: res => res.result?.download },
    { api: 'Ootaizumi v2', endpoint: `${global.APIs.ootaizumi.url}/downloader/youtube?url=${encodeURIComponent(url)}&format=mp3`, extractor: res => res.result?.download },
    { api: 'Vreden v2', endpoint: `${global.APIs.vreden.url}/api/v1/download/play/audio?query=${encodeURIComponent(url)}`, extractor: res => res.result?.download?.url },
    { api: 'Nekolabs', endpoint: `${global.APIs.nekolabs.url}/downloader/youtube/v1?url=${encodeURIComponent(url)}&format=mp3`, extractor: res => res.result?.downloadUrl },
    { api: 'Nekolabs v2', endpoint: `${global.APIs.nekolabs.url}/downloader/youtube/play/v1?q=${encodeURIComponent(url)}`, extractor: res => res.result?.downloadUrl }
  ];

  for (const { api, endpoint, extractor } of apis) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      const res = await fetch(endpoint, { signal: controller.signal }).then(r => r.json());
      clearTimeout(timeout);
      const link = extractor(res);
      if (link) {
        const result = { url: link, api };
        cache.set(key, result);
        return result;
      }
    } catch (e) {}
    await delay(500);
  }
  return null;
}

export async function getGoogleImageData(query) {
  const key = cacheKey('google_image', query);
  const cached = cache.get(key);
  if (cached) return cached;

  const endpoints = [
    { url: `${global.APIs.stellar.url}/search/googleimagen?query=${encodeURIComponent(query)}&key=${global.APIs.stellar.key}`, extractor: res => res.data?.map(d => ({ url: d.url, title: d.title || null, domain: d.domain || null, resolution: d.width && d.height ? `${d.width}x${d.height}` : null })) || [] },
    { url: `${global.APIs.siputzx.url}/api/images?query=${encodeURIComponent(query)}`, extractor: res => res.data?.map(d => ({ url: d.url, title: null, domain: null, resolution: d.width && d.height ? `${d.width}x${d.height}` : null })) || [] },
    { url: `${global.APIs.delirius.url}/search/gimage?query=${encodeURIComponent(query)}`, extractor: res => res.data?.map(d => ({ url: d.url, title: d.origin?.title || null, domain: d.origin?.website?.domain || null, resolution: d.width && d.height ? `${d.width}x${d.height}` : null })) || [] },
    { url: `${global.APIs.apifaa.url}/faa/google-image?query=${encodeURIComponent(query)}`, extractor: res => res.result?.map(u => ({ url: u, title: null, domain: null, resolution: null })) || [] }
  ];
  
  for (const { url, extractor } of endpoints) {
    try {
      const res = await fetch(url).then(r => r.json());
      const results = extractor(res);
      if (results?.length) {
        cache.set(key, results);
        return results;
      }
    } catch {}
  }
  return [];
}

export async function isImageUrl(url) {
  try {
    const res = await fetch(url, { method: 'HEAD' });
    return res.headers.get('content-type')?.startsWith('image/');
  } catch {
    return false;
  }
}

// Export a generic dispatcher for ease of use in command files
export async function getMedia(platform, url, options = {}) {
  switch (platform) {
    case 'facebook':
      return await getFacebookMedia(url);
    case 'instagram':
      return await getInstagramMedia(url);
    case 'tiktok':
      return await getTikTokData(url, options.isUrl);
    case 'pinterest':
      return await getPinterestData(url, options.isUrl);
    case 'studocu':
      return await getStudocuData(url);
    case 'youtube_audio':
      return await getYouTubeAudioData(url);
    case 'google_image':
      return await getGoogleImageData(url);
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}

