"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocationHistory = exports.newLocationHistory = void 0;
const epdoc_node_red_hautil_1 = require("epdoc-node-red-hautil");
const epdoc_util_1 = require("epdoc-util");
const history_filter_1 = require("./history-filter");
function newLocationHistory(lopts, opts) {
    return new LocationHistory(lopts, opts);
}
exports.newLocationHistory = newLocationHistory;
class LocationHistory extends epdoc_node_red_hautil_1.FunctionNodeBase {
    constructor(lopts, opts) {
        super(opts);
        this.GATE_HISTORY = 'gate_history';
        this.history = {};
        this.dirty = false;
        if (lopts) {
            if (lopts.context) {
                this._storage = opts[lopts.context];
            }
            if (lopts.type) {
                this._storageType = lopts.type;
            }
        }
        this.read();
    }
    getStorage(key) {
        if (this._storage) {
            return this._storage.get(key, this._storageType);
        }
    }
    setStorage(key, data) {
        if (this._storage) {
            return this._storage.set(key, data, this._storageType);
        }
    }
    read() {
        this.history = this.getStorage(this.GATE_HISTORY) || {};
        return this;
    }
    /**
     * Write history out to storeage
     * @returns this
     */
    flush() {
        if (this.dirty) {
            this.setStorage(this.GATE_HISTORY, this.history);
            this.dirty = false;
        }
        return this;
    }
    add(person, location, time) {
        let oldItems = this.history[person];
        if (!(0, epdoc_util_1.isArray)(oldItems)) {
            oldItems = [];
        }
        let newItems = [];
        // If an entry already exists at this location, remove it
        for (let idx = 0; idx < oldItems.length; ++idx) {
            const item = oldItems[idx];
            if (item.location !== location) {
                newItems.push(item);
            }
        }
        newItems.push({ location: location, time: time });
        this.history[person] = newItems;
        this.dirty = true;
        return this;
    }
    /**
     * Return a HistoryFilter object that can be used to filter location history for this person
     * @param {string} person
     * @returns
     */
    filter(person) {
        return new history_filter_1.HistoryFilter(person, (0, epdoc_util_1.isArray)(this.history[person]) ? this.history[person] : []);
    }
    /**
     * Find the person at any one of the locations, after the time defined by tCutoff
     * @param {} person
     * @param {*} tCutoff date (ms)
     * @param {*} locations Individual or array of location names
     * @returns Array of objects containing matches { location, time: ms }
     */
    person(person) {
        return this.filter(person);
    }
    /**
     * Remove history entries that are older than `tCutoff`.
     * @param tCutoff
     * @returns
     */
    prune(tCutoff) {
        Object.keys(this.history).forEach((key) => {
            const items = this.history[key];
            let newItems = [];
            if ((0, epdoc_util_1.isArray)(items)) {
                for (let idx = 0; idx < items.length; ++idx) {
                    const item = items[idx];
                    if (tCutoff < item.time) {
                        newItems.push(item);
                    }
                }
            }
            if (!(0, epdoc_util_1.isArray)(items) || newItems.length !== items.length) {
                this.history[key] = newItems;
                this.dirty = true;
            }
        });
        return this;
    }
    toString(tNow) {
        tNow = tNow ? tNow : new Date().getTime();
        let result = {};
        Object.keys(this.history).forEach((key) => {
            const items = this.history[key];
            result[key] = [];
            if ((0, epdoc_util_1.isArray)(items)) {
                for (let idx = 0; idx < items.length; ++idx) {
                    result[key].push(LocationHistory._itemToString(items[idx], tNow));
                }
            }
        });
        return JSON.stringify(result);
    }
    static _itemToString(item, tNow) {
        return {
            location: item.location,
            time: item.time - tNow
        };
    }
}
exports.LocationHistory = LocationHistory;
//# sourceMappingURL=location-history.js.map