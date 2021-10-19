import Logger, { Level } from './utils/Logger';
import { init as initDB } from './utils/DB';
import Clusters from './utils/DB/Clusters';
import Logs from './utils/DB/Logs';
import Errors from './utils/DB/Errors';
import Servers from './server';

import dotenvConfig from './utils/dotenv';
import Ajv from 'ajv';
import { generateToken } from './utils/AuthHandler';
import { GenericCloseCodes } from './types';
const ajv = new Ajv();
dotenvConfig();

const cdata: {
    stats: { [key: number]: any };
    count: number;
  } = {
    stats: {},
    count: -1
  },
  schema = require('../config/schema.json');
let validateSchemaData: any;

global.console = new Logger(
  process.env.DEBUG ? Level.DEBUG : Level.WARN
) as any;

console.log(generateToken('joe'));

(async function () {
  try {
    validateSchemaData = ajv.compile(schema);
    console.log(await initDB());
    Servers.forEach(s => {
      s.on('authenticated', (id, tC, u) => {
        cdata.count = tC;
        console.log(id, tC, u);
      });

      s.on('disconnected', (id, code) => {
        console.log(code, id);
      });
      s.on('data', (id, data, callback) => {
        switch (data.type) {
          case 0:
            if (!cdata.stats[id]) {
              if (!validateSchemaData(data.data))
                callback(false, GenericCloseCodes.NotReadyForData);
              else {
                callback(true);
                cdata.stats[id] = data.data;
                if (
                  new Array(cdata.count)
                    .fill(0)
                    .map((v, i, a) => i)
                    .every(v => !!cdata.stats[v])
                ) {
                  Clusters.create({ id: Date.now(), data: cdata.stats }).then(
                    () => {
                      cdata.stats = {};
                      s.dataPushed();
                    }
                  );
                }
              }
              cdata.stats[id] = data;
            } else {
              callback(false, GenericCloseCodes.NotReadyForData);
            }
            break;
          case 1:
            Logs.create({ id: Date.now(), data: data.data }).then(
              () => {
                callback(true);
              },
              () => {
                callback(false, GenericCloseCodes.ServerError);
              }
            );
            break;
          case 2:
            Errors.create({ id: Date.now(), data: data.data }).then(
              () => {
                callback(true);
              },
              () => {
                callback(false, GenericCloseCodes.ServerError);
              }
            );
            break;
          default:
            callback(false, GenericCloseCodes.InvalidData);
        }
      });
    });
  } catch (e) {
    console.error(e);
    Servers.forEach(s => {
      s.serverClosing();
    });
    process.exit(1);
  }
  process.on('beforeExit', code => {
    Servers.forEach(s => {
      s.serverClosing();
    });
    process.exit(code);
  });
})();
