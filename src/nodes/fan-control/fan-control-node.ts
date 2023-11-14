import { NodeRedDoneFunction, NodeRedSendFunction } from 'epdoc-node-red-hautil';
import { Node, NodeInitializer, NodeMessage } from 'node-red';
import { FanControl } from './fan-control';
import { FanControlNode, FanNodeDef, isFanControlNodeOpts } from './types';

const nodeInit: NodeInitializer = (RED): void => {
  function FanControlNodeConstructor(this: FanControlNode, config: FanNodeDef) {
    try {
      console.log('FanControlNode');
      RED.nodes.createNode(this, config);
      let node: Node = this as Node;

      if (!isFanControlNodeOpts(config)) {
        return;
      }
      // this.server = RED.nodes.getNode(config.server);
      // if (this.server) {
      // }

      const processMsg = async (msg: NodeMessage, send: NodeRedSendFunction, done: NodeRedDoneFunction) => {
        console.log('process message');
      };
      const processMsg2 = async (msg: NodeMessage, send: NodeRedSendFunction, done: NodeRedDoneFunction) => {
        const fanCtrl = new FanControl(node, msg, send, done);
        fanCtrl.setUiConfig(config);
        fanCtrl.setPayloadConfig(msg.payload);
        fanCtrl.run().then((resp) => {
          fanCtrl.done();
        });
      };

      const done = () => {
        console.log('done');
      };

      this.on('input', processMsg);
      this.on('close', done);
    } catch (err) {
      console.log(err);
    }
  }
  RED.nodes.registerType('fan-control', FanControlNodeConstructor);
};

export = nodeInit;
