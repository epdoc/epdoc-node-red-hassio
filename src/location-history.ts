import { ContextKey, ContextStorageType, FunctionNodeBase, NodeRedOpts } from 'epdoc-node-red-hautil';
import { EpochMilliseconds } from 'epdoc-timeutil';
import { Dict, isArray } from 'epdoc-util';
import { HistoryFilter } from './history-filter';

export type Person = string;
export type HistoryLocation = string;
export type Time = any;
export type LocationHistoryItem = {
  location: HistoryLocation;
  time: EpochMilliseconds;
};
export type LocationHistoryOpts = {
  context: 'global' | 'flow';
  type?: ContextStorageType;
};
export type HistoryDict = Record<Person, any>;

export function newLocationHistory(lopts: LocationHistoryOpts, opts: NodeRedOpts) {
  return new LocationHistory(lopts, opts);
}

export class LocationHistory extends FunctionNodeBase {
  private GATE_HISTORY = 'gate_history';
  public history: HistoryDict = {};
  private dirty = false;
  private _storage: Dict = {};
  private _storageType: ContextStorageType = 'memory';

  constructor(lopts: LocationHistoryOpts, opts: NodeRedOpts) {
    super(opts);
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

  private getStorage(key: ContextKey): any {
    if (this._storage) {
      return this._storage.get(key, this._storageType);
    }
  }

  private setStorage(key: ContextKey, data: any): any {
    if (this._storage) {
      return this._storage.set(key, data, this._storageType);
    }
  }

  read(): this {
    this.history = this.getStorage(this.GATE_HISTORY) || {};
    return this;
  }

  /**
   * Write history out to storeage
   * @returns this
   */
  flush(): LocationHistory {
    if (this.dirty) {
      this.setStorage(this.GATE_HISTORY, this.history);
      this.dirty = false;
    }
    return this;
  }

  add(person: Person, location: HistoryLocation, time: EpochMilliseconds) {
    let oldItems = this.history[person];
    if (!isArray(oldItems)) {
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

  filter(person: Person): HistoryFilter {
    return new HistoryFilter(person, isArray(this.history[person]) ? this.history[person] : []);
  }

  /**
   * Find the person at any one of the locations, after the time defined by tCutoff
   * @param {} person
   * @param {*} tCutoff date (ms)
   * @param {*} locations Individual or array of location names
   * @returns Array of objects containing matches { location, time: ms }
   */
  person(person: Person): HistoryFilter {
    return this.filter(person);
  }

  /**
   * Remove history entries that are older than `tCutoff`.
   * @param tCutoff
   * @returns
   */
  prune(tCutoff: EpochMilliseconds): LocationHistory {
    Object.keys(this.history).forEach((key) => {
      const items = this.history[key];
      let newItems = [];
      if (isArray(items)) {
        for (let idx = 0; idx < items.length; ++idx) {
          const item: LocationHistoryItem = items[idx];
          if (tCutoff < item.time) {
            newItems.push(item);
          }
        }
      }
      if (!isArray(items) || newItems.length !== items.length) {
        this.history[key] = newItems;
        this.dirty = true;
      }
    });
    return this;
  }

  toString(tNow: EpochMilliseconds): string {
    tNow = tNow ? tNow : new Date().getTime();
    let result: Dict = {};
    Object.keys(this.history).forEach((key) => {
      const items: LocationHistoryItem[] = this.history[key];
      result[key] = [];
      if (isArray(items)) {
        for (let idx = 0; idx < items.length; ++idx) {
          result[key].push(LocationHistory._itemToString(items[idx], tNow));
        }
      }
    });
    return JSON.stringify(result);
  }

  static _itemToString(item: LocationHistoryItem, tNow: EpochMilliseconds): Dict {
    return {
      location: item.location,
      time: item.time - tNow
    };
  }
}
