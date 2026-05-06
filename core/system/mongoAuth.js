import { proto } from '@whiskeysockets/baileys/WAProto/index.js';
import { Curve, signedKeyPair } from '@whiskeysockets/baileys/lib/Utils/crypto.js';
import { generateRegistrationId } from '@whiskeysockets/baileys/lib/Utils/generics.js';
import { randomBytes } from 'crypto';
import Logger from '../../utils/logger.js';

/**
 * Adaptador experimental de MongoDB para guardar la sesión de Baileys en la nube.
 * Requiere instalar mongoose: `npm install mongoose`
 * 
 * Uso en index.js:
 * import { useMongoDBAuthState } from './core/system/mongoAuth.js';
 * const { state, saveCreds } = await useMongoDBAuthState(mongoose.connection, 'session_bot');
 */

const initAuthCreds = () => {
  const identityKey = Curve.generateKeyPair();
  return {
    noiseKey: Curve.generateKeyPair(),
    signedIdentityKey: identityKey,
    signedPreKey: signedKeyPair(identityKey, 1),
    registrationId: generateRegistrationId(),
    advSecretKey: randomBytes(32).toString('base64'),
    processedHistoryMessages: [],
    nextPreKeyId: 1,
    firstUnuploadedPreKeyId: 1,
    accountSettings: { unarchiveChats: false },
  };
};

const BufferJSON = {
  replacer: (k, value) => {
    if (Buffer.isBuffer(value) || value instanceof Uint8Array || value?.type === 'Buffer') {
      return { type: 'Buffer', data: Buffer.from(value?.data || value).toString('base64') };
    }
    return value;
  },
  reviver: (_, value) => {
    if (typeof value === 'object' && !!value && (value.buffer === true || value.type === 'Buffer')) {
      const val = value.data || value.value;
      return typeof val === 'string' ? Buffer.from(val, 'base64') : Buffer.from(val || []);
    }
    return value;
  }
};

export const useMongoDBAuthState = async (mongooseConnection, collectionName = 'auth_info_baileys') => {
  const Schema = mongooseConnection.base.Schema;
  const collection = mongooseConnection.model(collectionName, new Schema({
    _id: { type: String, required: true },
    data: { type: String, required: true }
  }));

  const writeData = async (data, id) => {
    try {
      const str = JSON.stringify(data, BufferJSON.replacer);
      await collection.updateOne({ _id: id }, { $set: { data: str } }, { upsert: true });
    } catch (err) {
      Logger.error(`Error escribiendo en MongoDB (${id})`, err);
    }
  };

  const readData = async (id) => {
    try {
      const doc = await collection.findOne({ _id: id });
      if (doc && doc.data) return JSON.parse(doc.data, BufferJSON.reviver);
    } catch (err) {
      Logger.error(`Error leyendo de MongoDB (${id})`, err);
    }
    return null;
  };

  const removeData = async (id) => {
    try {
      await collection.deleteOne({ _id: id });
    } catch (err) {
      Logger.error(`Error borrando en MongoDB (${id})`, err);
    }
  };

  let creds = await readData('creds') || initAuthCreds();

  return {
    state: {
      creds,
      keys: {
        get: async (type, ids) => {
          const data = {};
          await Promise.all(
            ids.map(async id => {
              let value = await readData(`${type}-${id}`);
              if (type === 'app-state-sync-key' && value) {
                value = proto.Message.AppStateSyncKeyData.fromObject(value);
              }
              data[id] = value;
            })
          );
          return data;
        },
        set: async (data) => {
          const tasks = [];
          for (const category in data) {
            for (const id in data[category]) {
              const value = data[category][id];
              const key = `${category}-${id}`;
              tasks.push(value ? writeData(value, key) : removeData(key));
            }
          }
          await Promise.all(tasks);
        }
      }
    },
    saveCreds: () => writeData(creds, 'creds')
  };
};
