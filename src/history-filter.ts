import { Integer, deepCopy, isArray, isNonEmptyArray } from 'epdoc-util';
import { HistoryLocation, LocationHistory, LocationHistoryItem, Person } from './location-history';
import { EpochMilliseconds } from './types';

export class HistoryFilter {
  private _person: Person;
  private _items: LocationHistoryItem[] = [];
  private _locations: HistoryLocation[] = [];
  private _tCutoffMs: EpochMilliseconds;

  constructor(person: Person, items: LocationHistoryItem[]) {
    this._person = person;
    this._items = deepCopy(items);
  }

  /**
   * Filters out all history items that were set prior to this time.
   * @param {ms} tCutoffMs ms from UNIX epoch.
   * @returns self
   */
  cutoff(tCutoffMs: EpochMilliseconds): HistoryFilter {
    this._tCutoffMs = tCutoffMs;
    if (isNonEmptyArray(this._items)) {
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
  locations(locations: HistoryLocation[]): HistoryFilter {
    this._locations = isArray(locations) ? locations : [locations];
    if (isNonEmptyArray(this._items) && isNonEmptyArray(this._locations)) {
      let newItems: LocationHistoryItem[] = [];
      for (let ldx = 0; ldx < this._locations.length; ++ldx) {
        const location: HistoryLocation = this._locations[ldx];
        for (let idx = 0; idx < this._items.length; ++idx) {
          const item: LocationHistoryItem = this._items[idx];
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
  sortByLocation(): HistoryFilter {
    if (isNonEmptyArray(this._locations) && isNonEmptyArray(this._items) && this._items.length > 1) {
      this._items.sort((a: LocationHistoryItem, b: LocationHistoryItem) => {
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
  found(): boolean {
    return isNonEmptyArray(this._items);
  }

  /**
   *
   * @returns The number of filtered items remaining.
   */
  numFound(): Integer {
    return this.found() ? this._items.length : 0;
  }

  /**
   * Evaluate whether the history items are ordered by time
   * @returns boolean Returns true if ordered by time.
   */
  orderedByTime(): boolean {
    let result = false;
    if (isNonEmptyArray(this._items) && this._items.length > 1) {
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
  toString(tNow: EpochMilliseconds) {
    tNow = tNow ? tNow : new Date().getTime();
    let result = [];
    if (isArray(this._items)) {
      for (let idx = 0; idx < this._items.length; ++idx) {
        result.push(LocationHistory._itemToString(this._items[idx], tNow));
      }
    }
    return `(${this._person}) ` + JSON.stringify(result);
  }
}
