import ws from 'ws';
import EventEmitter from 'events';
import { ServerService } from '../types';
import { randomUUID } from 'crypto';
import ms from 'ms';
import { Schema } from '../utils/SchemaUtils';

const __wsServer = new ws.Server({ path: '/manager', port: 8080 });
const __emitter = new EventEmitter();
const heartbeatTimeout: number = ms('10s');

enum ServerOpCodes {
  Heartbeat,
  Identify,
  DataOK,
  CCC,
  ClusterStatus,
  DataPushed
}

enum ClientOpCodes {
  Heartbeat,
  Identity,
  SendData,
  CCC
}

interface PayloadStructure {
  op: ServerOpCodes | ClientOpCodes;
  d: any;
}

namespace ServerStructures {
  interface Heartbeat {}
  interface Identify {
    heartbeatTimeout: number;
    schema: any;
  }
}

interface Cluster extends ws {
  id: string;
  heartbeatTimeoutID?: NodeJS.Timeout;
  sendPayload(payload: PayloadStructure): void;
}

const sockets: Map<number, Cluster> = new Map<number, Cluster>();

function ClusterFromSocket(socket: ws): Cluster {
  let skt = Object.create(socket);

  let clstr: Cluster = Object.assign(skt, {
    id: randomUUID(),
    sendPayload: function (payload: PayloadStructure, ...args: any) {
      this.send(JSON.stringify(payload), ...args);
    }
  });

  return clstr;
}

__wsServer.on('connection', socket => {
  socket.send(
    JSON.stringify({
      op: ServerOpCodes.Identify,
      d: { heartbeatTimeout, schema: Schema }
    })
  );
  socket.once('message', data => {
    let payload = parsePayload(data.toString());
  });
});

function parsePayload(rawPayload: string): PayloadStructure {
  let payload;
  try {
    payload = JSON.parse(rawPayload);
  } catch (e) {
    console.error(e);
    throw new Error('rawPayload not valid JSON');
  }
  if (typeof payload.op !== 'number') {
    throw new Error('rawPayload missing op code');
  }
  return payload as PayloadStructure;
}

class WSService extends EventEmitter implements ServerService {
  public name = 'ws';
}

export default new WSService();
