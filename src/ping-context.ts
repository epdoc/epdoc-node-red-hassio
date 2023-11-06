import { FunctionNodeBase, NodeRedOpts } from 'epdoc-node-red-hautil';
import { EpochMilliseconds, Milliseconds, durationUtil } from 'epdoc-timeutil';
import {
  Integer,
  isArray,
  isBoolean,
  isDict,
  isInteger,
  isNonEmptyArray,
  isNonEmptyString,
  isString
} from 'epdoc-util';

const TIMEOUTS = [2500, 13000, 13000];
const SHORT = 'short';
const LONG = 'long';

export type EntityShortId = string;
/**
 * IP Address or hostname
 */
export type HOST = string;

export type PingFlowInputLoopPayload = {
  timeout: Milliseconds;
  hosts: string | string[];
};
function isPingFlowInputLoopPayload(val: any): val is PingFlowInputLoopPayload {
  return isDict(val) && isInteger(val.timeout) && (isNonEmptyString(val.hosts) || isNonEmptyArray(val.hosts));
}

/**
 * The flow can loop over multiple calls to `node-red-node-ping`. This is the
 * count of which loop we are on. Each call to the `node-red-node-ping` node can
 * include more than one HOST to ping, and the number of these pings that have
 * responded is tracked in the responses field.
 */
export type PingLoopIndex = Integer;
/**
 * Data for a loop.
 */
export type PingLoopData = {
  timeout: Milliseconds;
  hosts: HOST[];
  /**
   * Tracks how many
   */
  responses: Integer;
};

/**
 * Input message to `node-red-node-ping` node is an array of these items.
 */
export type PingNodeInputItem = {
  host: HOST;
  timeout: Milliseconds;
  start_date: EpochMilliseconds;
  id: EntityShortId;
  name: string;
  loopIndex: PingLoopIndex;
};
export function isPingNodeInputItem(val: any): val is PingNodeInputItem {
  return isDict(val) && isString(val.host) && isInteger(val.timeout);
}

/**
 * The input msg.payload to the flow. Each entry in data will be converted to a
 * `PingNodeInputItem`.
 */
export type PingFlowInputPayload = {
  debug?: boolean;
  name: string;
  id: EntityShortId;
  data?: PingFlowInputLoopPayload[];
  // If true then do a memory reset and exit
  reset?: boolean;
};

export function isPingFlowInputPayload(val: any): val is PingFlowInputLoopPayload {
  if (isDict(val) && isNonEmptyString(val.name) && isNonEmptyString(val.id) && isNonEmptyArray(val.data)) {
    for (let idx = 0; idx < val.data.length; ++idx) {
      if (!isPingFlowInputLoopPayload(val.data[idx])) {
        return false;
      }
    }
    return true;
  }
  return false;
}

/**
 * The output msg.payload from the flow
 */
export type PingReport = {
  id: EntityShortId;
  name: string;
  down_count?: Integer;
  start_date?: EpochMilliseconds;
  last_alive_at?: EpochMilliseconds;
  end_date?: EpochMilliseconds;
  down_time?: Milliseconds;
  friendly_down_time?: string;
  max_down_time?: Milliseconds;
  friendly_max_down_time?: string;
  host?: HOST;
  // If true then we did a memory reset operation and that is all
  reset?: boolean;
};

/**
 * Internal Context used during one call to the flow.
 */
export type PingContextShort = {
  debug: boolean;
  id: EntityShortId;
  name: string;
  busy: boolean;
  busyAt: EpochMilliseconds;
  startDate: EpochMilliseconds;
  loopsData: PingLoopData[];
  reset?: boolean;
};
function isPingContextShort(val: any): val is PingContextShort {
  return (
    isDict(val) &&
    isBoolean(val.busy) &&
    isString(val.id) &&
    isString(val.name) &&
    isInteger(val.busyAt) &&
    isInteger(val.startDate) &&
    isArray(val.loopsData)
  );
}
/**
 * Internal Context that lives across flows.
 */
export type PingContextLong = {
  down: boolean;
  downAt?: EpochMilliseconds;
  lastAliveAt?: EpochMilliseconds;
  count: Integer;
};
function isPingContextLong(val: any): val is PingContextLong {
  return (
    isDict(val) && isBoolean(val.down) && isInteger(val.downAt) && isInteger(val.lastAliveAt) && isInteger(val.count)
  );
}

export function newPingContext(opts: NodeRedOpts, payload?: PingFlowInputPayload): PingContext {
  return new PingContext(opts, payload);
}

/**
 * A context and logic to use across all Function Nodes in a network
 * connectivity test flow. The context is initialized using the flow's input
 * payload, then saved using flow context. Thereafter the context is restored
 * from the flow's context.
 */
export class PingContext extends FunctionNodeBase {
  private _short: PingContextShort;
  private _long: PingContextLong;

