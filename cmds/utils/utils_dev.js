/**
 * 🛠️ utils_dev.js — Comandos de desarrollo, clonación de repositorios y descargas directas.
 * Reúne: gitclone, get, ssweb
 */
import axios from 'axios';
import { format } from 'util';

const regex = /^(?:https:\/\/|git@)github\.com\/([^\/]+)\/([^\/]+?)(?:\.git)?$/i;

function formatDate(n, locale = 'es') {
  const d = new Date(n);
  return d.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' });
}

const cmdGitClone = {
  command: ['gitclone', 'git'],
  category: 'utils', desc: 'Clonar repositorio de GitHub.',
  run: async (client, m, args, usedPrefix, command, text) => {
    if (!text) return client.reply(m.chat, ' Por favor, proporciona un enlace o nombre del repositorio de GitHub.', m);
    try {
      await m.react('🕒');
      let info = '';
      let image;
      let zipBuffer, zipName;
      let repos = [];
      const match = text.match(regex);
      if (match) {
        const [, user, repo] = match;
        const repoRes = await fetch(`https://api.github.com/repos/${user}/${repo}`);
        const zipRes = await fetch(`https://api.github.com/repos/${user}/${repo}/zipball`);
        const repoData = await repoRes.json();
        zipName = zipRes.headers.get('content-disposition')?.match(/filename=(.*)/)?.[1];
        if (!zipName) zipName = `${repo}-${user}.zip`;
        zipBuffer = Buffer.from(await zipRes.arrayBuffer());
        repos.push(repoData);
        image = 'https://cdn.yuki-wabot.my.id/files/MqnN.jpeg';
      } else {
        const res = await fetch(`https://api.github.com/search/repositories?q=${encodeURIComponent(text)}`);
        const json = await res.json();
        if (!json.items.length) return client.reply(m.chat, ' No se encontraron resultados.', m);
        if (json.items.length === 1) {
          const repo = json.items[0];
          const zipRes = await fetch(`https://api.github.com/repos/${repo.owner.login}/${repo.name}/zipball`);
          zipName = zipRes.headers.get('content-disposition')?.match(/filename=(.*)/)?.[1];
          if (!zipName) zipName = `${repo.name}-${repo.owner.login}.zip`;
          zipBuffer = Buffer.from(await zipRes.arrayBuffer());
          repos.push(repo);
          image = Buffer.from(await (await fetch(repo.owner.avatar_url)).arrayBuffer());
        } else {
          repos = json.items;
          image = Buffer.from(await (await fetch(repos[0].owner.avatar_url)).arrayBuffer());
        }
      }
      info += repos.map((repo, index) => `✩ Resultado: ${index + 1}
✩ Creador: ${repo.owner.login}
✩ Nombre: ${repo.name}
✩ Creado: ${formatDate(repo.created_at)}
✩ Actualizado: ${formatDate(repo.updated_at)}
✩ Visitas: ${repo.watchers}
✩ Bifurcado: ${repo.forks}
✩ Estrellas: ${repo.stargazers_count}
✩ Issues: ${repo.open_issues}
✩ Descripción: ${repo.description ? repo.description : 'Sin Descripción'}
✩ Enlace: ${repo.clone_url}`).join('\n────────────────────\n');
      await client.sendFile(m.chat, image, 'github_info.jpg', info.trim(), m);
      if (zipBuffer && zipName) {
        await client.sendFile(m.chat, zipBuffer, zipName, null, m);
      }
      await m.react('✔️');
    } catch (e) {
      await m.react('✖️');
      return m.reply(`> Error al ejecutar el comando.\n[Error: *${e.message}*]`);
    }
  }
};

const cmdGet = {
  command: ['get', 'fetch'],
  category: 'utils', desc: 'Descargar desde URL.',
  run: async (client, m, args) => {
    const text = args[0];
    if (!text) return m.reply(' Ingresa un enlace para realizar la solicitud.');
    if (!/^https?:\/\//.test(text)) {
      return m.reply(' Ingresa un enlace válido que comience con http o https');
    }
    try {
      const _url = new URL(text);
      const params = new URLSearchParams(_url.searchParams);
      const url = `${_url.origin}${_url.pathname}${params.toString() ? '?' + params.toString() : ''}`;
      const res = await fetch(url);
      const contentType = res.headers.get('content-type') || '';
      const contentLength = parseInt(res.headers.get('content-length') || '0');

      if (contentLength > 100 * 1024 * 1024) {
        return m.reply(` El archivo es demasiado grande.\nContent-Length: ${contentLength} bytes`);
      }
      if (/text|json/.test(contentType)) {
        const buffer = Buffer.from(await res.arrayBuffer());
        try {
          const json = JSON.parse(buffer.toString());
          return m.reply(format(json).slice(0, 65536));
        } catch {
          return m.reply(buffer.toString().slice(0, 65536));
        }
      } else {
        const buffer = Buffer.from(await res.arrayBuffer());
        return client.sendFile(m.chat, buffer, 'file', text, m);
      }
    } catch (e) {
      console.error(e);
      return m.reply(`> Error al ejecutar el comando.\n[Error: *${e.message}*]`);
    }
  }
};

const cmdSsWeb = {
  command: ['ssweb', 'ss'],
  category: ['tools'], desc: 'Captura de pantalla web.',
  run: async (client, m, args, usedPrefix, command) => {
    try {
      if (!args[0]) return m.reply(`> 🌐 Por favor, ingresa el enlace (URL) de una página.\n> *Ejemplo:* ${usedPrefix + command} https://google.com`);

      let url = args[0];
      if (!/^https?:\/\//i.test(url)) url = 'https://' + url;

      let domain = url;
      try {
        domain = new URL(url).hostname;
      } catch (e) {
        return m.reply('> ❌ URL inválida. Verifica el enlace e intenta nuevamente.');
      }

      await m.react('🕒');

      const encUrl = encodeURIComponent(url);
      const apis = [
        { name: 'Microlink', url: `https://api.microlink.io?url=${encUrl}&screenshot=true&meta=false&embed=screenshot.url` },
        { name: 'MShots', url: `https://s0.wp.com/mshots/v1/${encUrl}?w=1920&h=1080` },
        { name: 'Thum.io', url: `https://image.thum.io/get/fullpage/${url}` }
      ];

      let ss = null;
      let usedApi = '';

      for (const api of apis) {
        try {
          const response = await axios.get(api.url, { responseType: 'arraybuffer', timeout: 25000 });
          if (response.status === 200 && response.data && response.data.length > 5000) {
             ss = Buffer.from(response.data);
             usedApi = api.name;
             break;
          }
        } catch (error) {
          console.log(`[ssweb] Falló la API ${api.name} para ${url}: ${error.message}`);
          continue;
        }
      }

      if (!ss) throw new Error('Todas las APIs fallaron al intentar obtener la captura.');

      const caption = `*📸 CAPTURA WEB*\n\n` +
                      `> *🌐 Dominio:* ${domain}\n` +
                      `> *🔗 URL:* ${url}\n` +
                      `> *⚙️ API Usada:* ${usedApi}\n\n` +
                      `_Generado por YukiBot_`;

      await client.sendMessage(m.chat, { image: ss, caption }, { quoted: m });
      await m.react('✔️');
    } catch (error) {
      console.error(error);
      await m.react('✖️');
      return m.reply(`> ❌ Ocurrió un error inesperado al ejecutar el comando.\n> *Detalle:* ${error.message}`);
    }
  }
};

export default [cmdGitClone, cmdGet, cmdSsWeb];
