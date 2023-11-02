import { EpochMilliseconds } from 'epdoc-node-red-hautil';
import { Integer } from 'epdoc-util';
import { HistoryLocation, LocationHistoryItem, Person } from './location-history';
export declare class HistoryFilter {
    private _person;
    private _items;
    private _locations;
    private _tCutoffMs;
    constructor(person: Person, items: LocationHistoryItem[]);
    /**
     * Filters out all history items that were set prior to this time.
     * @param {ms} tCutoffMs ms from UNIX epoch.
     * @returns self
     */
    cutoff(tCutoffMs: EpochMilliseconds): HistoryFilter;
    /**
     * Filter out all history items that are not at the specified locations.
     * @param {array of strings} locations A string or array of strings.
     * @returns self
     */
    locations(locations: HistoryLocation | HistoryLocation[]): HistoryFilter;
    /**
     * Sorts the history items to be in the same order as they appear in the
     * previous call to locations().
     * @returns self
     */
    sortByLocation(): HistoryFilter;
    /**
     *
     * @returns true if there are filtered items remaining
     */
    found(): boolean;
    /**
     *
     * @returns The number of filtered items remaining.
     */
    numFound(): Integer;
    /**
     * Evaluate whether the history items are ordered by time
     * @returns boolean Returns true if ordered by time.
     */
    orderedByTime(): boolean;
    /**
     * Determines if the person is moving in the direction of locations(), which
     * should have been called earlier. Will sort entries by location and
     * determine if they are ordered by time in the appropriate direction.
     * @returns true if moving in the direction given by the call to locations().
     */
    moving(): boolean;
    /**
     * Generates a JSON string that displays time as milliseconds from tNow.
     * @param {ms} tNow (optional) The reference time. Will be set to now if not
     * provided
     * @returns a JSON stringified array of history locations and times.
     */
    toString(tNow: EpochMilliseconds): string;
}
