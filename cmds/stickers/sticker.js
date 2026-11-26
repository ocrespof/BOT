import fs from 'fs';
import { spawn } from 'child_process';
import chalk from 'chalk';
import { proto, prepareWAMessageMedia, generateWAMessageFromContent, downloadContentFromMessage } from '@whiskeysockets/baileys';
import exif from '../../core/exif.js';
import Logger from '../../utils/logger.js';
const { writeExif } = exif;

const VISUAL_URL_RE = /\.(jpe?g|png|gif|webp|mp4|mov|avi|mkv|webm)(\?.*)?$/i;
const VIDEO_URL_RE = /\.(mp4|mov|avi|mkv|webm)(\?.*)?$/i;
const AUDIO_URL_RE = /\.(mp3|ogg|opus|wav|m4a|aac|flac)(\?.*)?$/i;
const AUDIO_FLAGS = new Set(['-audio', '-sonido', '-sound', '-a']);
const MAX_AUDIO_STICKER_SECONDS = 10;
const MAX_WEBP_BYTES = 950 * 1024;
const FFMPEG_TIMEOUT_MS = 45_000;
const FETCH_TIMEOUT_MS = 15_000;

let protoPatchState = null;

const logSticker = (tag, msg) => {
  console.log(chalk.cyanBright(`[ ${tag} ]`), chalk.white(msg));
};

const testNativeAudioStickerProto = () => {
  try {
    const sample = proto.Message.fromObject({
      audioStickerMessage: {
        message: {
          stickerMessage: {
            width: 512,
            audioMessage: { seconds: 1 }
          }
        }
      }
    });
    const bytes = proto.Message.encode(sample).finish();
    const decoded = proto.Message.decode(bytes);
    const hasTop = Boolean(decoded?.audioStickerMessage?.message?.stickerMessage);
    const hasAudio = Boolean(decoded?.audioStickerMessage?.message?.stickerMessage?.audioMessage);
    return { hasTop, hasAudio, bytesLen: bytes.length };
  } catch {
    return { hasTop: false, hasAudio: false, bytesLen: 0 };
  }
};

// Parchea WAProto (static-module de protobufjs) si no trae audioStickerMessage (134) o StickerMessage.audioMessage (26)
const ensureAudioStickerProto = () => {
  if (protoPatchState) return protoPatchState;

  const initial = testNativeAudioStickerProto();
  if (initial.hasTop && initial.hasAudio) {
    protoPatchState = { mode: 'nativo', ...initial };
    return protoPatchState;
  }

  const StickerMsg = proto.Message?.StickerMessage;
  const AudioMsg = proto.Message?.AudioMessage;
  const FutureProofMsg = proto.Message?.FutureProofMessage || proto.FutureProofMessage;

  let stickerNative = false;
  if (StickerMsg && AudioMsg) {
    try {
      const sTest = StickerMsg.encode(StickerMsg.fromObject({ audioMessage: { seconds: 1 } })).finish();
      stickerNative = sTest.length > 0;
    } catch {}

    if (!stickerNative && !StickerMsg.__audioStickerPatched) {
      const origEncode = StickerMsg.encode;
      const origFromObject = StickerMsg.fromObject;
      const origCreate = StickerMsg.create;

      StickerMsg.fromObject = function fromObject(obj) {
        const res = origFromObject.call(this, obj);
        if (obj && obj.audioMessage != null && res.audioMessage == null) {
          res.audioMessage = obj.audioMessage instanceof AudioMsg ? obj.audioMessage : AudioMsg.fromObject(obj.audioMessage);
        }
        return res;
      };

      if (typeof origCreate === 'function') {
        StickerMsg.create = function create(props) {
          const res = origCreate.call(this, props);
          if (props && props.audioMessage != null && res.audioMessage == null) {
            res.audioMessage = props.audioMessage instanceof AudioMsg ? props.audioMessage : AudioMsg.fromObject(props.audioMessage);
          }
          return res;
        };
      }

      StickerMsg.encode = function encode(message, writer) {
        const w = origEncode.call(this, message, writer);
        if (message && message.audioMessage != null) {
          const audioObj = message.audioMessage instanceof AudioMsg
            ? message.audioMessage
            : AudioMsg.fromObject(message.audioMessage);
          AudioMsg.encode(audioObj, w.uint32((26 << 3) | 2).fork()).ldelim();
        }
        return w;
      };
      StickerMsg.__audioStickerPatched = true;
    }
  }

  let topNative = false;
  if (proto.Message) {
    try {
      const mTest = proto.Message.encode(proto.Message.fromObject({ audioStickerMessage: { message: { conversation: 'x' } } })).finish();
      topNative = mTest.length > 0;
    } catch {}

    if (!topNative && !proto.Message.__audioStickerPatched) {
      const origMsgEncode = proto.Message.encode;
      const origMsgFromObject = proto.Message.fromObject;
      const origMsgCreate = proto.Message.create;

      const wrapFutureProof = (val) => {
        if (!val) return val;
        if (FutureProofMsg) {
          if (val instanceof FutureProofMsg) {
            if (val.message && !(val.message instanceof proto.Message)) {
              val.message = proto.Message.fromObject(val.message);
            }
            return val;
          }
          return FutureProofMsg.fromObject(val);
        }
        return {
          message: val.message instanceof proto.Message ? val.message : proto.Message.fromObject(val.message || {})
        };
      };

      proto.Message.fromObject = function fromObject(obj) {
        const res = origMsgFromObject.call(this, obj);
        if (obj && obj.audioStickerMessage != null && res.audioStickerMessage == null) {
          res.audioStickerMessage = wrapFutureProof(obj.audioStickerMessage);
        }
        return res;
      };

      if (typeof origMsgCreate === 'function') {
        proto.Message.create = function create(props) {
          const res = origMsgCreate.call(this, props);
          if (props && props.audioStickerMessage != null && res.audioStickerMessage == null) {
            res.audioStickerMessage = wrapFutureProof(props.audioStickerMessage);
          }
          return res;
        };
      }

      proto.Message.encode = function encode(message, writer) {
        const w = origMsgEncode.call(this, message, writer);
        if (message && message.audioStickerMessage != null) {
          const fp = wrapFutureProof(message.audioStickerMessage);
          if (FutureProofMsg) {
            FutureProofMsg.encode(fp, w.uint32((134 << 3) | 2).fork()).ldelim();
          } else if (fp?.message) {
            const fpWriter = w.uint32((134 << 3) | 2).fork();
            const inner = fp.message instanceof proto.Message ? fp.message : proto.Message.fromObject(fp.message);
            proto.Message.encode(inner, fpWriter.uint32(10).fork()).ldelim();
            fpWriter.ldelim();
          }
        }
        return w;
      };
      proto.Message.__audioStickerPatched = true;
    }
  }

  let patchedBytesLen = 0;
  try {
    const verifyMsg = proto.Message.fromObject({
      audioStickerMessage: {
        message: {
          stickerMessage: {
            width: 512,
            audioMessage: { seconds: 1 }
          }
        }
      }
    });
    patchedBytesLen = proto.Message.encode(verifyMsg).finish().length;
  } catch {}

  protoPatchState = {
    mode: 'parcheado',
    stickerNative,
    topNative,
    bytesLen: patchedBytesLen
  };
  return protoPatchState;
};

