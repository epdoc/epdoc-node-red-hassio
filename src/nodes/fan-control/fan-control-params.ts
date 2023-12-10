import { EntityId, EntityShortId, FanSpeed6Service, FanSpeed6Speed, isFanSpeed6Speed } from 'epdoc-node-red-hautil';
import { Milliseconds } from 'epdoc-timeutil';
import { Integer, asInt, isDefined, isNonEmptyArray, isNonEmptyString, isNumber, isString } from 'epdoc-util';
import { FanControlInstruction, NumberAsString, TimeUnit } from './types';

const REG = {
  onoff: new RegExp(/^(on|off)$/, 'i'),
  on: new RegExp(/on$/, 'i'),
  off: new RegExp(/off$/, 'i'),
  speed: new RegExp(/[1-6]/)
};

/**
 * Container for Fan Control parameters
 */
export class FanControlParams {
  public server: string;
  public debugEnabled = false;
  public shortId: EntityShortId;
  public speed: FanSpeed6Speed = 0;
  public service: FanControlInstruction.TurnOn | FanControlInstruction.TurnOff = FanControlInstruction.TurnOff;
  public bOn: boolean = false;
  public timeout: Milliseconds = 0;
  public retryDelay: Milliseconds[] = [1000, 3000];
  public shutoffEntityId: EntityId;

  constructor() {}

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

  setSpeed(speed: FanSpeed6Speed | undefined): this {
    if (isFanSpeed6Speed(speed)) {
      this.speed = speed;
      if (this.speed === 0) {
        return this.off();
      }
    }
    return this;
  }

  setPercentage(pct: number | undefined): this {
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
      this.setSpeed(asInt(inst));
    }
    return this;
  }

  setTimeout(val: NumberAsString | Integer | undefined, units: TimeUnit = TimeUnit.Milliseconds): this {
    if (isDefined(val)) {
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
    }
    return this;
  }

  on(val: boolean = true): this {
    this.service = val ? FanControlInstruction.TurnOn : FanControlInstruction.TurnOff;
    this.bOn = val;
    return this;
  }

  off(val: boolean = true): this {
    this.service = val ? FanControlInstruction.TurnOff : FanControlInstruction.TurnOn;
    this.bOn = val ? false : true;
    return this;
  }

  shouldTurnOff(): boolean {
    return this.bOn !== true || this.speed === 0;
  }
  shouldTurnOn(): boolean {
    return this.bOn === true || this.speed > 0;
  }

  shouldTimeout(): boolean {
    return this.shouldTurnOn() && this.timeout > 0;
  }
}
