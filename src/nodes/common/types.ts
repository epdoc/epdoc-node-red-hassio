import { Dict } from 'epdoc-util';
import { Node, NodeDef } from 'node-red';
import { DateTimeFormatOptions } from './datetime-format';

export type SelectorType = 'id' | 'friendlyName';

export type NodeRed = {
  nodes: {
    createNode: (ctx: Node, config: Dict) => {};
  };
};

export interface NodeProperties extends NodeDef {
  debugEnabled?: boolean;
  version: number;
}

export interface BaseNodeConfig extends NodeProperties {
  version: number;
}

export interface BaseNode extends Node {
  config: BaseNodeConfig;
  controller: any;
}

// export enum NodeType {
//   FanControl = 'fan-control',
//   LowerCase = 'lower-case'
// }

export interface BaseNodeConfig extends NodeProperties {
  version: number;
  debugEnabled?: boolean;
  // outputs?: number;
}

export interface BaseNode extends Node {
  config: BaseNodeConfig;
  controller: any;
}

export interface ServerNodeConfig extends NodeProperties {
  addon: boolean;
  rejectUnauthorizedCerts: boolean;
  ha_boolean: string;
  connectionDelay: boolean;
  cacheJson: boolean;
  heartbeat: boolean;
  heartbeatInterval: number;
  areaSelector: SelectorType;
  deviceSelector: SelectorType;
  entitySelector: SelectorType;
  statusSeparator: string;
  statusYear: DateTimeFormatOptions['year'] | 'hidden';
  statusMonth: DateTimeFormatOptions['month'] | 'hidden';
  statusDay: DateTimeFormatOptions['day'] | 'hidden';
  statusHourCycle: DateTimeFormatOptions['hourCycle'] | 'default';
  statusTimeFormat: 'h:m' | 'h:m:s' | 'h:m:s.ms';
  enableGlobalContextStore: boolean;
}
