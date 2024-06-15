import pkg from '../package.json';

export * from './factory';
export * from './index';
export * from './nodes/fan-control/fan-control';
export * from './nodes/location-history';
export * from './nodes/ping-test/ping-context';

export function version(): string {
  return pkg.version;
}
