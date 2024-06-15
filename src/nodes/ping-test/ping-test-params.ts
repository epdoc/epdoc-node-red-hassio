import { isArray, isNonEmptyString, pick } from '@epdoc/typeutil';

const REG = {
  onoff: new RegExp(/^(on|off)$/, 'i'),
  on: new RegExp(/on$/, 'i'),
  off: new RegExp(/off$/, 'i'),
  speed: new RegExp(/speed_[1-6]/)
};

/**
 * Container for Fan Control parameters
 */
export class PingTestParams {
  private _isPingTestParams = true;
  public debugEnabled = false;
  public hosts: string[];
  public friendlyName: string;
  public outputId: string;

  constructor(params?: PingTestParams) {
    if (PingTestParams.isInstance(params)) {
      this.debugEnabled = params.debugEnabled;
      this.hosts = params.hosts;
      this.friendlyName = params.friendlyName;
      this.outputId = params.outputId;
    }
  }

  static isInstance(val: any): val is PingTestParams {
    return val && val._isPingTestParams === true;
  }

  setDebug(val: any): this {
    if (val === true) {
      this.debugEnabled = true;
    } else if (val === false) {
      this.debugEnabled = false;
    }
    return this;
  }

  setHosts(hosts: string | string[]): this {
    if (isNonEmptyString(hosts)) {
      this.hosts = [hosts];
    } else if (isArray(hosts)) {
      this.hosts = hosts;
    }
    return this;
  }

  setFriendlyName(val: string): this {
    if (isNonEmptyString(val)) {
      this.friendlyName = val;
    }
    return this;
  }

  setOutputId(outputId: string): this {
    if (isNonEmptyString(outputId)) {
      this.outputId = outputId;
    }
    return this;
  }

  toString() {
    let s = `Ping ${JSON.stringify(this.hosts)}`;
    return s;
  }

  toData() {
    return pick(this, 'friendlyName', 'hosts', 'outputId', 'debugEnabled');
  }
}
