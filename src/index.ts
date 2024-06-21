export * from './factory';
export * from './index';
export * from './nodes/fan-control/fan-control';
export * from './nodes/location-history';
export * from './nodes/ping-test/ping-context';
import pkg from '../package.json';

export const hassio = {
  name: () => {
    return pkg.name;
  },
  version: () => {
    return pkg.version;
  },
  description: () => {
    return pkg.description;
  }
};
