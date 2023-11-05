import { FunctionNodeBase, NodeRedOpts } from 'epdoc-node-red-hautil';
import { EpochMilliseconds, Milliseconds, durationUtil } from 'epdoc-timeutil';
import { Dict, Integer, isArray, isDict, isInteger, isNonEmptyArray, isNonEmptyString } from 'epdoc-util';

const TIMEOUTS = [2500, 13000, 13000];

export type EntityShortId = string;
/**
 * IP Address or hostname
 */
export type HOST = string;

export type PingInputData = {
  timeout: Milliseconds;
  hosts: string | string[];
};
export type RoundIndex = Integer;
export type RoundsData = {
  timeout: Milliseconds;
  hosts: HOST[];
  responses: Integer;
};

export type PingConfig = {
  host: HOST;
  timeout: Milliseconds;
  start_date: EpochMilliseconds;
  id: EntityShortId;
  name: string;
  round: RoundIndex;
};

export type InputPayload = {
  debug?: boolean;
  name: string;
  id: EntityShortId;
  data: PingInputData[];
};

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

export type PingContextShort = {
  debug: boolean;
  id: EntityShortId;
  name: string;
  busy: boolean;
  busyAt: EpochMilliseconds;
  startDate: EpochMilliseconds;
  rounds: RoundsData[];
};
export type PingContextLong = {
  down: boolean;
  downAt?: EpochMilliseconds;
  lastAliveAt?: EpochMilliseconds;
  count: Integer;
};
// export type PingContextData = {
//   short: PingContextShort;
//   long: PingContextLong;
// };

export class PingContext extends FunctionNodeBase {
  private _FLOW: Dict = {
    short: 'short',
    long: 'long'
  };
  private _short: PingContextShort;
  private _long: PingContextLong;

  constructor(opts?: NodeRedOpts, payload?: InputPayload) {
    super(opts);
    if (payload) {
      this.initFromPayload(payload);
    } else {
      this.initFromStorage();
    }
  }

  get short() {
    return this._short;
  }
  get long() {
    return this._long;
  }

  initFromPayload(payload: InputPayload): void {
    const id = payload.id || this.env.get('AN_ID');
    const tNowMs = new Date().getTime();
    this._short = {
      debug: payload.debug || this.env.get('AN_DEBUG') ? true : false,
      id: id,
      name: payload.name || this.env.get('AN_NAME'),
      busy: true,
      busyAt: tNowMs,
      startDate: tNowMs, // The time when we entered this flow, NOT when we went down
      rounds: this._initRounds(payload.data || [this.env.get('AN_HOSTS0'), this.env.get('AN_HOSTS1')])
    };
    this._long = this.flow.get(this._FLOW.long, 'file') as PingContextLong;
    this._saveShort();
  }

