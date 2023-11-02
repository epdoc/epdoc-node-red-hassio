"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PingContext = void 0;
const epdoc_node_red_hautil_1 = require("epdoc-node-red-hautil");
const epdoc_timeutil_1 = require("epdoc-timeutil");
const epdoc_util_1 = require("epdoc-util");
const TIMEOUTS = [2500, 13000, 13000];
// export type PingContextData = {
//   short: PingContextShort;
//   long: PingContextLong;
// };
class PingContext extends epdoc_node_red_hautil_1.FunctionNodeBase {
    constructor(opts, payload) {
        super(opts);
        this._FLOW = {
            short: 'short',
            long: 'long'
        };
        if (payload) {
            this.initFromPayload(payload);
        }
        else {
            this.initFromStorage();
        }
    }
    get short() {
        return this._short;
    }
    get long() {
        return this._long;
    }
    initFromPayload(payload) {
        const id = payload.id || this.env.get('AN_ID');
        const tNowMs = new Date().getTime();
        this._short = {
            debug: payload.debug || this.env.get('AN_DEBUG') ? true : false,
            id: id,
            name: payload.name || this.env.get('AN_NAME'),
            busy: true,
            busyAt: tNowMs,
            startDate: tNowMs,
            rounds: this._initRounds(payload.data || [this.env.get('AN_HOSTS0'), this.env.get('AN_HOSTS1')])
        };
        this._long = this.flow.get(this._FLOW.long, 'file');
        this._saveShort();
    }
    _initRounds(arr) {
        const results = [];
        for (let idx = 0; idx < arr.length; ++idx) {
            const item = arr[idx];
            let result = [];
            let timeout = 0;
            if ((0, epdoc_util_1.isArray)(item)) {
                result = item;
            }
            else if ((0, epdoc_util_1.isNonEmptyString)(item)) {
                result = this.commaList(item);
            }
            else if ((0, epdoc_util_1.isDict)(item) && (0, epdoc_util_1.isArray)(item.hosts)) {
                if ((0, epdoc_util_1.isInteger)(item.timeout)) {
                    timeout = item.timeout;
                }
                if ((0, epdoc_util_1.isArray)(item.hosts)) {
                    result = item.hosts;
                }
                else if ((0, epdoc_util_1.isNonEmptyString)(item.hosts)) {
                    result = this.commaList(item.hosts);
                }
            }
            if ((0, epdoc_util_1.isNonEmptyArray)(result)) {
                let filtered = [];
                result.forEach((r) => {
                    if ((0, epdoc_util_1.isNonEmptyString)(r)) {
                        filtered.push(r);
                    }
                });
                if (filtered.length) {
                    const item = {
                        hosts: filtered,
                        timeout: timeout ? timeout : TIMEOUTS[idx],
                        responses: 0
                    };
                    results.push(item);
                }
            }
            else {
                this.node.error('IP Addresses or hostnames not configured correctly');
            }
        }
        if (results.length < 2) {
            this.node.error('IP Addresses or hostnames not configured correctly');
        }
        return results;
    }
    commaList(s) {
        return s.split(',').map((item) => {
            return item.trim();
        });
    }
    initFromStorage() {
        (this._short = this.flow.get(this._FLOW.short)),
            (this._long = this.flow.get(this._FLOW.long, 'file'));
    }
    _saveShort() {
        this.flow.set(this._FLOW.short, this._short);
        return this;
    }
    getRound(round) {
        return this.short.rounds ? this.short.rounds[round] : {};
    }
    getHost(round) {
        return this.getRound(round).hosts;
    }
    get name() {
        return this.short.name;
    }
    get busy() {
        return this.short.busy === true;
    }
    setBusy(val = true) {
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
    hasPingResponded(round) {
        const item = this.getRound(round);
        return item.responses > 0;
    }
    haveAllPingsResponded(round) {
        const item = this.getRound(round);
        return item.responses == item.hosts.length;
    }
    incPingHasResponded(round) {
        let item = this.getRound(round);
        item.responses = item.responses + 1;
        return this._saveShort();
    }
    isFirstRound(round) {
        return round === 0;
    }
    isLastRound(round) {
        if (this.short.rounds) {
            return round >= this.short.rounds.length - 1;
        }
        return true;
    }
    get debug() {
        return this.short.debug === true;
    }
    get startDate() {
        return this.short.startDate;
    }
    setStartDate(val) {
        this.short.startDate = val;
        return this._saveShort();
    }
    isUp() {
        return this.isDown() ? false : true;
    }
    isDown() {
        return this.long.down == true;
    }
    downAt() {
        return this.long.downAt || 0;
    }
    lastAliveAt() {
        return this.long.lastAliveAt ? this.long.lastAliveAt : 0;
    }
    setUp(tMs) {
        this._long = {
            down: false,
            count: 1 // XXXX
        };
        if (tMs) {
            this.long.lastAliveAt = tMs;
        }
        return this._saveLong();
    }
    setDownAt(downAtMs) {
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
    durationString(tMs) {
        return (0, epdoc_timeutil_1.durationUtil)(tMs, { ms: 1 }).format();
    }
    connectionStatusAsString() {
        let s = 'connection is ';
        if (this.isUp()) {
            s += 'up';
        }
        else {
            const tNowMs = new Date().getTime();
            const tDiff = (0, epdoc_timeutil_1.durationUtil)(tNowMs - this.downAt(), {}).format();
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
    _getPingPayloadItem(host, timeout, tStartMs, round) {
        return {
            host: host,
            timeout: timeout,
            start_date: tStartMs,
            id: this.short.id,
            name: this.short.name,
            round: round
        };
    }
    getPingPayload(round) {
        const item = this.getRound(round);
        const tStartMs = new Date().getTime();
        let result = [];
        item.hosts.forEach((host) => {
            result.push(this._getPingPayloadItem(host, item.timeout, tStartMs, round));
        });
        return result;
    }
    /**
     * Set tEndMs if the connection has been restablished at this time
     */
    getReportPayload(tEndMs, ping) {
        let result = {
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
exports.PingContext = PingContext;
const lib = {
    newFlowContext: (opts) => {
        return new PingContext(opts);
    },
    newFromStorage: (opts) => {
        return new PingContext(opts).initFromStorage();
    }
};
// flow.set('lib', lib);
// return msg;
//# sourceMappingURL=ping-context.js.map