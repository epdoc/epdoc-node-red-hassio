import {
  Entity,
  EntityId,
  EntityService,
  EntityShortId,
  EntityShortService,
  FanSpeed6Speed,
  HA,
  NodeDone,
  NodeRedLogFunction,
  NodeRedNodeApi,
  NodeSend,
  ServicePayload,
  newFanSpeed6Service,
  newSwitchService
} from 'epdoc-node-red-hautil';
import { Milliseconds } from 'epdoc-timeutil';
import { delayPromise, isDict, isNonEmptyString } from 'epdoc-util';
import { NodeContext, NodeContextData, NodeMessage } from 'node-red';
import { OutputControllerConstructor } from 'nodes/output-controller';
import { FanControlNode } from './fan-control-node';
import { FanControlParams } from './fan-control-params';
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
export type FanRunParams = {
  fan: EntityShortId;
  speed?: FanSpeed6Speed;
  percentage?: number;
  service?: EntityService | EntityShortService;
  timeout?: Milliseconds;
  shutOffEntityId?: EntityId;
  delay?: Milliseconds[];
  debug?: boolean;
};
export function isFanRunParams(val: any): val is FanRunParams {
  return isDict(val) && isNonEmptyString(val.fan);
}
type FanControlLogFunctions = {
  debug: NodeRedLogFunction;
};

export class FanController {
  protected _node: FanControlNode;
  protected _context: NodeContext;
  protected node: NodeRedNodeApi;
  protected log: FanControlLogFunctions = {
    debug: (...args) => {}
  };
  protected opts: FanControlParams = new FanControlParams();
  private _msg: NodeMessage;
  private _nodeSend: NodeSend;
  private _nodeDone: NodeDone;
  protected _ha: HA;
  private _shutoff: boolean = false;
  protected _fan: Entity;
  protected _switch: Entity;

  constructor(params: FanControllerConstructor) {
    this._node = params.node;

    const nodeContext = this._node.context();
    const flowContext = this._node.context().flow;
    const globalContext = this._node.context().global;
    this._node.log(`context keys = ${JSON.stringify(nodeContext.keys())}`);
    this._node.log(`flow keys = ${JSON.stringify(flowContext.keys())}`);
    this._node.log(`global keys = ${JSON.stringify(globalContext.keys())}`);

    const global = this._node.context().global;
    this._node.log(`global keys = ${JSON.stringify(global.keys())}`);
    this.setFanControlConfig(params.node.config);
  }

