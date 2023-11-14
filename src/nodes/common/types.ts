import { Dict } from 'epdoc-util';
import { Node } from 'node-red';
export type NodeRed = {
  nodes: {
    createNode: (ctx: Node, config: Dict) => {};
  };
};
