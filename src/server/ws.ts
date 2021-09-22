import ws from 'ws';
import EventEmitter from 'events';
import { ServerService } from '../types';
import { randomUUID } from 'crypto';
import ms from 'ms';
import { Schema } from '../utils/SchemaUtils';
import { authenticate } from '../utils/AuthHandler';

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

enum WSServerCloseCode {
  Normal = 1000,
  NoStatus = 1005,
  Abnormal = 1006,
  ServerError = 1011,
  ServiceRestart = 1012,
  BadGateway = 1014,
  UnknownError = 4000,
  InvalidOpcode = 4001,
  DecodeError = 4002,
  NotAuthenticated = 4003,
  AuthenticationFailed = 4004,
  AlreadyAuthenticated = 4005,
  HeartbeatTimeout = 4006,
  Ratelimited = 4008,
  InvalidCluster = 4010,
  InvalidClusterCount = 4011
}

enum WSClientCloseCode {
  Normal = 1000,
  GoingAway = 1001,
  NoStatus = 1005,
  Abnormal = 1006
}

enum ClientOpCodes {
  Heartbeat,
  Identity,
  SendData,
  CCC
}

interface PayloadStructure<T> {
  op: ServerOpCodes | ClientOpCodes;
  d?: T;
}

namespace ServerStructures {
  export interface Heartbeat {}
  export interface Identify {
    heartbeatTimeout: number;
    schema: any;
  }
}

namespace ClientStructures {
  export interface Heartbeat {}
  export interface Identity {
    token: string;
    clusters: number;
    cluster: number;
  }
  export interface SendData {
    type: 0 | 1 | 2;
    data: any;
  }
}

interface Cluster extends ws {
  heartbeatTimeoutID?: NodeJS.Timeout;
  sendPayload(payload: PayloadStructure<any>): void;
}

const sockets: Map<number, Cluster> = new Map<number, Cluster>();
const clusterStats = {
  maxClusters: -1
};

function ClusterFromSocket(socket: ws): Cluster {
  let skt = Object.create(socket);

  let clstr: Cluster = Object.assign(skt, {
    sendPayload: function (payload: PayloadStructure<any>, ...args: any) {
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
    let payload = parsePayload(data.toString()),
      usr = authenticate((payload.d as ClientStructures.Identity).token);
    if (!usr) {
      socket.close(WSServerCloseCode.AuthenticationFailed);
      return;
    } else {
      if (sockets.size < 1)
        clusterStats.maxClusters = (
          payload.d as ClientStructures.Identity
        ).clusters;
      else if (
        clusterStats.maxClusters !==
        (payload.d as ClientStructures.Identity).clusters
      ) {
        socket.close(WSServerCloseCode.InvalidClusterCount);
        return;
      }
      if (
        (payload.d as ClientStructures.Identity).cluster >=
        clusterStats.maxClusters
      ) {
        socket.close(WSServerCloseCode.InvalidCluster);
        return;
      }
      if (sockets.has((payload.d as ClientStructures.Identity).cluster)) {
        socket.close(WSServerCloseCode.AlreadyAuthenticated);
        return;
      }

      sockets.set(
        (payload.d as ClientStructures.Identity).cluster,
        ClusterFromSocket(socket)
      );

      function closeOrError(code: number | Error) {
        __emitter.emit(
          'disconnected',
          (payload.d as ClientStructures.Identity).cluster,
          code
        );
        sockets.delete((payload.d as ClientStructures.Identity).cluster);
      }
      sockets
        .get((payload.d as ClientStructures.Identity).cluster)
        .once('close', closeOrError);
      sockets
        .get((payload.d as ClientStructures.Identity).cluster)
        .once('error', closeOrError);

      sockets
        .get((payload.d as ClientStructures.Identity).cluster)
        .on('message', data =>
          handleClientPayload(
            (payload.d as ClientStructures.Identity).cluster,
            parsePayload(data.toString())
          )
        );

      __emitter.emit(
        'authenticated',
        (payload.d as ClientStructures.Identity).cluster,
        (payload.d as ClientStructures.Identity).clusters,
        usr
      );
    }
  });
});

function handleClientPayload(id: number, data: PayloadStructure<any>) {
  const clstr = sockets.get(id);
  switch (data.op) {
    case ClientOpCodes.Identity:
      closeSocket(id, WSServerCloseCode.AlreadyAuthenticated);
      break;
    case ClientOpCodes.Heartbeat:
      handleHeartbeat(id);
      break;
    case ClientOpCodes.SendData:
      let dataa = data as PayloadStructure<ClientStructures.SendData>;
      function dataCB(success: boolean) {
        if (success) clstr.sendPayload({ op: ServerOpCodes.DataOK });
        else closeSocket(id, WSServerCloseCode.ServerError);
      }
      __emitter.emit('data', id, dataa.d, dataCB);
      break;
    default:
      closeSocket(id, WSServerCloseCode.InvalidOpcode);
      break;
  }
}

function handleHeartbeat(id: number) {
  const cluster = sockets.get(id);
  clearTimeout(cluster.heartbeatTimeoutID);
  cluster.sendPayload({ op: ServerOpCodes.Heartbeat });
  setTimeout(() => {
    closeSocket(id, WSServerCloseCode.HeartbeatTimeout);
  }, heartbeatTimeout);
}

function closeSocket(id: number, code: WSServerCloseCode) {
  sockets.get(id).close(code);
  __emitter.emit('disconnected', id, code);
  sockets.delete(id);
}

function parsePayload(rawPayload: string): PayloadStructure<any> {
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
  return payload as PayloadStructure<any>;
}

class WSService extends EventEmitter implements ServerService {
  public name = 'ws';
}

export default new WSService();
