import {
  EntityId,
  EntityShortId,
  NodeDone,
  NodeRedLogFunction,
  NodeSend,
  ServicePayload
} from '@epdoc/node-red-hautil';
import { Milliseconds } from '@epdoc/timeutil';
import { isDict, isError } from '@epdoc/typeutil';
import { NodeContext, NodeContextData, NodeMessage } from 'node-red';
import { OutputControllerConstructor } from 'nodes/output-controller';
import { Status } from '../status';
import { FanControlNode } from './fan-control-node';
import { FanControlParams } from './fan-control-params';
import { FanMessageHandler } from './fan-message-handler';
import { FanControlInstruction, FanControlNodeConfig } from './types';

const REG = {
  onoff: new RegExp(/^(on|off)$/, 'i'),
  on: new RegExp(/on$/, 'i'),
  off: new RegExp(/off$/, 'i')
};
export interface FanControllerConstructor extends OutputControllerConstructor<FanControlNode> {}

export type FanListItem = {
  entityShortId: EntityShortId;
  name: string;
};

export type PayloadSendFunction = (payload: ServicePayload) => void | Promise<void>;
export type FanControlPayload = {
  fan: EntityShortId;
  server: string;
  instruction: FanControlInstruction;
  timeout?: Milliseconds;
  shutOffEntityId?: EntityId;
  delay?: Milliseconds[];
  debugEnabled?: boolean;
};
export function isFanControlPayload(val: any): val is FanControlPayload {
  return isDict(val);
}
type FanControlLogFunctions = {
  debug: NodeRedLogFunction;
};

/**
 * Object that does the work for a fan-control node. 
 *
 * Initialized with FanControllerConstructor object which contains context
 * information.
 * 
 * Called (run) whenenver a new message is received.
 });
 */
export class FanController {
  // Contains _node.node (this), _node.node.config (instance config), contexts.
  protected _node: FanControlNode;

  protected _status: Status;
  protected _context: NodeContext;
  protected handlers: FanMessageHandler[] = [];

  /**
   *
   * @param params Contains context information for the node
   */
  constructor(params: FanControllerConstructor) {
    this._node = params.node;
    this._status = new Status(params.node);
    // Apply our UI settings to our params
  }

  get global(): NodeContextData {
    return this._node.context().global;
  }
  get flow(): NodeContextData {
    return this._node.context().flow;
  }

  get config(): FanControlNodeConfig {
    return this._node.config;
  }

  get debugEnabled(): boolean {
    return this._node.config.debugEnabled === true;
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
    try {
      // Stop any previous message handlers that are running for this Node instance
      this.handlers.forEach((handler) => {
        handler.stop();
      });
      this.handlers = [];

      // Create a new params object for this message and set properties from this
      // Node instance.
      let params: FanControlParams = new FanControlParams();
      params.applyInstanceConfig(this._node.config);

      if (params.debugEnabled) {
        this._node.log(`Config params: ${JSON.stringify(this._node.config)}`);
        this._node.log(`Config params: ${JSON.stringify(params.toData())}`);
      }
      // Apply our message properties to params
      if (isFanControlPayload(msg.payload)) {
        this._node.log(`Message payload: ${JSON.stringify(msg.payload)}`);
        params.applyMessagePayload(msg.payload);
      }

      if (params.debugEnabled) {
        this._node.log(`Message params: ${JSON.stringify(params.toData())}`);
      }

      // Create and manage a handler for this message
      let handler: FanMessageHandler = new FanMessageHandler(this._node, msg, send, done, {
        params: params
      });
      this.handlers.push(handler);
      return handler
        .init()
        .run()
        .then((resp) => {
          handler.stop();
          this.removeHandler(handler);
        });
    } catch (err) {
      if (isError(err)) {
        this._node.log(`fan-control node error while processing message : ${err.message}`);
      }
    }
  }

  /**
   * Not used. We'd like it to be, so it could be used to populate the UI. But I
   * don't know how to get data up to the js that is running in the editor.
   * @returns
   */
  getFanList(): FanListItem[] {
    return this.global.get('fan_control_fan_list') as FanListItem[];
  }

  removeHandler(handler: FanMessageHandler): this {
    const index = this.handlers.indexOf(handler);
    if (index > -1) {
      this.handlers.splice(index, 1);
    }
    return this;
  }
}
