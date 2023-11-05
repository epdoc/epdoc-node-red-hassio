import { FunctionNodeBase, NodeRedOpts } from 'epdoc-node-red-hautil';
import { EpochMilliseconds, Milliseconds, durationUtil } from 'epdoc-timeutil';
import {
  Dict,
  Integer,
  isArray,
  isDict,
  isInteger,
  isNonEmptyArray,
  isNonEmptyString,
  isString,
  isTrue
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
  data: PingFlowInputLoopPayload[];
};

export function isPingFlowInputPayload(val: any): val is PingFlowInputLoopPayload {
  return isDict(val) && isNonEmptyString(val.name) && isNonEmptyString(val.id) && isNonEmptyArray(val.data);
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
};
/**
 * Internal Context that lives across flows.
 */
export type PingContextLong = {
  down: boolean;
  downAt?: EpochMilliseconds;
  lastAliveAt?: EpochMilliseconds;
  count: Integer;
};
export type PingContextData = {
  short: PingContextShort;
  long: PingContextLong;
};

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
  private _FLOW: Dict = {
    short: 'short',
    long: 'long'
  };
  private _short: PingContextShort;
  private _long: PingContextLong;

  constructor(opts?: NodeRedOpts, payload?: PingFlowInputPayload) {
    super(opts);
    this._long = this.flow.get(LONG, 'file') as PingContextLong;

    if (isPingFlowInputPayload(payload)) {
      const id: EntityShortId = payload.id ? payload.id : this.env.get('AN_ID');
      const tNowMs = new Date().getTime();
      this._short = {
        debug: payload.debug == true || isTrue(this.env.get('AN_DEBUG')),
        id: id,
        name: isNonEmptyString(payload.name) ? payload.name : this.env.get('AN_NAME'),
        busy: true,
        busyAt: tNowMs,
        startDate: tNowMs, // The time when we entered this flow, NOT when we went down
        loopsData: this._initLoopsData(payload.data || [this.env.get('AN_HOSTS0'), this.env.get('AN_HOSTS1')])
      };
      this._saveShort();
    } else {
      this._short = this.flow.get(SHORT) as PingContextShort;
    }
  }

  get short() {
    return this._short;
  }
  get long() {
    return this._long;
  }

  _initLoopsData(arr: PingFlowInputLoopPayload[]): PingLoopData[] {
    const results: PingLoopData[] = [];
    for (let idx = 0; idx < arr.length; ++idx) {
      const item: PingFlowInputLoopPayload = arr[idx];
      let result: HOST[] = [];
      let timeout: Milliseconds = 0;
      if (isArray(item)) {
        result = item;
      } else if (isNonEmptyString(item)) {
        result = this._commaList(item);
      } else if (isDict(item) && isArray(item.hosts)) {
        if (isInteger(item.timeout)) {
          timeout = item.timeout;
        }
        if (isArray(item.hosts)) {
          result = item.hosts;
        } else if (isNonEmptyString(item.hosts)) {
          result = this._commaList(item.hosts);
        }
      }
      if (isNonEmptyArray(result)) {
        let filtered: HOST[] = [];
        result.forEach((r) => {
          if (isNonEmptyString(r)) {
            filtered.push(r);
          }
        });
        if (filtered.length) {
          const item: PingLoopData = {
            hosts: filtered,
            timeout: timeout ? timeout : TIMEOUTS[Math.min(idx, TIMEOUTS.length - 1)],
            responses: 0
          };
          results.push(item);
        }
      } else {
        this.node.error('IP Addresses or hostnames not configured correctly');
      }
    }
    if (results.length < 2) {
      this.node.error('IP Addresses or hostnames not configured correctly');
    }
    return results;
  }

  _commaList(s: string): string[] {
    return s.split(',').map((item) => {
      return item.trim();
    });
  }

  // initFromStorage(): this {
  //   this._short = this.flow.get(SHORT) as PingContextShort,
  //     this._long = this.flow.get(LONG, 'file') as PingContextLong
  //     return this;
  // }

  _saveShort() {
    this.flow.set(SHORT, this._short);
    return this;
  }

  get name(): string {
    return this._short.name;
  }

  get busy(): boolean {
    return this._short.busy === true;
  }

  setBusy(val: boolean = true) {
    this._short.busy = val;
    return this._saveShort();
  }

  clearBusy() {
    this._short.busy = false;
    return this._saveShort();
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
    return this._saveShort();
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
    return this._saveShort();
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
    return this._saveLong();
  }

  setDownAt(downAtMs: EpochMilliseconds) {
    let tMs = downAtMs ? downAtMs : new Date().getTime();
    this._long = {
      down: true,
      downAt: tMs,
      count: 1
    };
    return this._saveLong();
  }

  /**
   * This counts how many times this flow has been run before we get a response
   */
  incrementDownCounter() {
    this._long.count = this._long.count + 1;
    return this._saveLong();
  }
  get count() {
    return this._long.count;
  }

  _saveLong() {
    this.flow.set(LONG, this._long, 'file');
    return this;
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

  // pingPrimaryPayload(timeout) {
  //     return this.pingPayload(this._short.ipPrimary, timeout)
  // }
  // pingSecondaryPayload(timeout) {
  //     return this.pingPayload(this._short.ipSecondary, timeout)
  // }

  _pingPayloadItem(
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
      result.push(this._pingPayloadItem(host, item.timeout, tStartMs, loop));
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
    return result;
  }
}

// flow.set('lib', lib);

// return msg;
