import { NodeRedDoneFunction, NodeRedSendFunction } from 'epdoc-node-red-hautil';
import { Node, NodeAPI, NodeDef, NodeMessage } from 'node-red';
import { FanControl } from './fan-control';

module.exports = function (RED: NodeAPI) {
  function FanControlNode(this: any, config: NodeDef) {
    RED.nodes.createNode(this as Node, config);
    let node: Node = this as Node;

    // this.server = RED.nodes.getNode(config.server);
    // if (this.server) {
    // }

    node.on('input', async (msg: NodeMessage, send: NodeRedSendFunction, done: NodeRedDoneFunction) => {
      const fanCtrl = new FanControl(node, msg, send, done);
      fanCtrl.setUiConfig(config);
      fanCtrl.setPayloadConfig(msg.payload);
      fanCtrl.run().then((resp) => {
        fanCtrl.done();
      });
    });
  }
  RED.nodes.registerType('functionNode', FanControlNode);
};
