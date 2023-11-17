import { NodeAPI, NodeMessage } from 'node-red';

import { NodeRedDoneFunction, NodeRedSendFunction } from 'epdoc-node-red-hautil';
import { RED, setRED } from '../../globals';
import Status from '../common/Status';
import NodeRedContextService from '../common/context-service';
import { BaseNode } from '../common/types';
import { FanControl } from './fan-control';
import { FanControlNodeConfig, isFanControlNodeConfig } from './types';

export interface FanControlNode extends BaseNode {
  config: FanControlNodeConfig;
  controller: FanControl;
}

export default function fanControlNode(this: FanControlNode, config: FanControlNodeConfig): void {
  RED.nodes.createNode(this, config);
  // this.config = migrate(config);

  // const serverConfigNode = getServerConfigNode(this.config.server);
  // const homeAssistant = getHomeAssistant(serverConfigNode);
  const exposeAsConfigNode = false; // getExposeAsConfigNode(this.config.exposeAsEntityConfig);
  // const clientEvents = new ClientEvents({
  //   node: this,
  //   emitter: homeAssistant.eventBus
  // });
  const status = new Status({ node: this });

  const nodeRedContextService = new NodeRedContextService(this);

  try {
    console.log('FanControlNode');
    RED.nodes.createNode(this, config);
    let node: FanControlNode = this as FanControlNode;

    if (!isFanControlNodeConfig(config)) {
      return;
    }
    // this.server = RED.nodes.getNode(config.server);
    // if (this.server) {
    // }

    // const processMsg = async (msg: NodeMessage, send: NodeRedSendFunction, done: NodeRedDoneFunction) => {
    //   console.log('process message');
    //};
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

    this.on('input', processMsg);
    this.on('close', done);
  } catch (err) {
    console.log(err);
  }
}

module.exports = function (RED: NodeAPI) {
  setRED(RED);
  RED.nodes.registerType('fan-control', fanControlNode);
};
