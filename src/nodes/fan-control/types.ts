import { EntityShortId } from '@epdoc/node-red-hautil';
import { Milliseconds } from '@epdoc/timeutil';
import { Dict, Integer, isNonEmptyString, pick } from '@epdoc/typeutil';
import { BaseNodeConfig } from 'nodes/types';

export type NumberAsString = string;

export enum FanControlInstruction {
  TurnOn = 'turn_on',
  TurnOff = 'turn_off',
  Speed1 = 'speed_1',
  Speed2 = 'speed_2',
  Speed3 = 'speed_3',
  Speed4 = 'speed_4',
  Speed5 = 'speed_5',
  Speed6 = 'speed_6'
}

/**
 * Parameters that can be set in the UI of the Node.
 */
export interface FanControlNodeConfig extends BaseNodeConfig {
  server: string;
  fan: EntityShortId;
  // enitityId: EntityId;
  instruction: FanControlInstruction;
  setSpeed: boolean;
  speed: Integer;
  timeoutEnabled: boolean;
  for: NumberAsString;
  forUnits: TimeUnit;
  retryDelay: Milliseconds[];
}

export function isFanControlNodeConfig(val: any): val is FanControlNodeConfig {
  return val && isNonEmptyString(val.fan);
}
export const FanControlNodeConfigKeys = [
  'server',
  'fan',
  'instruction',
  'setSpeed',
  'timeoutEnabled',
  'for',
  'forUnits',
  'retryDelay',
  'debugEnabled'
];
export function toFanControlNodeConfig(dict: Dict): FanControlNodeConfig {
  return pick(dict, FanControlNodeConfigKeys) as FanControlNodeConfig;
}

// export interface FanNodeDef extends NodeDef, FanControlDef {}

export type FanNodeCredentials = Record<string, unknown>;

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

export const TimeUnitMultiplier: Record<TimeUnit, Integer> = {
  milliseconds: 1,
  seconds: 1000,
  minutes: 60 * 1000,
  hours: 3600 * 1000,
  days: 24 * 3600 * 1000
};
