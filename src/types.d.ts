import EventEmitter from 'node:events';

declare interface Data {
  type: 0 | 1 | 2;
  data: any;
}

declare interface EventListeners<T> {
  (
    event: 'authenticated',
    listener: (id: number, totalClusters: number, user: string) => void
  ): T;
  (
    event: 'data',
    listener: (id: number, data: Data, cb: (success: boolean) => void) => void
  ): T;
}

declare interface ServerService extends EventEmitter {
  name: string;
  on: EventListeners<this>;
  once: EventListeners<this>;
  off: EventListeners<this>;
  addListener: EventListeners<this>;
}
