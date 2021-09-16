import Logger, { Level } from './utils/Logger';
import ws from 'ws';
import ms from 'ms';
import { init as initDB } from './utils/DB';

import dotenvConfig from './utils/dotenv';
import {
  validate as validateSchema,
  validateData as validateSchemaData
} from './utils/SchemaUtils';
dotenvConfig();

global.console = new Logger(
  process.env.DEBUG ? Level.DEBUG : Level.WARN
) as any;

(async function () {
  await validateSchema();
  console.log(
    await validateSchemaData({ ping: 10, name: '2ef', props: { uptime: 1345 } })
  );
  console.log(await initDB());
})();
