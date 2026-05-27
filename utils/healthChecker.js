// utils/healthChecker.js
import axios from 'axios';
import config from '../config.js';
import Logger from './logger.js';

// Mapa de estado de APIs: nombre -> boolean (true = online, false = offline)
const apiStatus = new Map();

// Inicializar todas las APIs de la configuración como online por defecto
for (const key of Object.keys(config.APIs || {})) {
  apiStatus.set(key.toLowerCase(), true);
}
// Añadir APIs externas que no están listadas directamente en config.APIs
apiStatus.set('ryzen', true);
apiStatus.set('aemt', true);

/**
 * Devuelve si una API está activa
 * @param {string} name - Nombre de la API
 * @returns {boolean}
 */
export function isApiOnline(name) {
  if (!name) return true;
  return apiStatus.get(name.toLowerCase()) !== false;
}

/**
 * Marca una API como offline
 * @param {string} name - Nombre de la API
 */
export function setApiOffline(name) {
  if (!name) return;
  const key = name.toLowerCase();
  if (apiStatus.get(key) !== false) {
    Logger.warn(`[HealthChecker] Circuit Breaker activado: API '${name}' marcada como OFFLINE`);
    apiStatus.set(key, false);
  }
}

/**
 * Marca una API como online
 * @param {string} name - Nombre de la API
 */
export function setApiOnline(name) {
  if (!name) return;
  const key = name.toLowerCase();
  if (apiStatus.get(key) !== true) {
    // Logger.info(`[HealthChecker] API '${name}' marcada como ONLINE`);
    apiStatus.set(key, true);
  }
}

/**
 * Prueba una URL de API realizando una solicitud rápida
 * @param {string} name - Nombre de la API
 * @param {string} url - URL base de la API
 * @param {string} testPath - Ruta de prueba opcional
 */
async function checkApi(name, url, testPath = '') {
  if (!url) return;
  try {
    const fullUrl = url.endsWith('/') ? `${url}${testPath}` : `${url}/${testPath}`;
    // Petición rápida con timeout agresivo de 4 segundos
    await axios.get(fullUrl, { timeout: 4000 });
    setApiOnline(name);
  } catch (err) {
    // Si la API responde con error de cliente/autenticación (ej: 401, 403, 404),
    // significa que el servidor está levantado y respondiendo, por ende está ONLINE.
    // Solo marcamos como OFFLINE si no hay respuesta, hay error 5xx, timeout o error de red.
    const isOffline = !err.response || err.response.status >= 500 || err.code === 'ECONNABORTED';
    if (isOffline) {
      setApiOffline(name);
    } else {
      setApiOnline(name);
    }
  }
}

/**
 * Ejecuta el chequeo de salud en todas las APIs registradas
 */
export async function runHealthCheck() {
  const checks = [];

  // Chequear APIs de config.js
  for (const [name, api] of Object.entries(config.APIs || {})) {
    if (api && api.url) {
      checks.push(checkApi(name, api.url));
    }
  }

  // Chequear APIs externas adicionales
  checks.push(checkApi('ryzen', 'https://api.ryzendesu.vip'));
  checks.push(checkApi('aemt', 'https://aemt.me'));

  await Promise.allSettled(checks);
}

// Programar chequeos en segundo plano (cada 10 minutos)
setInterval(runHealthCheck, 10 * 60 * 1000);

// Ejecutar chequeo inicial 5 segundos después del arranque
setTimeout(runHealthCheck, 5000);
