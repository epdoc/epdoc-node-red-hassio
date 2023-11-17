import { EntityShortId } from 'epdoc-node-red-hautil';
import { Integer, isNonEmptyString } from 'epdoc-util';
import { Node, NodeDef } from 'node-red';

export type FanControlNodeOpts = {
  fan: EntityShortId;
  service: 'on' | 'off';
  speed: Integer;
  timeout: Integer;
  debug: boolean;
};
export function isFanControlNodeOpts(val: any): val is FanControlNodeOpts {
  return val && isNonEmptyString(val.fan);
}

export interface FanNodeDef extends NodeDef, FanControlNodeOpts {}

export type FanNodeCredentials = Record<string, unknown>;

export interface FanControlNode extends Node<FanNodeCredentials> {}

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
