import {
  Entity,
  EntityId,
  EntityService,
  EntityShortId,
  EntityShortService,
  FanSpeed6Service,
  FanSpeed6Speed,
  FunctionNodeBase,
  HA,
  NodeRedContextApi,
  NodeRedGlobalApi,
  NodeRedLogFunction,
  ServicePayload,
  isFanSpeed6Speed,
  newFanSpeed6Service,
  newSwitchService
} from 'epdoc-node-red-hautil';
import { Milliseconds } from 'epdoc-timeutil';
import {
  delayPromise,
  isDict,
  isFunction,
  isInteger,
  isNonEmptyArray,
  isNonEmptyString,
  isNumber,
  isString
} from 'epdoc-util';

const REG = {
  onoff: new RegExp(/^(on|off)$/, 'i'),
  on: new RegExp(/on$/, 'i'),
  off: new RegExp(/off$/, 'i')
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
  fnSend?: PayloadSendFunction;
};
export function isFanRunParams(val: any): val is FanRunParams {
  return isDict(val) && isNonEmptyString(val.fan);
}
type FanControlLogFunctions = {
  debug: NodeRedLogFunction;
  error: NodeRedLogFunction;
};

export class FanControl extends FunctionNodeBase {
  // private fanId: EntityId = '';
  // private switch: EntityId = '';
  private _retryDelay: Milliseconds[] = [1000, 3000];
  private log: FanControlLogFunctions = {
    debug: (...args) => {},
    error: this.node.error
  };
  private _fnSend: PayloadSendFunction;
  private _ha: HA;
  private _shutoff: boolean = false;
  private _shortId: EntityShortId;
  private _fan: Entity;
  private _switch: Entity;
  private _speed: FanSpeed6Speed = 0;
  private _service: 'on' | 'off' = 'off';
  private _bOn: boolean = false;
  private _timeout: Milliseconds = 0;

  constructor(global: NodeRedGlobalApi, opts: NodeRedContextApi) {
    super(global, opts);
    this._ha = new HA(this.global);
  }

  fan(shortId: EntityShortId): this {
    if (isNonEmptyString(shortId)) {
      this._shortId = shortId;
      const fanId: EntityId = 'fan.' + shortId;
      const switchId: EntityId = fanId;
      this._fan = this._ha.entity(fanId);
      this._switch = this._ha.entity(switchId);
    }
    return this;
  }

  get fanId(): EntityId {
    return this._fan.entityId || 'undefined';
  }

  get switchId(): EntityId {
    return this._switch.entityId || 'undefined';
  }

  shutoff(entityId: EntityId | undefined): this {
    if (isNonEmptyString(entityId)) {
      let entity: Entity = this._ha.entity(entityId);
      if (entity.isValid() && entity.isOn()) {
        this._shutoff = true;
      } else {
        this.log.error(`Entity ${entityId} not found`);
      }
    }
    return this;
  }

  speed(speed: FanSpeed6Speed | undefined): this {
    if (isFanSpeed6Speed(speed)) {
      this._speed = speed;
      if (this._speed === 0) {
        return this.off();
      }
    }
    return this;
  }

  percentage(pct: number | undefined): this {
    if (isNumber(pct)) {
      this._speed = FanSpeed6Service.percentageToSpeed(pct);
    }
    return this;
  }

  on(val: boolean = true): this {
    this._service = val ? 'on' : 'off';
    this._bOn = val;
    return this;
  }

  off(val: boolean = true): this {
    this._service = val ? 'off' : 'on';
    this._bOn = val ? false : true;
    return this;
  }

  service(val: 'on' | 'off' | string | undefined): this {
    if (isString(val)) {
      if (REG.on.test(val)) {
        return this.on();
      } else if (REG.off.test(val)) {
        return this.off();
      }
    }
    return this;
  }

  timeout(val: Milliseconds | undefined): this {
    if (isInteger(val)) {
      this._timeout = val;
    }
    return this;
  }

  set fnSend(val: PayloadSendFunction) {
    this._fnSend = val;
  }

  setFnSend(cb?: PayloadSendFunction): this {
    if (isFunction(cb)) {
      this._fnSend = cb;
    }
    return this;
  }

