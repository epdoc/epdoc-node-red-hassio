import { NodeDone, NodeRedLogFunction, NodeSend, ServicePayload } from '@epdoc/node-red-hautil';
import { isDict, isNonEmptyArray } from '@epdoc/typeutil';
import { NodeContext, NodeContextData, NodeMessage } from 'node-red';
import { OutputControllerConstructor } from 'nodes/output-controller';
import { Status } from '../status';
import { PingTestMessageHandler } from './ping-message-handler';
import { PingTestNode } from './ping-test-node';
import { PingTestParams } from './ping-test-params';
import { PingTestNodeConfig, isPingTestNodeConfig } from './types';

export interface PingTestControllerConstructor extends OutputControllerConstructor<PingTestNode> {}

export type PayloadSendFunction = (payload: ServicePayload) => void | Promise<void>;
export type PingTestPayload = {
  hosts: string[];
  debugEnabled?: boolean;
};
export function isPingTestPayload(val: any): val is PingTestPayload {
  return isDict(val) && isNonEmptyArray(val.hosts);
}
type PingTestLogFunctions = {
  debug: NodeRedLogFunction;
};

export class PingTestController {
  protected _node: PingTestNode;
  protected _status: Status;
  protected _context: NodeContext;
  protected params: PingTestParams = new PingTestParams();
  protected handlers: PingTestMessageHandler[] = [];

  constructor(params: PingTestControllerConstructor) {
    this._node = params.node;
    this._status = new Status(params.node);
    this.setPingTestConfig(params.node.config);
  }

  get global(): NodeContextData {
    return this._node.context().global;
  }
  get flow(): NodeContextData {
    return this._node.context().flow;
  }

  get debugEnabled(): boolean {
    return this._node.config.debugEnabled === true;
  }

  setPingTestConfig(config?: PingTestNodeConfig): this {
    if (isPingTestNodeConfig(config)) {
      this.params.setDebug(config.debugEnabled);
    }
    return this;
  }

  setPayloadConfig(params?: any): this {
    if (isPingTestPayload(params)) {
      this.params.setDebug(params.debugEnabled);

      if (this.params.debugEnabled) {
        this._node.log(`Input params: ${JSON.stringify(params)}`);
        this._node.log(this.params.toString());
      }
    }
    return this;
  }

  /**
   * Custom Node-RED function code for controlling a fan where (i) the fan on/off
   * is controlled by a switch (ii) the fan speed is controlled by a Bond Bridge
   * that sends out RF signals to the fan. Supports reading the state of an input
   * boolean that will keep the fan off. This can be used, for example, when there
   * is a lightning storm and you wish to keep the fan switched off at it's
   * switch.
   */
  async run(msg: NodeMessage, send: NodeSend, done: NodeDone): Promise<void> {
    this.handlers.forEach((handler) => {
      handler.stop();
    });
    this.handlers = [];
    if (isPingTestPayload(msg.payload)) {
      this.setPayloadConfig(msg.payload);
    }
    let handler: PingTestMessageHandler = new PingTestMessageHandler(this._node, msg, send, done, {
      params: new PingTestParams(this.params)
    });
    this.handlers.push(handler);
    return handler
      .init()
      .run()
      .then((resp) => {
        handler.stop();
        this.removeHandler(handler);
      });
  }

  removeHandler(handler: PingTestMessageHandler): this {
    const index = this.handlers.indexOf(handler);
    if (index > -1) {
      this.handlers.splice(index, 1);
    }
    return this;
  }
}
