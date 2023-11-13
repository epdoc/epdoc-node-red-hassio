import { EntityShortId } from 'epdoc-node-red-hautil';
import { Milliseconds } from 'epdoc-timeutil';
import { Integer } from 'epdoc-util';
import { NodeRedMessage } from '../common/types';
import { FanControl } from './fan-control';

type FanControlUiConfig = {
  fan: EntityShortId;
  service: 'on' | 'off';
  speed: Integer;
  timeout: Milliseconds;
  debug: boolean;
};

module.exports = function (RED: any) {
  function fanControlNode(config: FanControlUiConfig) {
    RED.nodes.createNode(this, config);
    let node: any = this;

    node.on('input', async (msg: NodeRedMessage, send: Function, done: Function) => {
      const fanCtrl = new FanControl();
      fanCtrl.setContext(global, node, flow);
      fanCtrl.setUiConfig(config);
      fanCtrl.setPayloadConfig(msg.payload);
      fanCtrl.run().then((resp) => {
        send(resp);
        done();
      });
    });
  }
};
