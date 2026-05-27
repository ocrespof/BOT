import seeCommands from './core/system/commandLoader.js';
import {
  runPipeline,
  dbInitMiddleware,
  prefixResolverMiddleware,
  pluginInterceptorMiddleware,
  commandParserMiddleware,
  restrictionGuardsMiddleware,
  antiSpamGuardMiddleware,
  cooldownGuardMiddleware,
  mediaQueueMiddleware,
  executorMiddleware
} from './core/system/middleware.js';

seeCommands();

const middlewares = [
  dbInitMiddleware,
  prefixResolverMiddleware,
  pluginInterceptorMiddleware,
  commandParserMiddleware,
  restrictionGuardsMiddleware,
  antiSpamGuardMiddleware,
  cooldownGuardMiddleware,
  mediaQueueMiddleware,
  executorMiddleware
];

export default async (client, m) => {
  const ctx = { client, m };
  await runPipeline(ctx, middlewares);
};
