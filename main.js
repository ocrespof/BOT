import seeCommands from "./core/system/commandLoader.js";
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
  executorMiddleware,
} from "./core/system/middleware.js";
import { dbStorage, DbSession } from "./core/system/database.js";
import Logger from "./utils/logger.js";

export const initCommands = async () => {
  await seeCommands();
};

initCommands().catch((err) => Logger.error("Error al cargar comandos:", err));

const middlewares = [
  dbInitMiddleware,
  pluginInterceptorMiddleware,
  prefixResolverMiddleware,
  commandParserMiddleware,
  restrictionGuardsMiddleware,
  antiSpamGuardMiddleware,
  cooldownGuardMiddleware,
  mediaQueueMiddleware,
  executorMiddleware,
];

export default async (client, m) => {
  const session = new DbSession();
  await dbStorage.run(session, async () => {
    try {
      const ctx = { client, m };
      await runPipeline(ctx, middlewares);
    } catch (err) {
      Logger.error("Error imprevisto en el pipeline de mensajes:", err);
    } finally {
      session.flush();
    }
  });
};
