import EventEmitter from 'node:events';

declare interface EventListeners<T> {
  (event: 'authenticated', listener: () => void): T;
  (event: 'data', listener: () => void): T;
}

declare interface ServerService extends EventEmitter {
  name: string;
  on: EventListeners<this>;
  once: EventListeners<this>;
  off: EventListeners<this>;
  addListener: EventListeners<this>;
}
