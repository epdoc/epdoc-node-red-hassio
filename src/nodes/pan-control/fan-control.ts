import { Node, NodeAPI, NodeDef, NodeMessage } from 'node-red';

import { NodeRedDoneFunction, NodeRedSendFunction } from 'epdoc-node-red-hautil';
import { setRED } from '../../globals';
import { BaseNode } from '../common/types';
import { FanController } from './fan-controller';
import { FanControlNodeConfig } from './types';

export interface FanControlNode extends BaseNode {
  config: FanControlNodeConfig;
  controller: FanController;
}

module.exports = function (RED: NodeAPI) {
  setRED(RED);
  function FanControlNode(config: NodeDef): void {
    const configExample = {
      id: 'cbe30b9e65295f32',
      type: 'fan-control',
      z: 'fcf0c5de6eb4495c',
      fan: '',
      x: 1610,
      y: 800,
      wires: [[], []]
    };

    // @ts-ignore
    RED.nodes.createNode(this as Node, config);
    // @ts-ignore
    let node: FanControlNode = this as FanControlNode;

    node.log('Starting fan-control');

    // const exposeAsConfigNode = false; // getExposeAsConfigNode(this.config.exposeAsEntityConfig);

    // const status = new Status({ node: node });

    // const nodeRedContextService = new NodeRedContextService(node);

    try {
      const processMsg = async (msg: NodeMessage, send: NodeRedSendFunction, done: NodeRedDoneFunction) => {
        node.log('Processing fan-control message');
        msg.payload = 'Processed fan-control message';
        node.send(msg);
        // const fanCtrl = new FanController(node, msg, send, done);
        // fanCtrl.setUiConfig(config);
        // fanCtrl.setPayloadConfig(msg.payload);
        // fanCtrl.run().then((resp) => {
        //   fanCtrl.done();
        // });
      };

      const done = () => {
        node.log('fan-control done');
      };

      node.on('input', processMsg);
      // node.on('close', done);
    } catch (err) {
      console.log(err);
    }
  }

  RED.nodes.registerType('fan-control', FanControlNode);
};
