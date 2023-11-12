import {
  HA,
  HAFactory,
  NodeRedContextApi,
  NodeRedEnvMock,
  NodeRedFlowMock,
  NodeRedGlobalMock,
  NodeRedNodeMock
} from 'epdoc-node-red-hautil';
import { FanRunParams, NodeRedFlowFactory } from '../src';

function fnSend(mock: NodeRedGlobalMock, payload: any) {
  if (payload.target && payload.target.entity_id) {
    if (payload.service === 'turn_on') {
      mock.setState(payload.target.entity_id, 'on');
    } else if (payload.service === 'turn_off') {
      mock.setState(payload.target.entity_id, 'off');
    }
  }
}

describe('setFan', () => {
  const gMock = new NodeRedGlobalMock();
  const oMock: NodeRedContextApi = {
    env: new NodeRedEnvMock(),
    flow: new NodeRedFlowMock(),
    node: new NodeRedNodeMock()
  };
  const factory = new NodeRedFlowFactory(gMock);
  const haFactory = new HAFactory(gMock);

  describe('lightning on', () => {
    gMock.setStates({
      'input_boolean.lightning': {
        state: 'on'
      },
      'switch.away_room': {
        state: 'on'
      },
      'fan.away_room': {
        state: 'on'
      }
    });
    oMock.node.warn = (msg) => {
      // console.log(msg);
    };
    let ha: HA = haFactory.make();
    let fanCtrl = factory.makeFanControl(oMock);

    it('turn off', (done) => {
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
          expect(gMock.getState('fan.away_room')).toEqual('off');
          done();
        });
    });
  });
  describe('entity data', () => {
    gMock.setStates({
      'input_boolean.lightning': {
        state: 'off'
      },
      'switch.away_room': {
        state: 'on'
      },
      'fan.away_room': {
        state: 'on'
      }
    });
    let ha: HA = haFactory.make();
    let fanCtrl = factory.makeFanControl(oMock);

    it('already on', (done) => {
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
    });
  });
  describe('entity data', () => {
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
        .options(params)
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
    });
  });
});
