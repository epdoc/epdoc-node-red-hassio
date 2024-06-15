let helper = require('node-red-node-test-helper');
// import { NodeRedGlobalMock } from 'epdoc-node-red-hautil';
// import helper from 'node-red-node-test-helper';
// import fanControlNode from '../src/fan-control/fan-control-node';
// let fanControlNode = require('../src/fan-control/fan-control-node');
let lowerNode = require('../dist/src/nodes/lower-case/lower-case');

// function fnSend(mock: NodeRedGlobalMock, payload: any) {
//   console.log(`payload: ${JSON.stringify(payload)}`);
//   if (payload.target && payload.target.entity_id) {
//     if (payload.service === 'turn_on') {
//       mock.setEntityStateValue(payload.target.entity_id, 'on');
//     } else if (payload.service === 'turn_off') {
//       mock.setEntityStateValue(payload.target.entity_id, 'off');
//     }
//   }
// }
helper.init(require.resolve('node-red'));
// console.log(helper.hasOwnProperty('load'));
// console.log(helper.hasOwnProperty('getNode'));

describe('lower-case-node', () => {
  beforeEach(function (done) {
    helper.startServer(done);
  });

  afterEach((done) => {
    helper.unload();
    helper.stopServer(done);
  });

  it('should be loaded', (done) => {
    var flow = [{ id: 'n1', type: 'lower-case', name: 'lower-case' }];
    helper.load(lowerNode, flow, function () {
      var n1 = helper.getNode('n1');
      try {
        expect(n1).toBeDefined();
        expect(n1).toHaveProperty('type', 'lower-case');
        done();
      } catch (err) {
        done(err);
      }
    });
  });

  it('should make payload lower case', (done) => {
    var flow = [
      { id: 'n1', type: 'lower-case', name: 'lower-case', wires: [['n2']] },
      { id: 'n2', type: 'helper' }
    ];
    helper.load(lowerNode, flow, function () {
      var n2 = helper.getNode('n2');
      var n1 = helper.getNode('n1');
      n2.on('input', (msg) => {
        try {
          expect(msg).toHaveProperty('payload', 'uppercase');
          done();
        } catch (err) {
          done(err);
        }
      });
      n1.receive({ payload: 'UpperCase' });
    });
  });
});
