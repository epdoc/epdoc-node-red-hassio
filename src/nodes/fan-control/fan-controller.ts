import {
  EntityId,
  EntityService,
  EntityShortId,
  EntityShortService,
  FanSpeed6Speed,
  NodeDone,
  NodeRedLogFunction,
  NodeSend,
  ServicePayload
} from 'epdoc-node-red-hautil';
import { Milliseconds } from 'epdoc-timeutil';
import { isDefined, isDict, isInteger, isNonEmptyString, isPosInteger } from 'epdoc-util';
import { NodeContext, NodeContextData, NodeMessage } from 'node-red';
import { OutputControllerConstructor } from 'nodes/output-controller';
import { Status } from '../status';
import { FanControlNode } from './fan-control-node';
import { FanControlParams } from './fan-control-params';
import { FanMessageHandler } from './fan-message-handler';
import { FanControlNodeConfig, isFanControlNodeConfig } from './types';

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
  setSpeed?: boolean;
  speed?: FanSpeed6Speed;
  percentage?: number;
  service?: EntityService | EntityShortService;
  timeoutEnabled?: boolean;
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

export class FanController {
  protected _node: FanControlNode;
  protected _status: Status;
  protected _context: NodeContext;
  protected params: FanControlParams = new FanControlParams();
  protected handlers: FanMessageHandler[] = [];

  constructor(params: FanControllerConstructor) {
    this._node = params.node;
    this._status = new Status(params.node);
    this.setFanControlConfig(params.node.config);
    this._status.green().ring().text('constructed').update();
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

      // this.initBeforeRun();
    }
    console.log(`setUiConfig/global ${JSON.stringify(this.global)}`);
    return this;
  }

  setPayloadConfig(params?: any): this {
    if (isFanControlPayload(params)) {
      this.params
        .setServer(params.server)
        .setDebug(params.debugEnabled)
        .setFan(params.fan)
        .setShutoff(params.shutOffEntityId)
        .setPercentage(params.percentage)
        .setService(params.service)
        .setDelay(params.delay);

      if (
        (this.params.bOn && (params.setSpeed || isPosInteger(params.speed))) ||
        (isInteger(params.speed) && !isDefined(params.service))
      ) {
        this.params.setSpeed(true, params.speed);
      } else if (params.setSpeed === false) {
        this.params.setSpeed(false, 0);
      }
      if (this.params.bOn && isPosInteger(params.timeout)) {
        this.params.setTimeout(true, params.timeout);
      }
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
    if (isFanControlPayload(msg.payload)) {
      this.setPayloadConfig(msg.payload);
      this.handlers.forEach((handler) => {
        handler.stop();
      });
      this.handlers = [];
      let handler: FanMessageHandler = new FanMessageHandler(this._node, msg, send, done, { params: this.params });
      this.handlers.push(handler);
      return handler.init().run();
    }
  }
}
