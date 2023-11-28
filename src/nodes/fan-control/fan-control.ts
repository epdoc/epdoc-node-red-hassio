import { NodeRedDoneFunction, NodeRedSendFunction } from 'epdoc-node-red-hautil';
import { Node, NodeAPI, NodeDef, NodeMessage } from 'node-red';
import { setRED } from '../../globals';
import { FanController } from './fan-controller';
import { FanControlDef } from './types';

module.exports = function (RED: NodeAPI) {
  setRED(RED);
  function FanControlNode(config: NodeDef) {
    const configExample = {
      id: 'e4cdb8465f203a1e',
      type: 'pan-control',
      z: 'fcf0c5de6eb4495c',
      name: '',
      x: 1430,
      y: 940,
      wires: [['f7736af523f7d0c9']]
    };
    // @ts-ignore
    RED.nodes.createNode(this as Node, config);
    // @ts-ignore
    let node: FanControlNode = this as FanControlNode;

    node.log(`Starting fan-control with config: ${JSON.stringify(config)}`);

    // const exposeAsConfigNode = false; // getExposeAsConfigNode(this.config.exposeAsEntityConfig);

    // const status = new Status({ node: node });

    // const nodeRedContextService = new NodeRedContextService(node);

    const fanCtrl = new FanController(node, config as FanControlDef);

    try {
      const processMsg = async (msg: NodeMessage, send: NodeRedSendFunction, done: NodeRedDoneFunction) => {
        node.log(`Processing fan-control message: ${msg.payload}`);
        // msg.payload = 'Processed fan-control message';
        // fanCtrl.setMessage(msg, send, done);
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