  _initRounds(arr: PingInputData[]): RoundsData[] {
    const results: RoundsData[] = [];
    for (let idx = 0; idx < arr.length; ++idx) {
      const item: PingInputData = arr[idx];
      let result: HOST[] = [];
      let timeout: Milliseconds = 0;
      if (isArray(item)) {
        result = item;
      } else if (isNonEmptyString(item)) {
        result = this.commaList(item);
      } else if (isDict(item) && isArray(item.hosts)) {
        if (isInteger(item.timeout)) {
          timeout = item.timeout;
        }
        if (isArray(item.hosts)) {
          result = item.hosts;
        } else if (isNonEmptyString(item.hosts)) {
          result = this.commaList(item.hosts);
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
          const item: RoundsData = {
            hosts: filtered,
            timeout: timeout ? timeout : TIMEOUTS[idx],
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

  commaList(s: string): string[] {
    return s.split(',').map((item) => {
      return item.trim();
    });
  }

  initFromStorage(): void {
    (this._short = this.flow.get(this._FLOW.short) as PingContextShort),
      (this._long = this.flow.get(this._FLOW.long, 'file') as PingContextLong);
  }

  _saveShort() {
    this.flow.set(this._FLOW.short, this._short);
    return this;
  }

  getRound(round: RoundIndex): RoundsData {
    return this.short.rounds ? this.short.rounds[round] : ({} as RoundsData);
  }
  getHost(round: RoundIndex): HOST | HOST[] {
    return this.getRound(round).hosts;
  }
  get name(): string | undefined {
    return this.short.name;
  }
  get busy(): boolean {
    return this.short.busy === true;
  }
  setBusy(val: boolean = true) {
    this.short.busy = val;
    return this._saveShort();
  }
  clearBusy() {
    this.short.busy = false;
    return this._saveShort();
  }
  busyTimeout() {
    if (!this.short.busyAt) {
      return true;
    }
    const tNowMs = new Date().getTime();
    let totalTimeout = 0;
    this.short.rounds.forEach((round) => {
      totalTimeout += round.timeout;
    });
    if (tNowMs - this.short.busyAt > totalTimeout + 3000) {
      return true;
    }
    return false;
  }

  hasPingResponded(round: RoundIndex): boolean {
    const item = this.getRound(round);
    return item.responses > 0;
  }
  haveAllPingsResponded(round: RoundIndex): boolean {
    const item = this.getRound(round);
    return item.responses == item.hosts.length;
  }
  incPingHasResponded(round: RoundIndex): PingContext {
    let item = this.getRound(round);
    item.responses = item.responses + 1;
    return this._saveShort();
  }

  isFirstRound(round: RoundIndex): boolean {
    return round === 0;
  }
  isLastRound(round: RoundIndex): boolean {
    if (this.short.rounds) {
      return round >= this.short.rounds.length - 1;
    }
    return true;
  }

  get debug(): boolean {
    return this.short.debug === true;
  }

  get startDate(): EpochMilliseconds {
    return this.short.startDate;
  }
  setStartDate(val: EpochMilliseconds) {
    this.short.startDate = val;
    return this._saveShort();
  }
  isUp(): boolean {
    return this.isDown() ? false : true;
  }
  isDown(): boolean {
    return this.long.down == true;
  }
  downAt(): EpochMilliseconds {
    return this.long.downAt || 0;
  }
  lastAliveAt(): EpochMilliseconds {
    return this.long.lastAliveAt ? this.long.lastAliveAt : 0;
  }
  setUp(tMs: EpochMilliseconds): PingContext {
    this._long = {
      down: false,
      count: 1 // XXXX
    };
    if (tMs) {
      this.long.lastAliveAt = tMs;
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
    return this.long.count;
  }

  _saveLong() {
    this.flow.set(this._FLOW.long, this._long, 'file');
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
  //     return this.pingPayload(this.short.ipPrimary, timeout)
  // }
  // pingSecondaryPayload(timeout) {
  //     return this.pingPayload(this.short.ipSecondary, timeout)
  // }

  _getPingPayloadItem(host: HOST, timeout: Milliseconds, tStartMs: EpochMilliseconds, round: RoundIndex): PingConfig {
    return {
      host: host,
      timeout: timeout,
      start_date: tStartMs,
      id: this.short.id,
      name: this.short.name,
      round: round
    };
  }

  getPingPayload(round: RoundIndex): PingConfig[] {
    const item = this.getRound(round);
    const tStartMs = new Date().getTime();
    let result: PingConfig[] = [];
    item.hosts.forEach((host) => {
      result.push(this._getPingPayloadItem(host, item.timeout, tStartMs, round));
    });
    return result;
  }

  /**
   * Set tEndMs if the connection has been restablished at this time
   */
  getReportPayload(tEndMs: EpochMilliseconds, ping: PingConfig) {
    let result: PingReport = {
      id: this.short.id,
      name: this.short.name,
      down_count: this.long.count
    };
    if ((this.isDown() && ping && ping.round === 0) || tEndMs) {
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

const lib = {
  newFlowContext: (opts: NodeRedOpts) => {
    return new PingContext(opts);
  },
  newFromStorage: (opts: NodeRedOpts) => {
    return new PingContext(opts).initFromStorage();
  }
};
// flow.set('lib', lib);

// return msg;
