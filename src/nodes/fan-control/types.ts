import { EntityId, EntityShortId } from 'epdoc-node-red-hautil';
import { Milliseconds } from 'epdoc-timeutil';
import { Dict, Integer, asInt, isNonEmptyString, pick } from 'epdoc-util';
import { BaseNodeConfig } from 'nodes/types';

export type NumberAsString = string;

export enum FanControlInstruction {
  TurnOn = 'turn_on',
  TurnOff = 'turn_off',
  Speed1 = '1',
  Speed2 = '2',
  Speed3 = '3',
  Speed4 = '4',
  Speed5 = '5',
  Speed6 = '6'
}

export type FanControlNodeInst = {
  service: 'turn_on' | 'turn_off';
  speed?: Integer;
};

export function fanControlInstructionMap(inst: FanControlInstruction) {
  let result: FanControlNodeInst = { service: 'turn_on' };
  if (inst === FanControlInstruction.TurnOn) {
    return result;
  }
  if (inst === FanControlInstruction.TurnOff) {
    result.service = 'turn_off';
    return result;
  }
  result.speed = asInt(inst);
  return result;
}

export interface FanControlNodeConfig extends BaseNodeConfig {
  server: string;
  fan: EntityShortId;
  enitityId: EntityId;
  instruction: FanControlInstruction;
  for: NumberAsString;
  forUnits: TimeUnit;
  retryDelay: Milliseconds[];
}

export function isFanControlNodeConfig(val: any): val is FanControlNodeConfig {
  return val && isNonEmptyString(val.fan);
}
export const FanControlNodeConfigKeys = ['fan', 'instruction', 'for', 'forUnits', 'retryDelay', 'debugEnabled'];
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
