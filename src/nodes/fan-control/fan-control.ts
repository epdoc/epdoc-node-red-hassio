import { NodeAPI } from 'node-red';
import { setRED } from '../globals';
import { fanControlNode } from './fan-control-node';

module.exports = function (RED: NodeAPI) {
  setRED(RED);
  RED.log.info('Registering fan-control');
  RED.nodes.registerType('fan-control', fanControlNode);
};

// const configExample = {
//   id: 'e4cdb8465f203a1e',
//   type: 'pan-control',
//   z: 'fcf0c5de6eb4495c',
//   name: '',
//   x: 1430,
//   y: 940,
//   wires: [['f7736af523f7d0c9']]
// };
