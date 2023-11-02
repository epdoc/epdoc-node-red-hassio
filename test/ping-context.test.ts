import { describe, expect, it } from 'bun:test';
import { NodeRedOptsMock } from 'epdoc-node-red-hautil';
import { isObject } from 'epdoc-util';
import { PingContext } from '../src/ping-context';

describe('ping-context', () => {
  describe('group1', () => {
    const mock: NodeRedOptsMock = new NodeRedOptsMock();

    it('constructor', () => {
      let ctx = new PingContext(mock.opts);
      expect(isObject(ctx)).toEqual(true);
    });
  });
});
``;
