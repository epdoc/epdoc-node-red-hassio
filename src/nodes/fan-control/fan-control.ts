import { NodeAPI } from 'node-red';
import { setRED } from '../globals';
import { fanControlNode } from './fan-control-node';

module.exports = function (RED: NodeAPI) {
  setRED(RED);
  RED.log.info('Registering fan-control node');
  RED.nodes.registerType('fan-control', fanControlNode);
};