const createTmpPath = (prefix, ext) => {
  if (!fs.existsSync('./tmp')) fs.mkdirSync('./tmp', { recursive: true });
  return `./tmp/${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
};

const safeUnlink = (filePath) => {
  if (!filePath) return;
  try { fs.unlinkSync(filePath); } catch {}
};

const runBinary = (cmd, cmdArgs, timeoutMs = FFMPEG_TIMEOUT_MS) => new Promise((resolve, reject) => {
  const p = spawn(cmd, cmdArgs, { stdio: ['ignore', 'pipe', 'pipe'] });
  let stdout = '';
  let stderr = '';
  let timedOut = false;

  const timer = setTimeout(() => {
    timedOut = true;
    try { p.kill('SIGKILL'); } catch {}
    reject(new Error(`${cmd} excedió el tiempo límite (${Math.round(timeoutMs / 1000)}s)`));
  }, timeoutMs);

  p.stdout.on('data', (d) => stdout += d.toString());
  p.stderr.on('data', (d) => stderr += d.toString());
  p.on('error', (err) => {
    clearTimeout(timer);
    reject(err);
  });
  p.on('close', (code) => {
    clearTimeout(timer);
    if (timedOut) return;
    if (code === 0) resolve({ stdout, stderr });
    else reject(new Error(stderr || `${cmd} salió con código ${code}`));
  });
});

const probeAudioDuration = async (filePath) => {
  try {
    const { stdout } = await runBinary('ffprobe', [
      '-v', 'error',
      '-select_streams', 'a:0',
      '-show_entries', 'stream=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1',
      filePath
    ], 10_000);
    const val = parseFloat(stdout.trim().split(/\s+/)[0]);
    if (Number.isFinite(val) && val > 0) {
      return Math.min(MAX_AUDIO_STICKER_SECONDS, Math.max(1, Math.round(val)));
    }
  } catch {}
  return null;
};

const encodeAudioToOpus = async (inputPath, maxSeconds = MAX_AUDIO_STICKER_SECONDS) => {
  const outputPath = createTmpPath('stkaudio', 'ogg');
  try {
    await runBinary('ffmpeg', [
      '-y',
      '-i', inputPath,
      '-vn',
      '-t', String(maxSeconds),
      '-c:a', 'libopus',
      '-b:a', '48k',
      '-ac', '1',
      '-ar', '48000',
      '-avoid_negative_ts', 'make_zero',
      outputPath
    ]);
    const duration = await probeAudioDuration(outputPath);
    return { buffer: fs.readFileSync(outputPath), duration };
  } catch (err) {
    if (/does not contain any stream|matches no streams/i.test(err.message)) {
      throw new Error('El video o archivo no contiene una pista de audio válida.');
    }
    throw err;
  } finally {
    safeUnlink(outputPath);
  }
};

const isAnimatedWebp = (buffer) => {
  if (!Buffer.isBuffer(buffer) || buffer.length < 32) return false;
  return buffer.indexOf(Buffer.from('ANIM')) !== -1 || buffer.indexOf(Buffer.from('ANMF')) !== -1;
};

const fetchBufferFromUrl = async (url) => {
  const response = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  if (!response.ok) throw new Error(`HTTP ${response.status} al descargar URL`);
  return Buffer.from(await response.arrayBuffer());
};

const downloadMsgBuffer = async (targetMsg) => {
  try {
    const buf = await targetMsg.download();
    if (Buffer.isBuffer(buf) && buf.length > 0) return buf;
  } catch {}

  const raw = targetMsg?.msg || targetMsg;
  const mime = raw?.mimetype || '';
  const fallbackType = /webp/i.test(mime) ? 'sticker' : (mime.split('/')[0] || 'document');
  const stream = await downloadContentFromMessage(raw, fallbackType);
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks);
};

const getExtFromMimeOrUrl = (mime = '', url = '') => {
  if (/webp/i.test(mime) || /\.webp(\?.*)?$/i.test(url)) return 'webp';
  if (/png/i.test(mime) || /\.png(\?.*)?$/i.test(url)) return 'png';
  if (/jpe?g/i.test(mime) || /\.jpe?g(\?.*)?$/i.test(url)) return 'jpg';
  if (/gif/i.test(mime) || /\.gif(\?.*)?$/i.test(url)) return 'gif';
  if (/video/i.test(mime) || VIDEO_URL_RE.test(url)) return 'mp4';
  if (/mpeg|mp3/i.test(mime) || /\.mp3(\?.*)?$/i.test(url)) return 'mp3';
  if (/ogg|opus/i.test(mime) || /\.(ogg|opus)(\?.*)?$/i.test(url)) return 'ogg';
  if (/mp4|m4a/i.test(mime) || /\.m4a(\?.*)?$/i.test(url)) return 'm4a';
  if (/wav/i.test(mime) || /\.wav(\?.*)?$/i.test(url)) return 'wav';
  if (/aac/i.test(mime) || /\.aac(\?.*)?$/i.test(url)) return 'aac';
  if (/flac/i.test(mime) || /\.flac(\?.*)?$/i.test(url)) return 'flac';
  if (/audio/i.test(mime) || AUDIO_URL_RE.test(url)) return 'ogg';
  return 'bin';
};

export default {
  command: ['sticker', 's', 'saudio', 'stickeraudio', 'audiosticker'],
  category: 'stickers',
  heavy: true,
  desc: 'Crear sticker (con soporte para stickers con audio).',
  run: async (client, m, args, usedPrefix, command) => {
    const startTs = Date.now();
    const isAudioCmd = /^(saudio|stickeraudio|audiosticker)$/i.test(command);
    const tag = isAudioCmd ? 'SAUDIO' : 'STICKER';

    try {
      if (args[0] === '-list') {
        let helpText = `Lista de Formas y Efectos Disponibles para *imagen*:\n\n✦ *Formas:*\n- -c : Crea un sticker circular\n- -t : Crea un sticker triangular\n- -s : Crea un sticker con forma de estrella\n- -r : Crea un sticker con esquinas redondeadas\n- -h : Crea un sticker hexagonal\n- -d : Crea un sticker con forma de diamante\n- -f : Crea un sticker con un marco\n- -b : Crea un sticker con un borde\n- -w : Crea un sticker con forma de onda\n- -m : Crea un sticker espejado\n- -o : Crea un sticker octogonal\n- -y : Crea un sticker pentagonal\n- -e : Crea un sticker elíptico\n- -z : Crea un sticker en forma de cruz\n- -v : Crea un sticker con forma de corazón\n- -x : Crea un sticker expandido (cover)\n- -i : Crea un sticker expandido (contain)\n\n✧ *Efectos:*\n- -blur : Aplica un efecto de desenfoque\n- -sepia : Aplica un efecto sepia\n- -sharpen : Aplica un efecto de nitidez\n- -brighten : Aumenta el brillo\n- -darken : Disminuye el brillo\n- -invert : Invierte los colores\n- -grayscale : Aplica escala de grises\n- -rotate90 : Rota la imagen 90 grados\n- -rotate180 : Rota la imagen 180 grados\n- -flip : Invierte la imagen horizontalmente\n- -flop : Invierte la imagen verticalmente\n- -normalice : Normaliza la imagen\n- -negate : Negatiza la imagen\n- -tint : Aplica un tinte de color a la imagen (rojo por defecto)\n\n🔊 *Sticker con Audio:*\n- -audio / -sonido : Agrega audio al sticker (máx. ${MAX_AUDIO_STICKER_SECONDS}s)\n  • Envía o responde a un *video con audio*\n  • O envía una *imagen/sticker* respondiendo a un *audio*\n  • También puedes usar *${usedPrefix}saudio*\n\nEjemplo: *${usedPrefix + command} -c -blur Pack | Autor*`;
        return client.reply(m.chat, helpText, m);
      }

      const db = global.db.data;
      const senderToUse = m.quoted ? m.quoted.sender : m.sender;
      const user = db.users[senderToUse] || {};

      // Prioridad a pushName real de WhatsApp
      const rawPushName = (m.pushName && m.pushName.trim()) || (m.quoted?.pushName && m.quoted.pushName.trim()) || user.name || m.sender.split('@')[0];
      const displayName = rawPushName.startsWith('@') ? rawPushName : `@${rawPushName}`;

      const meta1 = user.metadatos ? String(user.metadatos).trim() : '';
      const meta2 = user.metadatos2 ? String(user.metadatos2).trim() : '';
      let texto1 = meta1 ? meta1 : 'YukiBot Stickers';
      let texto2 = meta1 ? (meta2 ? meta2 : '') : displayName;

      const urlArgs = [];
      const argsWithoutUrl = [];
      for (const arg of args) {
        if (isUrl(arg)) {
          urlArgs.push(arg);
        } else {
          argsWithoutUrl.push(arg);
        }
      }
      const urlArg = urlArgs[0] || null;
      const wantAudio = isAudioCmd || argsWithoutUrl.some(arg => AUDIO_FLAGS.has(arg.toLowerCase()));

      let filteredText = argsWithoutUrl.join(' ').replace(/-\w+/g, '').trim();
      let marca = filteredText.split(/[\u2022|]/).map(part => part.trim());
      let pack = marca[0] || texto1;
      let author = marca.length > 1 ? marca[1] : texto2;

      const shapeArgs = { '-c': 'circle', '-t': 'triangle', '-s': 'star', '-r': 'roundrect', '-h': 'hexagon', '-d': 'diamond', '-f': 'frame', '-b': 'border', '-w': 'wave', '-m': 'mirror', '-o': 'octagon', '-y': 'pentagon', '-e': 'ellipse', '-z': 'cross', '-v': 'heart', '-x': 'cover', '-i': 'contain' };
      const effectArgs = { '-blur': 'blur', '-sepia': 'sepia', '-sharpen': 'sharpen', '-brighten': 'brighten', '-darken': 'darken', '-invert': 'invert', '-grayscale': 'grayscale', '-rotate90': 'rotate90', '-rotate180': 'rotate180', '-flip': 'flip', '-flop': 'flop', '-normalice': 'normalise', '-negate': 'negate', '-tint': 'tint' };
      const effects = [];
      for (const arg of argsWithoutUrl) {
        if (shapeArgs[arg]) effects.push({ type: 'shape', value: shapeArgs[arg] });
        else if (effectArgs[arg]) effects.push({ type: 'effect', value: effectArgs[arg] });
      }

      const applyExif = async (webpBuffer) => {
        const media = { mimetype: 'webp', data: webpBuffer };
        const metadata = { packname: pack, author: author, categories: [''] };
        return writeExif(media, metadata);
      };

      const sendWebpWithExif = async (webpBuffer) => {
        const stickerBuffer = await applyExif(webpBuffer);
        await client.sendMessage(m.chat, { sticker: stickerBuffer }, { quoted: m });
        logSticker(tag, `Sticker enviado (${(stickerBuffer.length / 1024).toFixed(1)} KB) en ${Date.now() - startTs}ms`);
      };

      const sendAudioStickerWithExif = async (webpBuffer, oggBuffer, durationSec) => {
        const protoInfo = ensureAudioStickerProto();
        const stickerBuffer = await applyExif(webpBuffer);
        const animated = isAnimatedWebp(stickerBuffer);

        logSticker(
          tag,
          `Subiendo medios | WebP=${(stickerBuffer.length / 1024).toFixed(1)}KB (${animated ? 'animado' : 'estático'}), Audio=${(oggBuffer.length / 1024).toFixed(1)}KB (${durationSec}s), WAProto=${protoInfo.mode}`
        );

        const [stickerMedia, audioMedia] = await Promise.all([
          prepareWAMessageMedia(
            { sticker: stickerBuffer },
            { upload: client.waUploadToServer }
          ),
          prepareWAMessageMedia(
            { audio: oggBuffer, mimetype: 'audio/ogg; codecs=opus', ptt: false },
            { upload: client.waUploadToServer }
          )
        ]);

        const contextInfo = {};
        if (m?.key?.id) {
          contextInfo.stanzaId = m.key.id;
          contextInfo.participant = m.sender || m.key.participant || m.chat;
          if (m.message) contextInfo.quotedMessage = m.message;
        }
        if (m?.expiration) contextInfo.expiration = m.expiration;

        const stickerMessage = {
          ...stickerMedia.stickerMessage,
          mimetype: stickerMedia.stickerMessage?.mimetype || 'image/webp',
          isAnimated: animated,
          width: stickerMedia.stickerMessage?.width || 512,
          height: stickerMedia.stickerMessage?.height || 512,
          stickerSentTs: Date.now(),
          audioMessage: {
            ...audioMedia.audioMessage,
            mimetype: 'audio/ogg; codecs=opus',
            seconds: durationSec || audioMedia.audioMessage?.seconds || 1,
            ptt: false
          },
          ...(Object.keys(contextInfo).length ? { contextInfo } : {})
        };

        const waMsg = generateWAMessageFromContent(
          m.chat,
          { audioStickerMessage: { message: { stickerMessage } } },
          { userJid: client.user?.jid || client.user?.id }
        );

        const encodedBytes = proto.Message.encode(waMsg.message).finish();
        if (!encodedBytes || encodedBytes.length < 20) {
          throw new Error(`Fallo al serializar audioStickerMessage en WAProto (bytes=${encodedBytes?.length || 0})`);
        }

        if (client.sentMessageIds && waMsg.key?.id) {
          client.sentMessageIds.add(waMsg.key.id);
        }
        if (global.msgStore && waMsg.key?.id) {
          global.msgStore.set(`${m.chat}:${waMsg.key.id}`, waMsg.message);
          global.msgStore.set(waMsg.key.id, waMsg.message);
        }

        logSticker(tag, `Enviando audioStickerMessage (${encodedBytes.length} bytes) a ${m.chat}...`);
        await client.relayMessage(m.chat, waMsg.message, { messageId: waMsg.key.id });
        logSticker(tag, `Sticker con audio enviado correctamente en ${Date.now() - startTs}ms`);
      };

      const convertToGif = async (inputPath) => {
        const gifPath = createTmpPath('conv', 'gif');
        await runBinary('ffmpeg', [
          '-y', '-i', inputPath,
          '-vf', 'fps=12,scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000',
          '-loop', '0', gifPath
        ]);
        return gifPath;
      };

      const encodeWebpWithFFmpeg = async (inputPath, { isAnimatedInput = false, maxSeconds = null } = {}) => {
        const runPass = async (fps, quality, compression) => {
          const outputPath = createTmpPath('sticker', 'webp');
          const vf = buildFFmpegFilters(effects, isAnimatedInput, fps);
          const ffmpegArgs = [
            '-y', '-i', inputPath,
            ...(maxSeconds ? ['-t', String(maxSeconds)] : []),
            '-vf', vf,
            '-an',
            '-fps_mode', 'passthrough',
            '-c:v', 'libwebp_anim',
            '-preset', 'picture',
            '-compression_level', String(compression),
            '-q:v', String(quality),
            '-threads', '2',
            ...(isAnimatedInput ? ['-loop', '0'] : []),
            outputPath
          ];
          try {
            await runBinary('ffmpeg', ffmpegArgs);
            return fs.readFileSync(outputPath);
          } finally {
            safeUnlink(outputPath);
          }
        };

        let webpBuf = await runPass(isAnimatedInput ? 15 : null, isAnimatedInput ? 60 : 75, 4);
        if (isAnimatedInput && webpBuf.length > MAX_WEBP_BYTES) {
          logSticker(tag, `WebP animado pesado (${(webpBuf.length / 1024).toFixed(0)}KB), recomprimiendo...`);
          webpBuf = await runPass(10, 42, 4);
        }
        return webpBuf;
      };

      const resolveWebpBufferFromWebp = async (buffer, maxSeconds = null) => {
        const animated = isAnimatedWebp(buffer);
        if (animated && effects.length === 0) return buffer;

        const inputPath = createTmpPath('in', 'webp');
        fs.writeFileSync(inputPath, buffer);
        try {
          if (animated && effects.length > 0) {
            try {
              const gifPath = await convertToGif(inputPath);
              try {
                return await encodeWebpWithFFmpeg(gifPath, { isAnimatedInput: true, maxSeconds });
              } finally {
                safeUnlink(gifPath);
              }
            } catch {
              return buffer;
            }
          }
          return await encodeWebpWithFFmpeg(inputPath, { isAnimatedInput: false, maxSeconds });
        } finally {
          safeUnlink(inputPath);
        }
      };

      const buildWebpFromInput = async ({ msgObj, url, maxSeconds = null }) => {
        if (msgObj) {
          const vMime = (msgObj.msg || msgObj).mimetype || '';
          const vBuf = await downloadMsgBuffer(msgObj);
          if (/webp/i.test(vMime)) {
            return resolveWebpBufferFromWebp(vBuf, maxSeconds);
          }
          const isAnim = /video|gif/i.test(vMime);
          const inputPath = createTmpPath('vis', getExtFromMimeOrUrl(vMime));
          fs.writeFileSync(inputPath, vBuf);
          try {
            return await encodeWebpWithFFmpeg(inputPath, { isAnimatedInput: isAnim, maxSeconds: isAnim ? maxSeconds : null });
          } finally {
            safeUnlink(inputPath);
          }
        }

        const uBuf = await fetchBufferFromUrl(url);
        if (/\.webp(\?.*)?$/i.test(url)) {
          return resolveWebpBufferFromWebp(uBuf, maxSeconds);
        }
        const isAnim = VIDEO_URL_RE.test(url) || /\.gif/i.test(url);
        const inputPath = createTmpPath('url', getExtFromMimeOrUrl('', url));
        fs.writeFileSync(inputPath, uBuf);
        try {
          return await encodeWebpWithFFmpeg(inputPath, { isAnimatedInput: isAnim, maxSeconds: isAnim ? maxSeconds : null });
        } finally {
          safeUnlink(inputPath);
        }
      };

      if (wantAudio) {
        const selfMime = (m.msg || m).mimetype || '';
        const quotedMime = (m.quoted?.msg || m.quoted)?.mimetype || '';
        const visualUrl = urlArgs.find(u => VISUAL_URL_RE.test(u)) || null;
        const audioUrl = urlArgs.find(u => AUDIO_URL_RE.test(u)) || null;

        const visualMsg = /image|webp|video/i.test(selfMime)
          ? m
          : /image|webp|video/i.test(quotedMime)
            ? m.quoted
            : null;
        const audioMsg = /audio/i.test(quotedMime)
          ? m.quoted
          : /audio/i.test(selfMime)
            ? m
            : (/video/i.test(quotedMime) && visualMsg === m)
              ? m.quoted
              : null;

        const hasVideoVisual = visualMsg
          ? /video/i.test((visualMsg.msg || visualMsg).mimetype || '')
          : Boolean(visualUrl && VIDEO_URL_RE.test(visualUrl));

        logSticker(
          tag,
          `Inicio | selfMime="${selfMime || 'none'}" quotedMime="${quotedMime || 'none'}" visualUrl=${Boolean(visualUrl)} audioUrl=${Boolean(audioUrl)}`
        );

        if (!visualMsg && !visualUrl) {
          logSticker(tag, 'Sin media visual ni URL válida; respondiendo instrucciones.');
          return client.reply(
            m.chat,
            `🔊 Para crear un sticker con audio, envía o responde a un *video con sonido*, o envía una *imagen/sticker/video* respondiendo a un *audio*.\nEjemplo: *${usedPrefix + command} -audio*`,
            m
          );
        }

        if (!audioMsg && !audioUrl && !hasVideoVisual) {
          logSticker(tag, 'Sin fuente de audio; respondiendo instrucciones.');
          return client.reply(
            m.chat,
            `🔊 No encontré una pista de audio. Envía o responde a un *video con sonido*, o responde a un *audio* mientras envías una imagen/sticker (o agrega la URL del audio).`,
            m
          );
        }

        if (visualMsg && /video/i.test((visualMsg.msg || visualMsg).mimetype || '') && (visualMsg.msg || visualMsg).seconds > 20) {
          logSticker(tag, 'Video rechazado por duración > 20s.');
          return client.reply(m.chat, ' El video no puede ser muy largo', m);
        }

        await m.react('🕒').catch(() => {});

        let sharedVideoPath = null;
        let audioTmpPath = null;
        try {
          let webpBuffer;
          let audioInputPath;
          let fallbackDuration = null;

          // Si el audio proviene del mismo video visual, descarga una sola vez y procesa WebP + Opus en paralelo
          if (!audioMsg && !audioUrl && hasVideoVisual) {
            const vMime = visualMsg ? ((visualMsg.msg || visualMsg).mimetype || '') : '';
            fallbackDuration = visualMsg ? (Number((visualMsg.msg || visualMsg).seconds) || null) : null;
            const vBuf = visualMsg ? await downloadMsgBuffer(visualMsg) : await fetchBufferFromUrl(visualUrl);
            logSticker(tag, `Video descargado (${(vBuf.length / 1024).toFixed(1)} KB), convirtiendo WebP y Opus en paralelo...`);

            sharedVideoPath = createTmpPath('vid', getExtFromMimeOrUrl(vMime, visualUrl || ''));
            fs.writeFileSync(sharedVideoPath, vBuf);

            const [webpRes, audioRes] = await Promise.all([
              encodeWebpWithFFmpeg(sharedVideoPath, { isAnimatedInput: true, maxSeconds: MAX_AUDIO_STICKER_SECONDS }),
              encodeAudioToOpus(sharedVideoPath, MAX_AUDIO_STICKER_SECONDS)
            ]);
            webpBuffer = webpRes;
            const finalDuration = audioRes.duration || (fallbackDuration ? Math.min(MAX_AUDIO_STICKER_SECONDS, Math.max(1, Math.round(fallbackDuration))) : 5);
            await sendAudioStickerWithExif(webpBuffer, audioRes.buffer, finalDuration);
            await m.react('✔️').catch(() => {});
            return;
          }

          // Caso visual + audio independientes: descarga en paralelo
          logSticker(tag, 'Descargando visual y audio en paralelo...');
          const [vWebp, aBuf] = await Promise.all([
            buildWebpFromInput({ msgObj: visualMsg, url: visualUrl, maxSeconds: MAX_AUDIO_STICKER_SECONDS }),
            audioMsg ? downloadMsgBuffer(audioMsg) : fetchBufferFromUrl(audioUrl)
          ]);
          webpBuffer = vWebp;

          const aMime = audioMsg ? ((audioMsg.msg || audioMsg).mimetype || '') : '';
          fallbackDuration = audioMsg ? (Number((audioMsg.msg || audioMsg).seconds) || null) : null;
          audioTmpPath = createTmpPath('aud', getExtFromMimeOrUrl(aMime, audioUrl || ''));
          fs.writeFileSync(audioTmpPath, aBuf);
          audioInputPath = audioTmpPath;

          const { buffer: oggBuffer, duration } = await encodeAudioToOpus(audioInputPath, MAX_AUDIO_STICKER_SECONDS);
          const finalDuration = duration || (fallbackDuration ? Math.min(MAX_AUDIO_STICKER_SECONDS, Math.max(1, Math.round(fallbackDuration))) : 5);
          await sendAudioStickerWithExif(webpBuffer, oggBuffer, finalDuration);
          await m.react('✔️').catch(() => {});
          return;
        } finally {
          safeUnlink(sharedVideoPath);
          safeUnlink(audioTmpPath);
        }
      }

      const quoted = m.quoted ? m.quoted : m;
      const mime = (quoted.msg || quoted).mimetype || '';

      if (/image/.test(mime) || /webp/.test(mime)) {
        logSticker(tag, `Procesando ${mime}...`);
        await sendWebpWithExif(await buildWebpFromInput({ msgObj: quoted }));
      } else if (/video/.test(mime)) {
        if ((quoted.msg || quoted).seconds > 20) {
          return client.reply(m.chat, ' El video no puede ser muy largo', m);
        }
        logSticker(tag, `Procesando video (${mime})...`);
        await sendWebpWithExif(await buildWebpFromInput({ msgObj: quoted }));
      } else if (urlArg) {
        if (!VISUAL_URL_RE.test(urlArg)) {
          return client.reply(m.chat, ' La URL debe ser de una imagen (jpg, png, gif, webp) o video (mp4, mov, avi, mkv, webm)', m);
        }
        logSticker(tag, `Descargando URL: ${urlArg}`);
        try {
          await sendWebpWithExif(await buildWebpFromInput({ url: urlArg }));
        } catch (err) {
          if (/HTTP \d+|fetch/i.test(err.message)) {
            return client.reply(m.chat, ' No pude descargar ese archivo desde la URL.', m);
          }
          throw err;
        }
      } else {
        return client.reply(m.chat, ` Por favor, envía una imagen, video, sticker o URL para hacer un sticker.\nUsa *${usedPrefix + command} -list* para ver formas, efectos y sticker con audio.`, m);
      }
    } catch (e) {
      Logger.error(`[${tag}] Error al ejecutar ${usedPrefix + command}:`, e);
      await m.react('✖️').catch(() => {});
      return client.reply(m.chat, `> Error al ejecutar el comando.\n[Error: *${e.message}*]`, m).catch(() => {});
    }
  }
};

const isUrl = (text) => {
  return text.match(new RegExp(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/, 'gi'));
};

const buildFFmpegFilters = (effects, isVideo = false, targetFps = null) => {
  const W = 512;
  const H = 512;
  const filters = [];
  if (isVideo && targetFps) {
    filters.push(`fps=${targetFps}`);
  }
  const shape = effects.find(e => e.type === 'shape')?.value;
  const effectList = effects.filter(e => e.type === 'effect').map(e => e.value);
  if (shape === 'cover') {
    filters.push(`scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H}`);
  } else {
    filters.push(`scale=${W}:${H}:force_original_aspect_ratio=decrease`);
    filters.push(`pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:color=0x00000000`);
  }
  filters.push('format=rgba');
  for (const effect of effectList) {
    switch (effect) {
      case 'blur': filters.push('gblur=sigma=5'); break;
      case 'sepia': filters.push('colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131'); break;
      case 'sharpen': filters.push('unsharp=5:5:1.0:5:5:0.0'); break;
      case 'brighten': filters.push('eq=brightness=0.05'); break;
      case 'darken': filters.push('eq=brightness=-0.05'); break;
      case 'invert': case 'negate': filters.push('negate'); break;
      case 'grayscale': filters.push('hue=s=0'); break;
      case 'rotate90': filters.push('transpose=1'); break;
      case 'rotate180': filters.push('rotate=PI'); break;
      case 'flip': filters.push('hflip'); break;
      case 'flop': filters.push('vflip'); break;
      case 'normalice': filters.push('normalize'); break;
      case 'tint': filters.push('colorchannelmixer=1:0:0:0:0:0.5:0:0:0:0:0.5'); break;
    }
  }
  if (shape === 'mirror') filters.push('hflip');
  if (shape && !['cover', 'contain', 'mirror', 'border', 'frame'].includes(shape)) {
    const cx = W / 2;
    const cy = H / 2;
    const r = Math.min(W, H) / 2;
    let alphaExpr = '';
    switch (shape) {
      case 'circle': alphaExpr = `if(lte((X-${cx})*(X-${cx})+(Y-${cy})*(Y-${cy}),${r * r}),255,0)`; break;
      case 'triangle': alphaExpr = `if(gte(Y,${H * 0.1})*lte(Y,${H * 0.9})*lte(abs(X-${cx}),((${H * 0.9}-Y)*0.6)),255,0)`; break;
      case 'star': alphaExpr = `if(lte(hypot(X-${cx},Y-${cy}),${W * 0.25}+${W * 0.1}*cos(5*atan2(Y-${cy},X-${cx}))),255,0)`; break;
      case 'roundrect': alphaExpr = `if(lte(pow(max(25-X,0,X-${W - 25},25-Y,0,Y-${H - 25}),2)+pow(max(50-hypot(X-25,Y-25),50-hypot(X-${W - 25},Y-25),50-hypot(X-25,Y-${H - 25}),50-hypot(X-${W - 25},Y-${H - 25})),2),0),255,0)`; break;
      case 'hexagon': alphaExpr = `if(lte(hypot(X-${cx},Y-${cy}),${W * 0.4}*cos(PI/6)/cos(mod(atan2(Y-${cy},X-${cx}),PI/3)-PI/6)),255,0)`; break;
      case 'diamond': alphaExpr = `if(lte(abs(X-${cx})+abs(Y-${cy}),${r}),255,0)`; break;
      case 'wave': alphaExpr = `if(lte(abs(Y-(${cy}+${H * 0.05}*sin(X*0.05))),${H * 0.4}),255,0)`; break;
      case 'octagon': alphaExpr = `if(lte(hypot(X-${cx},Y-${cy}),${W * 0.4}*cos(PI/8)/cos(mod(atan2(Y-${cy},X-${cx}),PI/4)-PI/8)),255,0)`; break;
      case 'pentagon': alphaExpr = `if(lte(hypot(X-${cx},Y-${cy}),${W * 0.4}*cos(PI/5)/cos(mod(atan2(Y-${cy},X-${cx}),2*PI/5)-PI/5)),255,0)`; break;
      case 'ellipse': alphaExpr = `if(lte(((X-${cx})*(X-${cx}))/(${(W * 0.45) * (W * 0.45)})+((Y-${cy})*(Y-${cy}))/(${(H * 0.4) * (H * 0.4)}),1),255,0)`; break;
      case 'cross': alphaExpr = `if(gt((abs(X-${cx})<=${W * 0.15})*(abs(Y-${cy})<=${H * 0.45})+(abs(Y-${cy})<=${H * 0.15})*(abs(X-${cx})<=${W * 0.45}),0),255,0)`; break;
      case 'heart': alphaExpr = `if(lte(pow((X-${cx})/(${W * 0.3})*(X-${cx})/(${W * 0.3})+(Y-${cy})/(${H * 0.3})*(Y-${cy})/(${H * 0.3})-1,3)-((X-${cx})/(${W * 0.3})*(X-${cx})/(${W * 0.3}))*pow((Y-${cy})/(${H * 0.3}),3),0),255,0)`; break;
    }
    if (alphaExpr) filters.push(`geq=r='r(X,Y)':g='g(X,Y)':b='b(X,Y)':a='${alphaExpr}'`);
  }
  if (shape === 'border') filters.push(`drawbox=x=0:y=0:w=${W}:h=${H}:color=white@0.9:t=10`);
  if (shape === 'frame') filters.push(`drawbox=x=15:y=15:w=${W - 30}:h=${H - 30}:color=white@0.7:t=8`);
  filters.push('format=yuva420p');
  return filters.join(',');
};