  constructor(opts?: NodeRedOpts, payload?: PingFlowInputPayload) {
    super(opts);
    const tNowMs = new Date().getTime();
    this._long = this.flow.get(LONG, 'file') as PingContextLong;
    if (!isPingContextLong(this._long)) {
      this._long = { down: false, downAt: 0, lastAliveAt: 0, count: 0 };
    }
    this._short = this.flow.get(SHORT);
    if (!isPingContextShort(this._short)) {
      this._short = {
        debug: this.env.get('AN_DEBUG') === true,
        id: this.env.get('AN_ID'),
        name: this.env.get('AN_NAME'),
        busy: false,
        busyAt: tNowMs,
        startDate: tNowMs,
        loopsData: this.initLoopsDataFromEnv(),
        reset: false
      };
    }
    this.initFromPayload(payload);
  }

  private initFromPayload(payload?: PingFlowInputPayload): this {
    if (isPingFlowInputPayload(payload)) {
      const tNowMs = new Date().getTime();
      this._short.busy = true;
      this._short.busyAt = tNowMs;
      this._short.startDate = tNowMs;
      if (payload.reset === true) {
        this._short.reset = true;
      }
      if (isNonEmptyString(payload.id)) {
        this._short.id = payload.id;
      }
      if (isNonEmptyString(payload.name)) {
        this._short.name = payload.name;
      }
      if (isNonEmptyArray(payload.data)) {
        this._short.loopsData = this.initLoopsDataFromPayload(payload.data);
      }
      const id: EntityShortId = payload.id ? payload.id : this._short.id;
      this.saveShort();
    }
    return this;
  }

  get short(): PingContextShort {
    return this._short;
  }
  get long(): PingContextLong {
    return this._long;
  }

  private initLoopsDataFromPayload(arr: PingFlowInputLoopPayload[]): PingLoopData[] {
    const results: PingLoopData[] = [];
    if (isNonEmptyArray(arr)) {
      for (let idx = 0; idx < arr.length; ++idx) {
        const item: PingFlowInputLoopPayload = arr[idx];
        if (isPingFlowInputLoopPayload(arr[idx])) {
          const item: PingFlowInputLoopPayload = arr[idx];
          const timeout: Milliseconds = item.timeout ? item.timeout : TIMEOUTS[Math.min(idx, TIMEOUTS.length - 1)];
          const loopItem: PingLoopData | undefined = this.initLoopData(item.hosts, timeout);
          if (loopItem) {
            results.push(loopItem);
          }
        }
      }
    }
    if (results.length < 2) {
      this.node.error('IP Addresses or hostnames not configured correctly');
    }
    return results;
  }

  private initLoopsDataFromEnv(): PingLoopData[] {
    const results: PingLoopData[] = [];
    const loopItem0: PingLoopData | undefined = this.initLoopData(this.env.get('AN_HOSTS0'), TIMEOUTS[0]);
    if (loopItem0) {
      results.push(loopItem0);
    }
    const loopItem1: PingLoopData | undefined = this.initLoopData(this.env.get('AN_HOSTS1'), TIMEOUTS[1]);
    if (loopItem1) {
      results.push(loopItem1);
    }
    return results;
  }

  private initLoopData(hosts: string | string[], timeout: Milliseconds): PingLoopData | undefined {
    if (!isNonEmptyArray(hosts) && isNonEmptyString(hosts)) {
      hosts = this.commaList(hosts);
    }
    if (isNonEmptyArray(hosts)) {
      let filtered: HOST[] = [];
      hosts.forEach((host) => {
        if (isNonEmptyString(host)) {
          filtered.push(host);
        }
      });
      if (filtered.length) {
        const item: PingLoopData = {
          hosts: filtered,
          timeout: timeout,
          responses: 0
        };
        return item;
      }
    } else {
      this.node.error('IP Addresses or hostnames not configured correctly');
    }
  }

  private commaList(s: string): string[] {
    return s.split(',').map((item) => {
      return item.trim();
    });
  }

  // initFromStorage(): this {
  //   this._short = this.flow.get(SHORT) as PingContextShort,
  //     this._long = this.flow.get(LONG, 'file') as PingContextLong
  //     return this;
  // }

  private saveShort(): this {
    this.flow.set(SHORT, this._short);
    return this;
  }

  clearMemory(): this {
    this.flow.set(SHORT, undefined);
    this.flow.set(LONG, undefined);
    return this;
  }

  get reset(): boolean {
    return this._short.reset === true;
  }
  get name(): string {
    return this._short.name;
  }

  get busy(): boolean {
    return this._short.busy === true;
  }

  setBusy(val: boolean = true) {
    this._short.busy = val;
    return this.saveShort();
  }

  clearBusy() {
    this._short.busy = false;
    return this.saveShort();
  }

  getLoopData(index: PingLoopIndex): PingLoopData {
    return this._short.loopsData ? this._short.loopsData[index] : ({} as PingLoopData);
  }

  getHosts(index: PingLoopIndex): HOST | HOST[] {
    return this.getLoopData(index).hosts;
  }

