import ws from 'ws';
import EventEmitter from 'events';

const __wsServer = new ws.Server({ path: '/manager', port: 8080 });
const __emitter = new EventEmitter();

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
}

interface Cluster extends ws {
  id?: number;
  heartbeatTimeoutID?: NodeJS.Timeout;
}

const sockets: Map<number, Cluster> = new Map<number, Cluster>();

__wsServer.on('connection', (socket, req) => {});

const __serverService: ServerService = {
  name: 'ws',

  emitter: __emitter
};

export default __serverService;
