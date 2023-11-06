import { NodeRedOptsMock } from 'epdoc-node-red-hautil';
import { isArray, isObject } from 'epdoc-util';
import { PingContext, PingFlowInputPayload, PingNodeInputItem } from '../src/ping-context';

describe('ping-context', () => {
  describe('data set 1', () => {
    const mock: NodeRedOptsMock = new NodeRedOptsMock();
    const input: PingFlowInputPayload = {
      id: 'mytest',
      name: 'My Test',
      data: [
        {
          timeout: 2000,
          hosts: ['google']
        },
        {
          timeout: 4000,
          hosts: ['apple']
        }
      ]
    };
    mock.db.flow.test = {};
    let ctx: PingContext;
    const tNow = new Date().getTime();
    let rounds = [
      {
        hosts: ['google'],
        responses: 0,
        timeout: 2000
      },
      {
        hosts: ['apple'],
        responses: 0,
        timeout: 4000
      }
    ];
    it('constructor', () => {
      ctx = new PingContext(mock.opts, input);
      expect(isObject(ctx)).toEqual(true);
      expect(ctx.short.id).toEqual(input.id);
      expect(ctx.short.name).toEqual(input.name);
      expect(ctx.short.busy).toEqual(true);
      expect(ctx.short.debug).toEqual(false);
      expect(ctx.short.busyAt).toBeGreaterThan(tNow);
      expect(ctx.short.busyAt).toBeLessThan(tNow + 100);
      expect(ctx.short.startDate).toBeGreaterThan(tNow);
      expect(ctx.short.startDate).toBeLessThan(tNow + 100);
      expect(ctx.short.loopsData).toEqual(rounds);
    });
    it('set busy', () => {
      ctx.setBusy();
      expect(ctx.busy).toEqual(true);
      expect(ctx.getPingHasResponded(0)).toEqual(false);
      expect(ctx.getPingAllResponded(0)).toEqual(false);
      expect(ctx.isFirstRound(0)).toEqual(true);
      expect(ctx.isLastRound(0)).toEqual(false);
    });
    it('get ping payload', () => {
      const expected = [
        {
          host: 'google',
          timeout: 2000,
          start_date: 1698964169728,
          id: 'mytest',
          name: 'My Test',
          round: 0
        }
      ];
      const p: PingNodeInputItem[] = ctx.getPingNodeInputPayload(0);
      expect(isArray(p)).toEqual(true);
      expect(p.length).toEqual(1);
      // @ts-ignore
      expect(p[0].host).toEqual(input.data[0].hosts[0]);
      // @ts-ignore
      expect(p[0].timeout).toEqual(input.data[0].timeout);
      expect(p[0].start_date).toBeGreaterThan(tNow);
      expect(p[0].start_date).toBeLessThan(tNow + 100);
      expect(p[0].id).toEqual(input.id);
      expect(p[0].name).toEqual(input.name);
      expect(p[0].loopIndex).toEqual(0);
    });
    it('test', () => {});
    it('test', () => {});
    it('test', () => {});
    it('test', () => {});
  });
  describe('data set 2', () => {
    const mock: NodeRedOptsMock = new NodeRedOptsMock();
    const input: PingFlowInputPayload = {
      id: 'mytest',
      name: 'My Test',
      data: [
        {
          timeout: 50,
          hosts: ['192.169.1.3', '192.169.1.2']
        },
        {
          timeout: 100,
          hosts: ['192.169.1.3', '192.169.1.2']
        },
        {
          timeout: 80,
          hosts: ['192.169.1.1', '192.169.1.3', '192.169.1.2']
        }
      ]
    };
    mock.db.flow.test = {};
    let ctx: PingContext;
    const tNow = new Date().getTime();
    const expectedRounds = [
      {
        hosts: ['192.169.1.3', '192.169.1.2'],
        responses: 0,
        timeout: 50
      },
      {
        hosts: ['192.169.1.3', '192.169.1.2'],
        responses: 0,
        timeout: 100
      },
      {
        hosts: ['192.169.1.1', '192.169.1.3', '192.169.1.2'],
        responses: 0,
        timeout: 80
      }
    ];

    it('constructor', () => {
      ctx = new PingContext(mock.opts, input);
      expect(isObject(ctx)).toEqual(true);
      expect(ctx.short.id).toEqual(input.id);
      expect(ctx.short.name).toEqual(input.name);
      expect(ctx.short.busy).toEqual(true);
      expect(ctx.short.debug).toEqual(false);
      expect(ctx.short.busyAt).toBeGreaterThan(tNow);
      expect(ctx.short.busyAt).toBeLessThan(tNow + 100);
      expect(ctx.short.startDate).toBeGreaterThan(tNow);
      expect(ctx.short.startDate).toBeLessThan(tNow + 100);
      expect(ctx.short.loopsData).toEqual(expectedRounds);
    });
  });
});
