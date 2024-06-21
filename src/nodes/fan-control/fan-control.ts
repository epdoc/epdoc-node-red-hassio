import { hautils } from '@epdoc/node-red-hautil';
import { NodeAPI } from 'node-red';
import { setRED } from '../globals';
import { hassio } from './../../index';
import { createFanControlNode } from './fan-control-node';

/**
 * Main function that we register with Node-RED that is then called by Node-RED
 * to register this Node.
 */

module.exports = function (RED: NodeAPI) {
  setRED(RED);
  RED.log.info(`${hassio.name()} version: ${hassio.version()}`);
  RED.log.info(`${hautils.name()} version: ${hautils.version()}`);
  RED.log.info(`Registering fan-control node version: ${hassio.version()}`);
  RED.nodes.registerType('fan-control', createFanControlNode);
};
