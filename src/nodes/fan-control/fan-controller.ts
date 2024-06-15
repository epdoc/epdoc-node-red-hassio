import {
  EntityId,
  EntityShortId,
  NodeDone,
  NodeRedLogFunction,
  NodeSend,
  ServicePayload
} from '@epdoc/node-red-hautil';
import { Milliseconds } from '@epdoc/timeutil';
import { isDict, isNonEmptyString, isPosInteger } from '@epdoc/typeutil';
import { NodeContext, NodeContextData, NodeMessage } from 'node-red';
import { OutputControllerConstructor } from 'nodes/output-controller';
import { Status } from '../status';
import { FanControlNode } from './fan-control-node';
import { FanControlParams } from './fan-control-params';
import { FanMessageHandler } from './fan-message-handler';
import { FanControlInstruction, FanControlNodeConfig, isFanControlNodeConfig } from './types';

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
  return isDict(val) && isNonEmptyString(val.fan);
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
  protected _node: FanControlNode;
  protected _status: Status;
  protected _context: NodeContext;
  protected params: FanControlParams = new FanControlParams();
  protected handlers: FanMessageHandler[] = [];

  /**
   *
   * @param params Contains context information for the node
   */
  constructor(params: FanControllerConstructor) {
    this._node = params.node;
    this._status = new Status(params.node);
    this.setFanControlConfig(params.node.config);
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
    if (isFanControlPayload(msg.payload)) {
      this.setPayloadConfig(msg.payload);
    }
    let handler: FanMessageHandler = new FanMessageHandler(this._node, msg, send, done, {
      params: new FanControlParams(this.params)
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

  getFanList(): FanListItem[] {
    return this.global.get('fan_control_fan_list') as FanListItem[];
  }

  setFanControlConfig(config?: FanControlNodeConfig): this {
    if (isFanControlNodeConfig(config)) {
      this.params
        .setServer(config.server)
        .setDebug(config.debugEnabled)
        .setFan(config.fan)
        .setInstruction(config.instruction)
        .setSpeed(config.setSpeed, config.speed)
        .setTimeout(config.timeoutEnabled, config.for, config.forUnits);
      // if (config.setSpeed === true && isFanSpeed6Speed(config.speed)) {
      //   this.params.setInstruction(fanControlSpeedToInstruction(config.speed));
      // }

      // this.initBeforeRun();
    }
    // console.log(`setUiConfig/global ${JSON.stringify(this.global)}`);
    return this;
  }

  setPayloadConfig(params?: any): this {
    if (isFanControlPayload(params)) {
      this.params
        .setServer(params.server)
        .setDebug(params.debugEnabled)
        .setFan(params.fan)
        .setShutoff(params.shutOffEntityId)
        .setInstruction(params.instruction)
        .setDelay(params.delay)
        .setTimeout(isPosInteger(params.timeout), params.timeout);

      if (this.params.debugEnabled) {
        this._node.log(`Input params: ${JSON.stringify(params)}`);
        this._node.log(this.params.toString());
      }
    }
    return this;
  }

  removeHandler(handler: FanMessageHandler): this {
    const index = this.handlers.indexOf(handler);
    if (index > -1) {
      this.handlers.splice(index, 1);
    }
    return this;
  }
}
