import { Node, NodeAPI, NodeDef, NodeMessage } from 'node-red';
import { setRED } from '../../globals';

module.exports = function (RED: NodeAPI) {
  setRED(RED);
  function LowerCaseNode(config: NodeDef) {
    const configExample = {
      id: 'e4cdb8465f203a1e',
      type: 'lower-case',
      z: 'fcf0c5de6eb4495c',
      name: '',
      x: 1430,
      y: 940,
      wires: [['f7736af523f7d0c9']]
    };
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
