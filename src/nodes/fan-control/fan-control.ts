import { hautilInfo } from '@epdoc/node-red-hautil';
import { NodeAPI } from 'node-red';
import { setRED } from '../globals';
import { hassioInfo } from './../../index';
import { createFanControlNode } from './fan-control-node';

/**
 * Main function that we register with Node-RED that is then called by Node-RED
 * to register this Node.
 */

module.exports = function (RED: NodeAPI) {
  setRED(RED);
  RED.log.info(`${hassioInfo.name()} version: ${hassioInfo.version()}`);
  RED.log.info(`${hautilInfo.name()} version: ${hautilInfo.version()}`);
  RED.log.info(`Registering fan-control node version: ${hassioInfo.version()}`);
  RED.nodes.registerType('fan-control', createFanControlNode);
};