  busyTimeout() {
    if (!this._short.busyAt) {
      return true;
    }
    const tNowMs = new Date().getTime();
    let totalTimeout = 0;
    this._short.loopsData.forEach((loopItem) => {
      totalTimeout += loopItem.timeout;
    });
    if (tNowMs - this._short.busyAt > totalTimeout + 3000) {
      return true;
    }
    return false;
  }

  getPingHasResponded(loop: PingLoopIndex): boolean {
    const item = this.getLoopData(loop);
    return item.responses > 0;
  }
  getPingAllResponded(loop: PingLoopIndex): boolean {
    const item = this.getLoopData(loop);
    return item.responses == item.hosts.length;
  }
  incPingHasResponded(loop: PingLoopIndex): PingContext {
    let item = this.getLoopData(loop);
    item.responses = item.responses + 1;
    return this.saveShort();
  }

  isFirstRound(loop: PingLoopIndex): boolean {
    return loop === 0;
  }
  isLastRound(loop: PingLoopIndex): boolean {
    if (this._short.loopsData) {
      return loop >= this._short.loopsData.length - 1;
    }
    return true;
  }

  get debug(): boolean {
    return this._short.debug === true;
  }

  get startDate(): EpochMilliseconds {
    return this._short.startDate;
  }
  setStartDate(val: EpochMilliseconds) {
    this._short.startDate = val;
    return this.saveShort();
  }
  isUp(): boolean {
    return this.isDown() ? false : true;
  }
  isDown(): boolean {
    return this._long.down == true;
  }
  downAt(): EpochMilliseconds {
    return this._long.downAt || 0;
  }
  lastAliveAt(): EpochMilliseconds {
    return this._long.lastAliveAt ? this._long.lastAliveAt : 0;
  }
  setUp(tMs: EpochMilliseconds): PingContext {
    this._long = {
      down: false,
      count: 1 // XXXX
    };
    if (tMs) {
      this._long.lastAliveAt = tMs;
    }
    return this.saveLong();
  }

  setDownAt(downAtMs: EpochMilliseconds) {
    let tMs = downAtMs ? downAtMs : new Date().getTime();
    this._long = {
      down: true,
      downAt: tMs,
      count: 1
    };
    return this.saveLong();
  }

  /**
   * This counts how many times this flow has been run before we get a response
   */
  incrementDownCounter() {
    this._long.count = this._long.count + 1;
    return this.saveLong();
  }
  get count() {
    return this._long.count;
  }

  private saveLong() {
    this.flow.set(LONG, this._long, 'file');
    return this;
  }

  private pingPayloadItem(
    host: HOST,
    timeout: Milliseconds,
    tStartMs: EpochMilliseconds,
    loopIndex: PingLoopIndex
  ): PingNodeInputItem {
    return {
      host: host,
      timeout: timeout,
      start_date: tStartMs,
      id: this._short.id,
      name: this._short.name,
      loopIndex: loopIndex
    };
  }

  getPingNodeInputPayload(loop: PingLoopIndex): PingNodeInputItem[] {
    const item = this.getLoopData(loop);
    const tStartMs = new Date().getTime();
    let result: PingNodeInputItem[] = [];
    item.hosts.forEach((host) => {
      result.push(this.pingPayloadItem(host, item.timeout, tStartMs, loop));
    });
    return result;
  }

  /**
   * Set tEndMs if the connection has been restablished at this time
   */
  getReportPayload(tEndMs: EpochMilliseconds, ping: PingNodeInputItem): PingReport {
    let result: PingReport = {
      id: this._short.id,
      name: this._short.name,
      down_count: this._long.count
    };
    if (this._short.reset) {
      result.reset = true;
    } else {
      if ((this.isDown() && ping && ping.loopIndex === 0) || tEndMs) {
        result.start_date = this.downAt();
        if (this.lastAliveAt()) {
          result.last_alive_at = this.lastAliveAt();
        }
      }
      if (tEndMs) {
        result.end_date = tEndMs;
        result.down_time = tEndMs - this.downAt();
        result.friendly_down_time = this.durationString(result.down_time);
        delete result.down_count;
        if (ping) {
          result.host = ping.host;
        }
        if (this.lastAliveAt()) {
          result.last_alive_at = this.lastAliveAt();
          result.max_down_time = tEndMs - this.lastAliveAt();
          result.friendly_max_down_time = this.durationString(result.max_down_time);
        }
      }
    }
    return result;
  }

  durationString(tMs: EpochMilliseconds) {
    return durationUtil(tMs, { ms: 1 }).format();
  }

  connectionStatusAsString() {
    let s = 'connection is ';
    if (this.isUp()) {
      s += 'up';
    } else {
      const tNowMs = new Date().getTime();
      const tDiff = durationUtil(tNowMs - this.downAt(), {}).format();
      s += 'down for ' + tDiff;
    }
    return s;
  }

  toString(): string {
    return '{ "short": ' + JSON.stringify(this._short) + ', "long": ' + JSON.stringify(this._long) + ' }';
  }
}
