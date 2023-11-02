"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HistoryFilter = void 0;
const epdoc_util_1 = require("epdoc-util");
const location_history_1 = require("./location-history");
class HistoryFilter {
    constructor(person, items) {
        this._items = [];
        this._locations = [];
        this._tCutoffMs = 0;
        this._person = person;
        this._items = (0, epdoc_util_1.deepCopy)(items);
    }
    /**
     * Filters out all history items that were set prior to this time.
     * @param {ms} tCutoffMs ms from UNIX epoch.
     * @returns self
     */
    cutoff(tCutoffMs) {
        this._tCutoffMs = tCutoffMs;
        if ((0, epdoc_util_1.isNonEmptyArray)(this._items)) {
            let newItems = [];
            for (let idx = 0; idx < this._items.length; ++idx) {
                const item = this._items[idx];
                if (this._tCutoffMs < item.time) {
                    newItems.push(item);
                }
            }
            this._items = newItems;
        }
        return this;
    }
    /**
     * Filter out all history items that are not at the specified locations.
     * @param {array of strings} locations A string or array of strings.
     * @returns self
     */
    locations(locations) {
        this._locations = (0, epdoc_util_1.isArray)(locations) ? locations : [locations];
        if ((0, epdoc_util_1.isNonEmptyArray)(this._items) && (0, epdoc_util_1.isNonEmptyArray)(this._locations)) {
            let newItems = [];
            for (let ldx = 0; ldx < this._locations.length; ++ldx) {
                const location = this._locations[ldx];
                for (let idx = 0; idx < this._items.length; ++idx) {
                    const item = this._items[idx];
                    if (location === item.location) {
                        newItems.push(item);
                    }
                }
            }
            this._items = newItems;
        }
        return this;
    }
    /**
     * Sorts the history items to be in the same order as they appear in the
     * previous call to locations().
     * @returns self
     */
    sortByLocation() {
        if ((0, epdoc_util_1.isNonEmptyArray)(this._locations) && (0, epdoc_util_1.isNonEmptyArray)(this._items) && this._items.length > 1) {
            this._items.sort((a, b) => {
                let adx = this._locations.indexOf(a.location);
                let bdx = this._locations.indexOf(b.location);
                return adx < bdx ? -1 : bdx < adx ? 1 : 0;
            });
        }
        return this;
    }
    /**
     *
     * @returns true if there are filtered items remaining
     */
    found() {
        return (0, epdoc_util_1.isNonEmptyArray)(this._items);
    }
    /**
     *
     * @returns The number of filtered items remaining.
     */
    numFound() {
        return this.found() ? this._items.length : 0;
    }
    /**
     * Evaluate whether the history items are ordered by time
     * @returns boolean Returns true if ordered by time.
     */
    orderedByTime() {
        let result = false;
        if ((0, epdoc_util_1.isNonEmptyArray)(this._items) && this._items.length > 1) {
            result = true;
            for (let mdx = 0; mdx < this._items.length - 1; ++mdx) {
                if (this._items[mdx].time > this._items[mdx + 1].time) {
                    return false;
                }
            }
        }
        return result;
    }
    /**
     * Determines if the person is moving in the direction of locations(), which
     * should have been called earlier. Will sort entries by location and
     * determine if they are ordered by time in the appropriate direction.
     * @returns true if moving in the direction given by the call to locations().
     */
    moving() {
        return this.sortByLocation().orderedByTime();
    }
    /**
     * Generates a JSON string that displays time as milliseconds from tNow.
     * @param {ms} tNow (optional) The reference time. Will be set to now if not
     * provided
     * @returns a JSON stringified array of history locations and times.
     */
    toString(tNow) {
        tNow = tNow ? tNow : new Date().getTime();
        let result = [];
        if ((0, epdoc_util_1.isArray)(this._items)) {
            for (let idx = 0; idx < this._items.length; ++idx) {
                result.push(location_history_1.LocationHistory._itemToString(this._items[idx], tNow));
            }
        }
        return `(${this._person}) ` + JSON.stringify(result);
    }
}
exports.HistoryFilter = HistoryFilter;
//# sourceMappingURL=history-filter.js.map