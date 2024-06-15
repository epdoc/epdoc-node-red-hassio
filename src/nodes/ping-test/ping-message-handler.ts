import { HA, NodeRedLogFunction } from '@epdoc/node-red-hautil';
import { NodeMessage } from 'node-red';
import { MessageHandler } from '../message-handler';
import { NodeDone, NodeSend } from '../nodes';
import { BaseNode } from '../types';
import { PingTestNode } from './ping-test-node';
import { PingTestParams } from './ping-test-params';

export type PingTestMessageHandlerOpts = {
  params: PingTestParams;
};
type PingTestLogFunctions = {
  debug: NodeRedLogFunction;
};

export class PingTestMessageHandler extends MessageHandler {
  protected step = 0;
  protected node: PingTestNode;
  protected params: PingTestParams;
  protected log: PingTestLogFunctions = {
    debug: (...args) => {}
  };
  protected ha: HA;
  protected shutoff = false;
  protected bTurnedOn = false;

  constructor(node: BaseNode, msg: NodeMessage, send: NodeSend, done: NodeDone, opts: PingTestMessageHandlerOpts) {
    super(node, msg, send, done);
    this.params = opts.params;
    if (this.params.debugEnabled) {
      this.log.debug = (msg) => {
        this.node.log(`[${this.id}.${this.step}] ${msg}`);
      };
      this.log.debug('Debug enabled');
    }
  }

  init(): this {
    return this;
  }

  stop(): this {
    if (this.hasTimers()) {
      // this.log.debug(`${this.fanId} STOPPED`);
      this.status.red().dot().text(`STOPPED`).update();
    }
    return super.stop();
  }

  isValid(): boolean {
    return true;
  }

  sendPayload(payload: any): this {
    this.log.debug(`send ${JSON.stringify(payload)}`);
    this.send([null, { payload: payload }]);
    return this;
  }

  async run(): Promise<void> {
    // this.log.debug('run');
    this.status.grey().ring().text('Run').update();
    this.log.debug(`Run: ${this.params.toString()}`);

    return Promise.resolve()
      .then((resp) => {
        this.log.debug('Run complete');
        this.status.green().dot().append('done').update();
      })
      .catch((err) => {
        return Promise.reject(err);
      });
  }
}
