import { Milliseconds } from '@epdoc/timeutil';
import { pad } from '@epdoc/typeutil';
import { NodeMessage } from 'node-red';
import { NodeDone, NodeSend } from './nodes';
import { Status } from './status';
import { BaseNode } from './types';

type TimerData = {
  timer: any;
  resolve: Function;
};

let _uid = 0;
function getNewId(): string {
  return pad(++_uid, 3);
}

export class MessageHandler {
  protected node: BaseNode;
  protected status: Status;
  protected msg: NodeMessage;
  protected send: NodeSend;
  protected done: NodeDone;
  protected _stop = false;
  protected _timers: TimerData[] = [];
  readonly id = getNewId();

  constructor(node: BaseNode, msg: NodeMessage, send: NodeSend, done: NodeDone) {
    this.node = node;
    this.status = new Status(node);
    this.msg = msg;
    this.send = send;
    this.done = done;
  }

  init(): this {
    return this;
  }

  run(): Promise<void> {
    return Promise.resolve();
  }

  stop(): this {
    this._stop = true;
    this.stopTimers();
    return this;
  }

  promiseDelay(ms: Milliseconds): Promise<void> {
    return new Promise((resolve) => {
      let record: TimerData = {
        resolve: resolve,
        timer: setTimeout(() => {
          this.removeTimer(record.timer);
          resolve();
        }, ms)
      };
      this._timers.push(record);
    });
  }

  hasTimers(): boolean {
    return this._timers.length > 0;
  }

  removeTimer(timerId: any) {
    let result: TimerData[] = [];
    this._timers.forEach((item) => {
      if (item.timer !== timerId) {
        result.push(item);
      }
    });
    this._timers = result;
  }

  stopTimers() {
    this._timers.forEach((item) => {
      clearTimeout(item.timer);
      item.resolve();
    });
    this._timers = [];
  }
}
