import { Milliseconds } from '@epdoc/timeutil';
import { Dict, isNonEmptyString, pick } from '@epdoc/typeutil';
import { BaseNodeConfig } from 'nodes/types';

export type NumberAsString = string;

/**
 * Parameters that can be set in the UI of the Node.
 */
export interface PingTestNodeConfig extends BaseNodeConfig {
  retryDelay: Milliseconds[];
}

export function isPingTestNodeConfig(val: any): val is PingTestNodeConfig {
  return val && isNonEmptyString(val.fan);
}
export const PingTestNodeConfigKeys = ['retryDelay', 'debugEnabled'];
export function toPingTestNodeConfig(dict: Dict): PingTestNodeConfig {
  return pick(dict, PingTestNodeConfigKeys) as PingTestNodeConfig;
}

// export interface FanNodeDef extends NodeDef, PingTestDef {}

export enum NodeColor {
  Action = '#46B1EF',
  Alpha = '#E78BB9',
  Api = '#7CDFFD',
  Beta = '#77DD77',
  Data = '#5BCBF7',
  Deprecated = '#A6BBCF',
  Event = '#399CDF',
  HaBlue = '#41BDF5'
}

export enum TimeUnit {
  Milliseconds = 'milliseconds',
  Seconds = 'seconds',
  Minutes = 'minutes',
  Hours = 'hours',
  Days = 'days'
}
