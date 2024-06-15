import {
  HA,
  NodeRedContextApi,
  NodeRedEnvMock,
  NodeRedFlowMock,
  NodeRedGlobalMock,
  NodeRedNodeMock,
  newHAFactory
} from '@epdoc/node-red-hautil';
import { NodeTestHelper } from 'node-red-node-test-helper';
import { NodeRedFlowFactory } from '../src';
import * as fanControlNode from '../src/nodes/fan-control/fan-control';
import { FanControlNodeConfig } from '../src/nodes/fan-control/types';

// let helper = require('node-red-node-test-helper');
// import { NodeRedGlobalMock } from 'epdoc-node-red-hautil';
// import helper from 'node-red-node-test-helper';
// import fanControlNode from '../src/fan-control/fan-control-node';
// let fanControlNode = require('../dist/src/nodes/fan-control/fan-control');

function fnSend(mock: NodeRedGlobalMock, payload: any) {
  console.log(`payload: ${JSON.stringify(payload)}`);
  if (payload.target && payload.target.entity_id) {
    if (payload.service === 'turn_on') {
      mock.setEntityStateValue(payload.target.entity_id, 'on');
    } else if (payload.service === 'turn_off') {
      mock.setEntityStateValue(payload.target.entity_id, 'off');
    }
  }
}

const helper = new NodeTestHelper();
helper.init(require.resolve('node-red'));
// console.log(helper.hasOwnProperty('load'));
// console.log(helper.hasOwnProperty('getNode'));

describe('fan-control node', () => {
  beforeEach(function (done) {
    helper.startServer(done);
  });

  afterEach(function (done) {
    helper.unload();
    helper.stopServer(done);
  });

  it('should be loaded', (done) => {
    let flow = [{ id: 'n1', type: 'fan-control', name: 'fan-control' }];
    // console.log(`flow ${JSON.stringify(flow)}`);
    helper.load(fanControlNode, flow, () => {
      let n1 = helper.getNode('n1');
      try {
        expect(n1).toBeDefined();
        expect(n1).toHaveProperty('name', 'fan-control');
        done();
      } catch (err) {
        done(err);
      }
    });
  }, 1000);
});


describe('fan-control Node', () => {
  describe('lightning on', () => {
    const gMock = new NodeRedGlobalMock();
    // @ts-ignore
    const oMock: NodeRedContextApi = {
      env: new NodeRedEnvMock(),
     // @ts-ignore
     flow: new NodeRedFlowMock(),
      node: new NodeRedNodeMock()
    };
    // @ts-ignore
    const factory = new NodeRedFlowFactory(gMock);
    // @ts-ignore
    const haFactory =  newHAFactory(gMock);
    gMock
      .setEntity('input_boolean.lightning', {
        entity_id: 'input_boolean.lightning',
        state: 'on'
      })
      .setEntity('switch.away_room', {
        entity_id: 'switch.away_room',
        state: 'on',
        attributes: { friendly_name: 'Away Room Fan' }
      })
      .setEntity('fan.away_room', {
        entity_id: 'fan.away_room',
        state: 'on'
      })
      .setEntity('fan.workshop', {
        entity_id: 'fan.workshop',
        state: 'off'
      });
    oMock.node.warn = (msg) => {
      // console.log(msg);
    };
    let ha: HA = haFactory.make();
    let fanCtrl = factory.makeFanControl(oMock);

    it('turn off', (done) => {
      const config:FanControlNodeConfig = {
        server: 'xxx'
      }
      const params = {
        fan: 'away_room',
        service: 'on',
        shutOffEntityId: 'input_boolean.lightning'
      };
      fanCtrl.fnSend = (p) => {
        fnSend(gMock, p);
      };
      fanCtrl
        .fan('away_room')
        .on()
        .shutoff('input_boolean.lightning')
        .run()
        .then((resp) => {
          const entity = ha.entity('switch.away_room');
          // console.log(`entity: ${entity.stringify()}`);
          expect(entity.entityId).toEqual('switch.away_room');
          expect(entity.name).toEqual('Away Room Fan');
          // console.log(`Entity: ${ha.entity('fan.away_room').stringify()}`);
          expect(gMock.getState('fan.away_room')).toEqual('off');
          expect(ha.entity('fan.away_room').isOff()).toEqual(true);
          done();
        });
    }, 1000);
  });
  describe('entity data', () => {
    const gMock = new NodeRedGlobalMock();
    // @ts-ignore
    const haFactory = newHAFactory(gMock);
    // @ts-ignore
    const factory = new NodeRedFlowFactory(gMock);
    const oMock: NodeRedContextApi = {
      env: new NodeRedEnvMock(),
    // @ts-ignore
    flow: new NodeRedFlowMock(),
      node: new NodeRedNodeMock()
    };
    gMock
      .setEntity('input_boolean.lightning', { state: 'off' })
      .setEntity('switch.away_room', {
        entity_id: 'switch.away_room',
        state: 'on',
        attributes: { friendly_name: 'Away Room Fan' }
      })
      .setEntity('fan.away_room', { state: 'on' });
    let ha: HA = haFactory.make();
    let fanCtrl = factory.makeFanControl(oMock);

    it('already on', (done) => {
      // console.log(JSON.stringify(ha.entity('switch.away_room')));
      // console.log(JSON.stringify(ha.entity('fan.away_room')));

      const params: FanRunParams = {
        fan: 'away_room',
        service: 'on',
        shutOffEntityId: 'input_boolean.lightning',
        debug: true
      };
      fanCtrl.fnSend = (p) => {
        fnSend(gMock, p);
      };
      fanCtrl.run(params).then((resp) => {
        expect(gMock.getState('fan.away_room')).toEqual('on');
        done();
      });
    }, 1000);
  });
  describe('entity data', () => {
    const gMock = new NodeRedGlobalMock();
    // @ts-ignore
    const haFactory = newHAFactory(gMock);
    // @ts-ignore
    const factory = new NodeRedFlowFactory(gMock);
    const oMock: NodeRedContextApi = {
      env: new NodeRedEnvMock(),
    // @ts-ignore
    flow: new NodeRedFlowMock(),
      node: new NodeRedNodeMock()
    };
    gMock.setStates({
      'input_boolean.lightning': {
        state: 'off'
      },
      'switch.away_room': {
        state: 'off'
      },
      'fan.away_room': {
        state: 'off'
      }
    });
    let ha: HA = haFactory.make();
    let fanCtrl = factory.makeFanControl(oMock);
    fanCtrl.fnSend = (p) => {
      fnSend(gMock, p);
    };

    it('timeout', (done) => {
      const tStart = new Date().getTime();
      const params: FanRunParams = {
        fan: 'away_room',
        service: 'on',
        timeout: 200,
        shutOffEntityId: 'input_boolean.lightning'
      };
      fanCtrl
        .setPayloadConfig(params)
        .run()
        .then((resp) => {
          const tDiff = new Date().getTime() - tStart;
          expect(gMock.getState('fan.away_room')).toEqual('off');
          // @ts-ignore
          expect(tDiff).toBeGreaterThan(params.timeout - 1);
          // @ts-ignore
          expect(tDiff).toBeLessThan(params.timeout + 10);
          done();
        });
    }, 1000);
  });
  
