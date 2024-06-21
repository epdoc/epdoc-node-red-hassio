import { NodeAPI } from 'node-red';
import pkg from '../../../package.json';
import { setRED } from '../globals';
import { createPingTestNode } from './ping-test-node';

module.exports = function (RED: NodeAPI) {
  setRED(RED);
  RED.log.info(`Registering ping-test node version: ${pkg.version}`);
  RED.nodes.registerType('ping-test', createPingTestNode);
};
