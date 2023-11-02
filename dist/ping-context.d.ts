import { FunctionNodeBase, NodeRedOpts } from 'epdoc-node-red-hautil';
import { EpochMilliseconds, Milliseconds } from 'epdoc-timeutil';
import { Integer } from 'epdoc-util';
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
export declare class PingContext extends FunctionNodeBase {
    private _FLOW;
    private _short;
    private _long;
    constructor(opts?: NodeRedOpts, payload?: InputPayload);
    get short(): PingContextShort;
    get long(): PingContextLong;
    initFromPayload(payload: InputPayload): void;
    _initRounds(arr: PingInputData[]): RoundsData[];
    commaList(s: string): string[];
    initFromStorage(): void;
    _saveShort(): this;
    getRound(round: RoundIndex): RoundsData;
    getHost(round: RoundIndex): HOST | HOST[];
    get name(): string | undefined;
    get busy(): boolean;
    setBusy(val?: boolean): this;
    clearBusy(): this;
    busyTimeout(): boolean;
    hasPingResponded(round: RoundIndex): boolean;
    haveAllPingsResponded(round: RoundIndex): boolean;
    incPingHasResponded(round: RoundIndex): PingContext;
    isFirstRound(round: RoundIndex): boolean;
    isLastRound(round: RoundIndex): boolean;
    get debug(): boolean;
    get startDate(): EpochMilliseconds;
    setStartDate(val: EpochMilliseconds): this;
    isUp(): boolean;
    isDown(): boolean;
    downAt(): EpochMilliseconds;
    lastAliveAt(): EpochMilliseconds;
    setUp(tMs: EpochMilliseconds): PingContext;
    setDownAt(downAtMs: EpochMilliseconds): this;
    /**
     * This counts how many times this flow has been run before we get a response
     */
    incrementDownCounter(): this;
    get count(): number;
    _saveLong(): this;
    durationString(tMs: EpochMilliseconds): string;
    connectionStatusAsString(): string;
    _getPingPayloadItem(host: HOST, timeout: Milliseconds, tStartMs: EpochMilliseconds, round: RoundIndex): PingConfig;
    getPingPayload(round: RoundIndex): PingConfig[];
    /**
     * Set tEndMs if the connection has been restablished at this time
     */
    getReportPayload(tEndMs: EpochMilliseconds, ping: PingConfig): PingReport;
}
