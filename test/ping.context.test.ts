import { NodeRedMessage, NodeRedOptsMock } from 'epdoc-node-red-hautil';
import { isObject } from 'epdoc-util';
import { PingContext, pingContextLib } from '../src/ping-context';

describe('ping-context', () => {
  const tStart = new Date().getTime();
  const mock: NodeRedOptsMock = new NodeRedOptsMock();
  mock.setFlow('lib', pingContextLib);
  let msg: NodeRedMessage = {
    payload: {
      data: [
        { timeout: 100, hosts: 'facebook' },
        { timeout: 100, hosts: ['google', 'apple'] }
      ]
    }
  };
  const responseTimes = {
    facebook: 200,
    google: 45,
    apple: 200
  };
  describe('setup', () => {
    it('setup', () => {
      let ctx = new PingContext(mock.opts);
      expect(isObject(ctx)).toEqual(true);
    });

    it('busy', (done) => {
      const lib = mock.opts.flow.get('lib');
      // const oldCtx = lib.newFlowContext().initFromStorage();
      // let pingNode = new PingNode(responseTimes);
      // mock.opts.node.send = (arr) => {
      //   expect(arr).toHaveLength(2);
      //   if (isArray(arr)) {
      //     expect(arr[0]).toBeNull();
      //     const item = arr[1];
      //     expect(item).toBeDefined();
      //     expect(isPingNodeInputItem(item)).toEqual(true);
      //     if (isPingNodeInputItem(item)) {
      //       pingNode.call(item as PingNodeInputItem).then((resp) => {
      //         const tNow = new Date().getTime();
      //         expect(tNow - tStart).toBeGreatherThan(100);
      //         expect(resp.payload).toEqual(false);
      //         if (isDict(msg)) {
      //           msg.payload = resp.payload;
      //         }
      //         done();
      //       });
      //     }
      //   }
      // };

      // if (oldCtx.busy && !oldCtx.busyTimeout()) {
      //   // skip right to output
      //   oldCtx.debug &&
      //     mock.opts.node.warn(`Already busy; ${oldCtx.connectionStatusAsString()}; exit subflow`);
      //   msg.payload = oldCtx.getReportPayload();
      //   mock.opts.node.send([msg, null]);
      // } else {
      //   // Replaces old short-term context with new short-term context
      //   const ctx = lib.newFlowContext().initFromPayload(msg.payload);
      //   ctx.debug &&
      //     mock.opts.node.warn(
      //       `Not busy; ${ctx.connectionStatusAsString()}; ping test ${JSON.stringify(
      //         ctx.getHost(0)
      //       )}`
      //     );

      //   msg.payload = ctx.pingPayload(0);
      //   mock.opts.node.send([null, msg]);
      // }
      //mock.opts.node.done();
      done();
    });
  });
  /*

  describe.skip('group1', () => {
    const ctx = mock.opts.flow.get('lib').newFromStorage();
    const ping = msg.ping;
    const round = ping.round;
    let msgs = ['Round ' + round];

    if (ctx.getPingHasResponded(round)) {
      ctx.debug &&
        mock.opts.node.warn(
          `Round ${round}; ignoring later reporting host ${ping.host}; response ${
            msg.payload ? msg.payload + ' ms' : 'timed out'
          }`
        );
      mock.opts.node.send([null, msg]);
    } else {
      mock.opts.node.send([msg, null]);
    }
    ctx.incPingHasResponded(round);

    mock.opts.node.done();
  });
  */
});
