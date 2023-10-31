const TIMEOUTS = [2500, 13000, 13000];

export class FlowContext {
  private _FLOW = {
    short: 'short',
    long: 'long',
  };
  private _ctx = {
    short: {},
    long: {},
  };

  constructor() {
    this._ctx = { short: {}, long: {} };
  }

  initFromPayload(payload: Dict) {
    const id = payload.id || env.get('AN_ID');
    const tNowMs = new Date().getTime();
    this._ctx = {
      short: {
        debug: payload.debug || env.get('AN_DEBUG') ? true : false,
        id: id,
        name: payload.name || env.get('AN_NAME'),
        busy: true,
        busyAt: tNowMs,
        startDate: tNowMs, // The time when we entered this flow, NOT when we went down
        pingHasResponded: [false, false],
        rounds: this._initRounds(payload.data || [env.get('AN_HOSTS0'), env.get('AN_HOSTS1')]),
      },
      long: flow.get(this._FLOW.long, 'file'),
    };
    if (u.isNonEmptyArray(payload.timeout) && payload.timeout.length === 2) {
      this._ctx.short.timeout = payload.timeout;
    }
    return this._saveShort();
  }

  _initRounds(arr) {
    const results = [];
    for (let idx = 0; idx < arr.length; ++idx) {
      const item = arr[idx];
      let result;
      let timeout;
      if (u.isArray(item)) {
        result = item;
      } else if (u.isNonEmptyString(item)) {
        result = this.commaList(item);
      } else if (u.isDict(item) && u.isArray(item.hosts)) {
        if (u.isInteger(item.timeout)) {
          timeout = item.timeout;
        }
        if (u.isArray(item.hosts)) {
          result = item.hosts;
        } else if (u.isNonEmptyString(item.hosts)) {
          result = this.commaList(item.hosts);
        }
      }
      if (u.isNonEmptyArray(result)) {
        let filtered = [];
        result.forEach((r) => {
          if (u.isNonEmptyString(r)) {
            filtered.push(r);
          }
        });
        if (filtered.length) {
          const item = {
            hosts: filtered,
            timeout: timeout ? timeout : TIMEOUTS[idx],
            responses: 0,
          };
          results.push(item);
        }
      } else {
        node.error('IP Addresses or hostnames not configured correctly');
      }
    }
    if (results.length < 2) {
      node.error('IP Addresses or hostnames not configured correctly');
    }
    return results;
  }

  commaList(s) {
    return s.split(',').map((item) => {
      return item.trim();
    });
  }

  initFromStorage() {
    this._ctx = {
      short: flow.get(this._FLOW.short),
      long: flow.get(this._FLOW.long, 'file'),
    };
    return this;
  }

  _saveShort() {
    flow.set(this._FLOW.short, this._ctx.short);
    return this;
  }

  getRound(round) {
    return this._ctx.short.rounds[round];
  }
  getHost(round) {
    return this.getRound(round).hosts;
  }
  get name() {
    return this._ctx.short && this._ctx.short.name;
  }
  get busy() {
    return this._ctx.short && this._ctx.short.busy === true;
  }
  setBusy(val) {
    this._ctx.short.busy = val;
    return this._saveShort();
  }
  clearBusy() {
    this._ctx.short.busy = false;
    return this._saveShort();
  }
  busyTimeout() {
    if (!this._ctx.short.busyAt) {
      return true;
    }
    const tNowMs = new Date().getTime();
    if (
      tNowMs - this._ctx.short.busyAt >
      this._ctx.short.timeout[0] + this._ctx.short.timeout[1] + 1000
    ) {
      return true;
    }
    return false;
  }

  getPingHasResponded(round) {
    const item = this.getRound(round);
    return item.responses > 0;
  }
  getPingAllResponded(round) {
    const item = this.getRound(round);
    return item.responses == item.hosts.length;
  }
  incPingHasResponded(round) {
    let item = this.getRound(round);
    item.responses = item.responses + 1;
    return this._saveShort();
  }

  firstRound(round) {
    return round === 0;
  }
  finalRound(round) {
    return round >= this._ctx.short.hosts.length - 1;
  }

  get debug() {
    return this._ctx.short && this._ctx.short.debug === true;
  }

  get startDate() {
    return this._ctx.short && this._ctx.short.startDate;
  }
  setStartDate(val) {
    this._ctx.short.startDate = val;
    return this._saveShort();
  }
  isUp() {
    return this.isDown() ? false : true;
  }
  isDown() {
    return this._ctx && this._ctx.long && this._ctx.long.down == true;
  }
  downAt() {
    return this._ctx && this._ctx.long && this._ctx.long.downAt;
  }
  lastAliveAt() {
    return this._ctx && this._ctx.long && this._ctx.long.lastAliveAt;
  }
  setUp(tMs) {
    this._ctx.long = {
      down: false,
    };
    if (tMs) {
      this._ctx.long.lastAliveAt = tMs;
    }
    return this._saveLong();
  }

  setDownAt(downAtMs) {
    let tMs = downAtMs ? downAtMs : new Date().getTime();
    this._ctx.long = {
      down: true,
      downAt: tMs,
      count: 1,
    };
    return this._saveLong();
  }

  /**
   * This counts how many times this flow has been run before we get a response
   */
  incrementDownCounter() {
    this._ctx.long.count = this._ctx.long.count + 1;
    return this._saveLong();
  }
  get count() {
    return this._ctx.long.count;
  }

  _saveLong() {
    flow.set(this._FLOW.long, this._ctx.long, 'file');
    return this;
  }

  durationString(tMs) {
    return ut.durationUtil(tMs, {}).format();
  }

  connectionStatusAsString() {
    let s = 'connection is ';
    if (this.isUp()) {
      s += 'up';
    } else {
      const tNowMs = new Date().getTime();
      const tDiff = ut.durationUtil(tNowMs - this.downAt(), {}).format();
      s += 'down for ' + tDiff;
    }
    return s;
  }

  // pingPrimaryPayload(timeout) {
  //     return this.pingPayload(this._ctx.short.ipPrimary, timeout)
  // }
  // pingSecondaryPayload(timeout) {
  //     return this.pingPayload(this._ctx.short.ipSecondary, timeout)
  // }

  _pingPayloadItem(host, timeout, tStartMs, round) {
    return {
      host: host,
      timeout: timeout,
      start_date: tStartMs,
      id: this._ctx.short.id,
      name: this._ctx.short.name,
      round: round,
    };
  }

  pingPayload(round) {
    const item = this.getRound(round);
    const tStartMs = new Date().getTime();
    let result = [];
    item.hosts.forEach((host) => {
      result.push(this._pingPayloadItem(host, item.timeout, tStartMs, round));
    });
    return result;
  }

  /**
   * Set tEndMs if the connection has been restablished at this time
   */
  getReportPayload(tEndMs, ping) {
    let result = {
      id: this._ctx.short.id,
      name: this._ctx.short.name,
      down_count: this._ctx.long.count,
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
  newFlowContext: () => {
    return new FlowContext();
  },
  newFromStorage: () => {
    return new FlowContext().initFromStorage();
  },
};
flow.set('lib', lib);

return msg;
