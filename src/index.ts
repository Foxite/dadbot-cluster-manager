import Logger, { Level } from './utils/Logger';
import { init as initDB } from './utils/DB';
import Servers from './server';

import dotenvConfig from './utils/dotenv';
import { validate as validateSchema } from './utils/SchemaUtils';
dotenvConfig();

global.console = new Logger(
  process.env.DEBUG ? Level.DEBUG : Level.WARN
) as any;

(async function () {
  try {
    await validateSchema();
    console.log(await initDB());
    Servers.forEach(s => {
      console.log(s.name);
    });
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
