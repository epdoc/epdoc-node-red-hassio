import { Node, NodeAPI, NodeMessage } from 'node-red';

import { NodeRedDoneFunction, NodeRedSendFunction } from 'epdoc-node-red-hautil';
import { setRED } from '../../globals';
import { BaseNode } from '../common/types';
import { FanControl } from './fan-control';
import { FanControlNodeConfig, isFanControlNodeConfig } from './types';

export interface FanControlNode extends BaseNode {
  config: FanControlNodeConfig;
  controller: FanControl;
}

module.exports = function (RED: NodeAPI) {
  setRED(RED);
  function fanControlNode(config: FanControlNodeConfig): void {
    console.log('FanControlNode');
    // @ts-ignore
    RED.nodes.createNode(this as Node, config);
    // @ts-ignore
    let node: FanControlNode = this as FanControlNode;

    // const exposeAsConfigNode = false; // getExposeAsConfigNode(this.config.exposeAsEntityConfig);

    // const status = new Status({ node: node });

    // const nodeRedContextService = new NodeRedContextService(node);

    try {
      if (!isFanControlNodeConfig(config)) {
        return;
      }
      const processMsg = async (msg: NodeMessage, send: NodeRedSendFunction, done: NodeRedDoneFunction) => {
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

      node.on('input', processMsg);
      node.on('close', done);
    } catch (err) {
      console.log(err);
    }
  }

  RED.nodes.registerType('fan-control', fanControlNode);
};
