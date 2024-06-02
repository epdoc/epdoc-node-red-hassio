import { Milliseconds, durationUtil } from '@epdoc/timeutil';
import { EntityId, EntityShortId, FanSpeed6Service, FanSpeed6Speed, isFanSpeed6Speed } from 'epdoc-node-red-hautil';
import {
  Integer,
  asFloat,
  asInt,
  isDefined,
  isNonEmptyArray,
  isNonEmptyString,
  isNumber,
  isString,
  pick
} from 'epdoc-util';
import { FanControlInstruction, NumberAsString, TimeUnit } from './types';

const REG = {
  onoff: new RegExp(/^(on|off)$/, 'i'),
  on: new RegExp(/on$/, 'i'),
  off: new RegExp(/off$/, 'i'),
  speed: new RegExp(/speed_[1-6]/)
};

/**
 * Container for Fan Control parameters
 */
export class FanControlParams {
  private _isFanControlParams = true;
  public server: string;
  public debugEnabled = false;
  public shortId: EntityShortId;
  public speed: FanSpeed6Speed = 0;
  public service: FanControlInstruction.TurnOn | FanControlInstruction.TurnOff = FanControlInstruction.TurnOff;
  // public bOn: boolean = false;
  public timeout: Milliseconds = 0;
  public retryDelay: Milliseconds[] = [1000, 3000];
  public shutoffEntityId: EntityId;

  constructor(params?: FanControlParams) {
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
      this.server = this.server.charAt(0).toLowerCase() + this.server.slice(1);
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
    if (enable && isFanSpeed6Speed(sp)) {
      this.speed = sp;
      if (this.speed === 0) {
        return this.off();
      }
      // } else if (enable === false) {
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
    } else if (REG.speed.test(inst)) {
      this.service = FanControlInstruction.TurnOn;
      this.setSpeed(true, asInt(inst));
    }
    return this;
  }

  setTimeout(
    enable: boolean,
    val: NumberAsString | Integer | undefined,
    units: TimeUnit = TimeUnit.Milliseconds
  ): this {
    if (enable && isDefined(val)) {
      const t = asInt(val);
      if (units === TimeUnit.Milliseconds) {
        this.timeout = t;
      } else if (units === TimeUnit.Seconds) {
        this.timeout = t * 1000;
      } else if (units === TimeUnit.Minutes) {
        this.timeout = t * 60 * 1000;
      } else if (units === TimeUnit.Hours) {
        this.timeout = t * 3600 * 1000;
      } else if (units === TimeUnit.Days) {
        this.timeout = t * 24 * 3600 * 1000;
      }
    } else if (enable === false) {
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
    return !this.shouldTurnOff() && isFanSpeed6Speed(this.speed) && this.speed > 0;
  }

  shouldTurnOff(): boolean {
    return this.service === 'turn_off';
  }
  shouldTurnOn(): boolean {
    return this.service === 'turn_on' || this.speed > 0;
  }

  shouldTimeout(): boolean {
    return this.shouldTurnOn() && this.timeout > 0;
  }

  toString() {
    let s = '';
    if (this.service === 'turn_off') {
      s = `Turn ${this.shortId} Off`;
    } else if (this.speed > 0) {
      s = `Set ${this.shortId} speed to ${this.speed}`;
    } else if (this.service === 'turn_on') {
      s = `Turn ${this.shortId} On`;
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
      'speed',
      'timeout',
      'shutoffEntityId',
      'debugEnabled',
      'retryDelay'
    );
  }
}
