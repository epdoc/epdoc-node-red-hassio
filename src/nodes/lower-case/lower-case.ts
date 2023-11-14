import { Node, NodeAPI, NodeDef, NodeMessage } from 'node-red';

module.exports = function (RED: NodeAPI) {
  function LowerCaseNode(config: NodeDef) {
    // @ts-ignore
    RED.nodes.createNode(this as Node, config);
    // @ts-ignore
    let node: Node = this as Node;
    // @ts-ignore
    this.on('input', function (msg: NodeMessage) {
      // @ts-ignore
      msg.payload = msg.payload.toLowerCase();
      node.send(msg);
    });
  }
  RED.nodes.registerType('lower-case', LowerCaseNode);
};
