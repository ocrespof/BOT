import { pathToFileURL } from 'url';
import path from 'path';

const file = path.resolve('./cmds/juegos/trivia.js');
const imported = await import(pathToFileURL(file).href);
const pluginObj = { ...imported };
console.log('pluginObj.before:', typeof pluginObj.before);
console.log('imported.before:', typeof imported.before);
