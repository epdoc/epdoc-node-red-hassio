import { NodeAPI } from 'node-red';
import { setRED } from '../globals';
import { createFanControlNode } from './fan-control-node';

/**
 * Main function that we register with Node-RED that is then called by Node-RED
 * to register this Node.
 */

module.exports = function (RED: NodeAPI) {
  setRED(RED);
  RED.log.info('Registering fan-control node');
  RED.nodes.registerType('fan-control', createFanControlNode);
};