  setMessage(msg: NodeMessage, send: NodeSend, done: NodeDone): void {
    this._msg = msg;
    this._nodeSend = send;
    this._nodeDone = done;
    this._node.status({ fill: 'green', shape: 'dot', text: 'constructed' });
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
      this.opts
        .setDebug(config.debugEnabled)
        .setFan(config.fan)
        .setInstruction(config.instruction)
        .setTimeout(config.for, config.forUnits);
      // this.initBeforeRun();
    }
    console.log(`setUiConfig/global ${JSON.stringify(this.global)}`);
    return this;
  }

  setPayloadConfig(params?: any): this {
    if (isFanRunParams(params)) {
      this.opts
        .setDebug(params.debug)
        .setFan(params.fan)
        .setShutoff(params.shutOffEntityId)
        .setSpeed(params.speed)
        .setPercentage(params.percentage)
        .setService(params.service)
        .setTimeout(params.timeout)
        .setDelay(params.delay);
      // this.initBeforeRun();
      this.log.debug(`setFan input params: ${JSON.stringify(params)}`);

      this.log.debug(`setFan ${this.opts.service.toUpperCase()} speed=${this.opts.speed} timeout=${this.opts.timeout}`);

      // const currentPct = ha.getEntitySpeed(fan_id);

      let bTurnedOn = false;
    }
    return this;
  }

  initBeforeRun(): this {
    if (this.opts.debugEnabled) {
      this.log.debug = this.node.warn;
    }
    this._ha = new HA(this.global);
    if (isNonEmptyString(this.opts.shortId)) {
      const fanId: EntityId = 'fan.' + this.opts.shortId;
      const switchId: EntityId = fanId;
      this._fan = this._ha.entity(fanId);
      this._switch = this._ha.entity(switchId);
    }
    if (isNonEmptyString(this.opts.shutoffEntityId)) {
      let entity: Entity = this._ha.entity(this.opts.shutoffEntityId);
      if (entity.isValid() && entity.isOn()) {
        this._shutoff = true;
      } else {
        this.node.error(`Entity ${this.opts.shutoffEntityId} not found`);
      }
    }
    return this;
  }

  serviceSend(payload: any) {
    // @ts-ignore
    this._nodeSend([null, { payload: payload }]);
  }

  done() {
    // @ts-ignore
    this._nodeSend([this._msg, null]);
    this._nodeDone();
  }

  isValid(): boolean {
    return Entity.isEntity(this._fan) && Entity.isEntity(this._switch);
  }

  get fanId(): EntityId {
    return this._fan.entityId || 'undefined';
  }

  get switchId(): EntityId {
    return this._switch.entityId || 'undefined';
  }

  /**
   * Custom Node-RED function code for controlling a fan where (i) the fan on/off
   * is controlled by a switch (ii) the fan speed is controlled by a Bond Bridge
   * that sends out RF signals to the fan. Supports reading the state of an input
   * boolean that will keep the fan off. This can be used, for example, when there
   * is a lightning storm and you wish to keep the fan switched off at it's
   * switch.
   */
  run(params?: FanRunParams): Promise<void> {
    this.setPayloadConfig(params);
    this.initBeforeRun();
    if (this.isValid()) {
      let bTurnedOn = false;

      return Promise.resolve()
        .then((resp) => {
          this.log.debug(`${this.switchId} is ${this._switch.state()}`);
          this.log.debug(`Shutoff (lightning) is ${this._shutoff}`);
          if (this._switch.isOn() && (this._shutoff || this.opts.shouldTurnOff())) {
            this.log.debug(`Turn off ${this.fanId}`);
            let payload: ServicePayload = newFanSpeed6Service(this.opts.shortId).off().payload();
            this.serviceSend(payload);
            this._node.status({ fill: 'green', shape: 'ring', text: `Turn off ${this.fanId}` });
          } else {
            this.log.debug(`Fan ${this.fanId} is ${this._switch.state()}, no need to turn off`);
          }
          if (!this._switch.isOn() && !this._shutoff && this.opts.shouldTurnOn()) {
            this.log.debug(`Turn on ${this.switchId} because fan was off`);
            let payload = newSwitchService(this.switchId).on().payload();
            this.serviceSend(payload);
            bTurnedOn = true;
            this._node.status({ fill: 'green', shape: 'dot', text: `Turned on ${this.fanId}` });
          } else {
            this.log.debug(`Fan ${this.fanId} is already on`);
          }
          if (!this._shutoff && this.opts.speed > 0 && bTurnedOn) {
            this.log.debug(`1st delay of ${this.opts.retryDelay[0]} for ${this.switchId}`);
            return delayPromise(this.opts.retryDelay[0]);
          } else {
            return Promise.resolve();
          }
        })
        .then(() => {
          if (!this._shutoff && this.opts.speed > 0) {
            this.log.debug(`1st set fan speed to ${this.opts.speed} for ${this.fanId}`);
            let payload = newFanSpeed6Service(this.opts.shortId).speed(this.opts.speed).payload();
            this.serviceSend(payload);
            this.log.debug(`2nd delay of ${this.opts.retryDelay[1]} for ${this.switchId}`);
            this._node.status({ fill: 'blue', shape: 'dot', text: `Set ${this.fanId} to ${this.opts.speed}` });
            return delayPromise(this.opts.retryDelay[1]);
          } else {
            this.log.debug(`Skipping set speed step and first delay for ${this.fanId}`);
            return Promise.resolve();
          }
        })
        .then(() => {
          if (!this._shutoff && this.opts.speed > 0) {
            this.log.debug(`2nd set fan speed to ${this.opts.speed} for ${this.fanId}`);
            let payload = newFanSpeed6Service(this.opts.shortId).speed(this.opts.speed).payload();
            this.serviceSend(payload);
            this._node.status({ fill: 'blue', shape: 'ring', text: `Set ${this.fanId} to ${this.opts.speed}` });
          }
          return Promise.resolve();
        })
        .then(() => {
          if (this.opts.shouldTimeout() && !this._shutoff) {
            this.log.debug(`timeout ${this.opts.timeout} for ${this.switchId}`);
            this._node.status({ fill: 'yellow', shape: 'ring', text: `${this.fanId} waiting ${this.opts.timeout} ms` });
            return delayPromise(this.opts.timeout);
          } else {
            return Promise.resolve();
          }
        })
        .then(() => {
          if (this.opts.shouldTimeout() && !this._shutoff) {
            this.log.debug(`timeout turn off for ${this.switchId}`);
            let payload = newSwitchService(this.switchId).off().payload();
            this.serviceSend(payload);
            this._node.status({ fill: 'green', shape: 'ring', text: `Turn off ${this.fanId}` });
          }
          return Promise.resolve();
        })
        .catch((err) => {
          return Promise.reject(err);
        });
    } else {
      const err: Error = new Error('FanControl invalid input parameters');
      this._node.error(err.message);
      this._node.status({ fill: 'red', shape: 'dot', text: 'Invalid parameters' });
      return Promise.reject(err);
    }
    return Promise.resolve();
  }
}
