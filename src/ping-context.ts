import { FunctionNodeBase, NodeRedOpts } from 'epdoc-node-red-hautil';
import { DateUtil, EpochMilliseconds, Milliseconds, durationUtil, isEpochMilliseconds } from 'epdoc-timeutil';
import {
  Dict,
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

export type ReportParams = {
  reset?: boolean;
  busy?: boolean;
  timeout?: true;
  endAt?: EpochMilliseconds;
  ping: PingNodeInputItem;
};

export type PingReportTimes = {
  down_start_at?: EpochMilliseconds | string;
  last_alive_at?: EpochMilliseconds | string;
  down_end_at?: EpochMilliseconds | string;
  down_time?: Milliseconds | string;
  max_down_time?: Milliseconds | string;
};

/**
 * The output msg.payload from the flow
 */
export type PingReport = {
  id: EntityShortId;
  name: string;
  down_flow_count?: Integer;
  machine?: PingReportTimes;
  user?: PingReportTimes;
  loop_index?: Integer;
  host?: HOST;
  // If true then we did a memory reset operation and that is all
  reset?: boolean;
  // If true there was a previous flow still running, so we bailed
  busy?: boolean;
  // If true then this flow had a ping timeout
  timeout?: boolean;
  // If set then an error distrupted flow
  error?: string;
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
  error?: string;
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
  // @ts-ignore
  private _short: PingContextShort;
  // @ts-ignore
  private _long: PingContextLong;
  private _errors: Dict = {};

  constructor(opts?: NodeRedOpts, payload?: PingFlowInputPayload) {
    super(opts);
    const tNowMs = new Date().getTime();

    this.initLongWithDefaults().initLongFromStorage();

    this.initShortWithDefaults();
    if (payload) {
      this.fixShortFromEnv(tNowMs).overwriteShortFromPayload(payload).saveShort().validateLoopsData();
    } else {
      this.initShortFromStorage().fixShortFromEnv().validateLoopsData();
    }
  }

  private validateLoopsData(): this {
    if (this._short.loopsData.length < 1) {
      this.node.error('Input IP Addresses or hostnames not configured correctly');
    }
    return this;
  }

  private initLongWithDefaults(): this {
    this._long = {
      down: false,
      downAt: 0,
      lastAliveAt: 0,
      count: 0
    };
    return this;
  }

  private initLongFromStorage(): this {
    const long: PingContextLong = this.flow.get(LONG, 'file');
    if (isPingContextShort(long)) {
      this._long = long;
    } else if (isDict(long)) {
      if (isBoolean(long.down)) {
        this._long.down = long.down;
      }
      if (isEpochMilliseconds(long.downAt)) {
        this._long.downAt = long.downAt;
      }
      if (isEpochMilliseconds(long.lastAliveAt)) {
        this._long.lastAliveAt = long.lastAliveAt;
      }
      if (isInteger(long.count)) {
        this._long.count = long.count;
      }
    }
    return this;
  }

  private initShortWithDefaults(): this {
    this._short = {
      debug: false,
      id: '',
      name: '',
      busy: false,
      busyAt: 0,
      startDate: 0,
      loopsData: [],
      reset: false
    };
    return this;
  }

  private initShortFromStorage(): this {
    const short: PingContextShort = this.flow.get(SHORT);
    if (isPingContextShort(short)) {
      this._short = short;
    }
    return this;
  }

  /**
   * Correct any short values that were returned with bad data from storage.
   * @returns
   */
  private fixShortFromEnv(tNowMs?: Milliseconds): this {
    const envDict = {
      name: this.env.get('AN_NAME'),
      id: this.env.get('AN_ID'),
      debug: this.env.get('AN_DEBUG')
    };
    if (envDict.debug === true) {
      this._short.debug = true;
    }
    if (!isNonEmptyString(this._short.id) && isNonEmptyString(envDict.id)) {
      this._short.id = envDict.id;
    }
    if (!isNonEmptyString(this._short.name) && isNonEmptyString(envDict.name)) {
      this._short.name = envDict.name;
    }
    if (!isNonEmptyArray(this._short.loopsData)) {
      this._short.loopsData = this.initLoopsDataFromEnv();
    }
    if (tNowMs) {
      this._short.startDate = tNowMs;
      this._short.busyAt = tNowMs;
    }
    return this;
  }

  private overwriteShortFromPayload(payload: PingFlowInputPayload): this {
    this._short.busy = true;
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
    }
  }

  private commaList(s: string): string[] {
    return s.split(',').map((item) => {
      return item.trim();
    });
  }

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
  set reset(val: boolean) {
    this._short.reset = true;
    this.saveShort();
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

  getHosts(index: PingLoopIndex): HOST | HOST[] | undefined {
    const loopData = this.getLoopData(index);
    return loopData ? loopData.hosts : undefined;
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
    return this._long.down === true;
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
      count: 0
    };
    if (tMs) {
      this._long.lastAliveAt = tMs;
    }
    return this.saveLong();
  }

  setDownAt(downAtMs: EpochMilliseconds) {
    let tMs = downAtMs ? downAtMs : new Date().getTime();
    const lastAliveAt = this._long.lastAliveAt ? this._long.lastAliveAt : 0;
    this._long = {
      down: true,
      downAt: tMs,
      count: 1,
      lastAliveAt: lastAliveAt
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
  // getReportPayload(tEndMs: EpochMilliseconds, ping: PingNodeInputItem): PingReport {
  getReportPayload(params: ReportParams): PingReport {
    let result: PingReport = {
      id: this._short.id,
      name: this._short.name
    };
    if (this._short.reset || params.reset) {
      result.reset = true;
    } else if (params.busy) {
      result.busy = true;
    } else {
      result.machine = {};
      result.user = {};
      result.down_flow_count = this._long.count;
      if (params.timeout) {
        result.timeout = true;
      }
      if (this.lastAliveAt()) {
        result.machine.last_alive_at = this.lastAliveAt();
        result.user.last_alive_at = new DateUtil(result.machine.last_alive_at).toISOLocaleString();
      }
      if ((this.isDown() && params.ping && params.ping.loopIndex === 0) || params.endAt || params.timeout) {
        result.machine.down_start_at = this.downAt();
        result.user.down_start_at = new DateUtil(result.machine.down_start_at).toISOLocaleString();
      }
      if (params.endAt) {
        result.machine.down_end_at = params.endAt;
        result.user.down_end_at = new DateUtil(result.machine.down_end_at).toISOLocaleString();
        result.machine.down_time = params.endAt - this.downAt();
        result.user.down_time = this.durationString(result.machine.down_time);
        delete result.down_flow_count;
        if (params.ping) {
          result.host = params.ping.host;
          result.loop_index = params.ping.loopIndex;
        }
        if (this.lastAliveAt()) {
          result.machine.max_down_time = params.endAt - this.lastAliveAt();
          result.user.max_down_time = this.durationString(result.machine.max_down_time);
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