  options(params?: FanRunParams): this {
    if (params) {
      if (params.debug) {
        this.log.debug = this.node.warn;
      }
      this.log.debug(`setFan input params: ${JSON.stringify(params)}`);
      this.fan(params.fan)
        .shutoff(params.shutOffEntityId)
        .speed(params.speed)
        .percentage(params.percentage)
        .service(params.service)
        .timeout(params.timeout)
        .setFnSend(params.fnSend);

      if (isNonEmptyArray(params.delay)) {
        this._retryDelay = params.delay;
      }

      this.log.debug(`setFan ${this._service.toUpperCase()} speed=${this._speed} timeout=${this._timeout}`);

      // const currentPct = ha.getEntitySpeed(fan_id);

      let bTurnedOn = false;
    }
    return this;
  }

  isValid(): boolean {
    if (Entity.isEntity(this._fan) && Entity.isEntity(this._switch) && isFunction(this._fnSend)) {
      return true;
    }
    return false;
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
    this.options(params);
    if (this.isValid()) {
      let bTurnedOn = false;

      return Promise.resolve()
        .then((resp) => {
          this.log.debug(`${this.switchId} is ${this._switch.state()}`);
          this.log.debug(`Shutoff (lightning) is ${this._shutoff}`);
          if (this._switch.isOn() && (this._shutoff || !this._bOn || (!this._bOn && this._speed === 0))) {
            this.log.debug(`Turn off ${this.fanId}`);
            let payload: ServicePayload = newFanSpeed6Service(this._shortId).off().payload();
            this._fnSend(payload);
          } else {
            this.log.debug(`Fan ${this.fanId} is ${this._switch.state()}, no need to turn off`);
          }
          if (!this._switch.isOn() && !this._shutoff && (this._bOn || this._speed > 0)) {
            this.log.debug(`Turn on ${this.switchId} because fan was off`);
            let payload = newSwitchService(this.switchId).on().payload();
            this._fnSend(payload);
            bTurnedOn = true;
          } else {
            this.log.debug(`Fan ${this.fanId} is already on`);
          }
          if (!this._shutoff && this._speed > 0 && bTurnedOn) {
            this.log.debug(`1st delay of ${this._retryDelay[0]} for ${this.switchId}`);
            return delayPromise(this._retryDelay[0]);
          } else {
            return Promise.resolve();
          }
        })
        .then(() => {
          if (!this._shutoff && this._speed > 0) {
            this.log.debug(`1st set fan speed to ${this._speed} for ${this.fanId}`);
            let payload = newFanSpeed6Service(this._shortId).speed(this._speed).payload();
            this._fnSend(payload);
            this.log.debug(`2nd delay of ${this._retryDelay[1]} for ${this.switchId}`);
            return delayPromise(this._retryDelay[1]);
          } else {
            this.log.debug(`Skipping set speed step and first delay for ${this.fanId}`);
            return Promise.resolve();
          }
        })
        .then(() => {
          if (!this._shutoff && this._speed > 0) {
            this.log.debug(`2nd set fan speed to ${this._speed} for ${this.fanId}`);
            let payload = newFanSpeed6Service(this._shortId).speed(this._speed).payload();
            this._fnSend(payload);
          }
          return Promise.resolve();
        })
        .then(() => {
          if ((this._bOn || this._speed > 0) && this._timeout && !this._shutoff) {
            this.log.debug(`timeout ${this._timeout} for ${this.switchId}`);
            return delayPromise(this._timeout);
          } else {
            return Promise.resolve();
          }
        })
        .then(() => {
          if ((this._bOn || this._speed > 0) && this._timeout && !this._shutoff) {
            this.log.debug(`timeout turn off for ${this.switchId}`);
            let payload = newSwitchService(this.switchId).off().payload();
            this._fnSend(payload);
          }
          return Promise.resolve();
        })
        .catch((err) => {
          return Promise.reject(err);
        });
    } else {
      const err: Error = new Error('FanControl invalid input parameters');
      return Promise.reject(err);
      this.log.error(err.message);
    }
    return Promise.resolve();
  }
}
