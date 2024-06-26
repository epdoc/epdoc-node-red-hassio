import { EntityId, EntityShortId, FanSpeed6Service, FanSpeed6Speed, isFanSpeed6Speed } from '@epdoc/node-red-hautil';
import { Milliseconds, durationUtil } from '@epdoc/timeutil';
import {
  Dict,
  asFloat,
  asInt,
  isBoolean,
  isNonEmptyArray,
  isNonEmptyString,
  isNumber,
  isPosInteger,
  isString,
  isTrue,
  pick
} from '@epdoc/typeutil';
import {
  FanControlInstruction,
  FanControlNodeConfig,
  TimeUnit,
  TimeUnitMultiplier,
  fanControlInstructionToSpeed
} from './types';

const REG = {
  onoff: new RegExp(/^(on|off)$/, 'i'),
  on: new RegExp(/on$/, 'i'),
  off: new RegExp(/off$/, 'i')
};
const INST = {
  speed: new RegExp(/^speed_([1-6])$/)
};

/**
 * Container for Fan Control parameters
 */
export class FanControlParams {
  private _isFanControlParams = true;
  public server: string;
  public debugEnabled = false;
  public shortId: EntityShortId;
  public _setSpeed: boolean = false;
  public speed: FanSpeed6Speed = 0;
  public service: FanControlInstruction.TurnOn | FanControlInstruction.TurnOff = FanControlInstruction.TurnOff;
  // public bOn: boolean = false;
  public timeout: Milliseconds = 0;
  public retryDelay: Milliseconds[] = [1000, 3000];
  public shutoffEntityId: EntityId;

  constructor(config: Partial<FanControlNodeConfig> = {}, params: Partial<FanControlParams> = {}) {
    if (FanControlParams.isInstance(params)) {
      this.server = params.server;
      this.debugEnabled = params.debugEnabled;
      this.shortId = params.shortId;
      this.speed = params.speed;
      this.service = params.service;
      this.timeout = params.timeout;
      this.retryDelay = params.retryDelay;
      this.shutoffEntityId = params.shutoffEntityId;
    }
  }

  static isInstance(val: any): val is FanControlParams {
    return val && val._isFanControlParams;
  }

  setServer(val: any): this {
    if (isNonEmptyString(val)) {
      this.server = val.replace(/\s+/, '');
      // this.server = this.server.charAt(0).toLowerCase() + this.server.slice(1);
    }
    return this;
  }

  setDebug(val: any): this {
    if (val === true) {
      this.debugEnabled = true;
    } else if (val === false) {
      this.debugEnabled = false;
    }
    return this;
  }

  setDelay(val: any): this {
    if (isNonEmptyArray(val)) {
      this.retryDelay = val;
    }
    return this;
  }

  setFan(shortId: EntityShortId): this {
    if (isNonEmptyString(shortId)) {
      this.shortId = shortId;
    }
    return this;
  }

  setShutoff(entityId: EntityId | undefined): this {
    if (isNonEmptyString(entityId)) {
      this.shutoffEntityId = entityId;
    }
    return this;
  }

  setSpeed(enable: boolean, speed: any | undefined): this {
    const sp = asInt(speed);
    const en = isTrue(enable);
    if (en === true && isFanSpeed6Speed(sp)) {
      this._setSpeed = true;
      this.speed = sp;
      if (this.speed === 0) {
        this._setSpeed = false;
        return this.off();
      }
      // } else if (en === false) {
      //   this.speed = 0;
    }
    return this;
  }

  setPercentage(percent: any): this {
    const pct = asFloat(percent);
    if (isNumber(pct)) {
      this.speed = FanSpeed6Service.percentageToSpeed(pct);
    }
    return this;
  }

  setService(val: 'on' | 'off' | string | undefined): this {
    if (isString(val)) {
      if (REG.on.test(val)) {
        return this.on();
      } else if (REG.off.test(val)) {
        return this.off();
      }
    }
    return this;
  }

  setInstruction(inst: FanControlInstruction): this {
    if (inst === FanControlInstruction.TurnOn || inst === FanControlInstruction.TurnOff) {
      this.service = inst;
    } else if (INST.speed.test(inst)) {
      this.service = FanControlInstruction.TurnOn;
      const speed = fanControlInstructionToSpeed(inst);
      if (speed) {
        this.setSpeed(true, speed);
      }
    }
    return this;
  }

  setTimeout(...args: any[]): this {
    //   enable: boolean,
    //   val: NumberAsString | Integer | undefined,
    //   units: TimeUnit = TimeUnit.Milliseconds
    // ): this {
    if (isPosInteger(args[0])) {
      this.timeout = args[0];
    } else if (args[0] === true && args.length >= 3) {
      const t = asInt(args[1]);
      const units: TimeUnit = args[2];
      this.timeout = t * TimeUnitMultiplier[units];
    } else {
      this.timeout = 0;
    }
    return this;
  }

  on(val: boolean = true): this {
    this.service = val ? FanControlInstruction.TurnOn : FanControlInstruction.TurnOff;
    // this.bOn = val;
    return this;
  }

  off(val: boolean = true): this {
    this.service = val ? FanControlInstruction.TurnOff : FanControlInstruction.TurnOn;
    // this.bOn = val ? false : true;
    return this;
  }

  shouldSetSpeed(): boolean {
    return !this.shouldTurnOff() && this._setSpeed && isFanSpeed6Speed(this.speed) && this.speed > 0;
  }

  shouldTurnOff(): boolean {
    return this.service === 'turn_off';
  }

  shouldTurnOn(): boolean {
    return this.service === 'turn_on' || this.shouldSetSpeed();
  }

  shouldTimeout(): boolean {
    return this.shouldTurnOn() && this.timeout > 0;
  }

  applyInstanceConfig(props: Dict): this {
    this.applyProperties(props);
    this.setSpeed(props.setSpeed, props.speed);
    if (isBoolean(props.timeoutEnabled)) {
      this.setTimeout(props.timeoutEnabled, props.for, props.forUnits);
    }
    return this;
  }

  applyMessagePayload(props: Dict): this {
    this.applyProperties(props);
    if (isPosInteger(props.speed)) {
      this.setSpeed(true, props.speed);
    }
    if (isPosInteger(props.timeout)) {
      this.setTimeout(true, props.timeout, TimeUnit.Milliseconds);
    }
    return this;
  }

  /**
   * Called to apply the properties of the fan-control instance's settings and
   * the message payload settings.
   * @param props Could either be a FanControlNodeConfig or FanControlPayload
   * object
   * @returns this
   */
  applyProperties(props: Dict): this {
    this.setServer(props.server)
      .setDebug(props.debugEnabled)
      .setFan(props.fan)
      .setInstruction(props.instruction)
      .setShutoff(props.shutOffEntityId)
      .setDelay(props.delay);
    return this;
  }

  toString(): string {
    let s = '';
    if (this.service === 'turn_off') {
      s = `Turn ${this.shortId} off`;
    } else if (this._setSpeed && this.speed > 0) {
      s = `Set ${this.shortId} speed to ${this.speed}`;
    } else if (this.service === 'turn_on') {
      s = `Turn ${this.shortId} on`;
    }
    if (this.timeout > 0) {
      s += ` for ${durationUtil(this.timeout).format()}`;
    }
    return s;
  }

  toData() {
    return pick(
      this,
      'server',
      'shortId',
      'service',
      '_setSpeed',
      'speed',
      'timeout',
      'shutoffEntityId',
      'debugEnabled',
      'retryDelay'
    );
  }
}
