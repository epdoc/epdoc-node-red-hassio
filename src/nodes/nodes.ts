import { RED } from './globals';
import { NodeMessage } from 'node-red';
import { PRINT_TO_DEBUG_TOPIC, TypedInputTypes } from './const';
import { BaseNode } from './types';

export enum ContextLocation {
  Msg = 'msg',
  Flow = 'flow',
  Global = 'global'
}

export type NodeSend = (msg: NodeMessage | Array<NodeMessage | NodeMessage[] | null>) => void;
export type NodeDone = (err?: Error) => void;

export type OutputProperty = {
  property: string;
  propertyType: ContextLocation;
  value: string;
  valueType: TypedInputTypes;
};

export function debugToClient(node: BaseNode, message: any, topic?: string) {
  if (!node.config.debugEnabled) {
    return;
  }

  const debug = {
    id: node.id,
    msg: message,
    name: node.name,
    path: `${node.z}/${node.id}`,
    topic
  };
  RED.comms.publish(PRINT_TO_DEBUG_TOPIC, debug, false);
}
