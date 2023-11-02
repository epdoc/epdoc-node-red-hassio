import { ContextStorageType, FunctionNodeBase, NodeRedOpts } from 'epdoc-node-red-hautil';
import { EpochMilliseconds } from 'epdoc-timeutil';
import { Dict } from 'epdoc-util';
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
export declare function newLocationHistory(lopts: LocationHistoryOpts, opts: NodeRedOpts): LocationHistory;
export declare class LocationHistory extends FunctionNodeBase {
    private GATE_HISTORY;
    history: HistoryDict;
    private dirty;
    private _storage;
    private _storageType;
    constructor(lopts: LocationHistoryOpts, opts: NodeRedOpts);
    private getStorage;
    private setStorage;
    read(): this;
    /**
     * Write history out to storeage
     * @returns this
     */
    flush(): LocationHistory;
    add(person: Person, location: HistoryLocation, time: EpochMilliseconds): this;
    /**
     * Return a HistoryFilter object that can be used to filter location history for this person
     * @param {string} person
     * @returns
     */
    filter(person: Person): HistoryFilter;
    /**
     * Find the person at any one of the locations, after the time defined by tCutoff
     * @param {} person
     * @param {*} tCutoff date (ms)
     * @param {*} locations Individual or array of location names
     * @returns Array of objects containing matches { location, time: ms }
     */
    person(person: Person): HistoryFilter;
    /**
     * Remove history entries that are older than `tCutoff`.
     * @param tCutoff
     * @returns
     */
    prune(tCutoff: EpochMilliseconds): LocationHistory;
    toString(tNow: EpochMilliseconds): string;
    static _itemToString(item: LocationHistoryItem, tNow: EpochMilliseconds): Dict;
}
