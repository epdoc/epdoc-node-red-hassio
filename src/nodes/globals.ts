import { NodeAPI } from 'node-red';

export let RED: NodeAPI;

export function setRED(val: NodeAPI): void {
  RED = val;
  // console.log(`setRED keys: ${JSON.stringify(Object.keys(RED))}`);
}

/*
const ObjectKeysOfRED = [
  'nodes',
  'log',
  'settings',
  'events',
  'hooks',
  'util',
  'version',
  'require',
  'import',
  'comms',
  'plugins',
  'library',
  'httpNode',
  'httpAdmin',
  'server',
  'auth',
  '_'
];
*/
