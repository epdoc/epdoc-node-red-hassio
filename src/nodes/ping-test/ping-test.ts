import { NodeAPI } from 'node-red';
import { setRED } from '../globals';
import { createPingTestNode } from './ping-test-node';

module.exports = function (RED: NodeAPI) {
  setRED(RED);
  RED.log.info('Registering ping-test node');
  RED.nodes.registerType('ping-test', createPingTestNode);
};
