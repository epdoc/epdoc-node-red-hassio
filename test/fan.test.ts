import { HA, NodeRedOptsMock } from 'epdoc-node-red-hautil';
import { setFan } from '../src';

function fnSend(mock: NodeRedOptsMock, payload: any) {
  if (payload.target && payload.target.entity_id) {
    if (payload.service === 'turn_on') {
      mock.setState(payload.target.entity_id, 'on');
    } else if (payload.service === 'turn_off') {
      mock.setState(payload.target.entity_id, 'off');
    }
  }
}

describe('setFan', () => {
  describe('lightning on', () => {
    const mock: NodeRedOptsMock = new NodeRedOptsMock();
    mock.setStates({
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
    mock.opts.node.warn = (msg) => {
      // console.log(msg);
    };
    let ha = new HA(mock.opts);

    it('turn off', (done) => {
      const params = {
        fan: 'away_room',
        service: 'on',
        shutOffEntityId: 'input_boolean.lightning'
      };
      setFan(params, (p) => fnSend(mock, p), mock.opts).then((resp) => {
        expect(mock.getState('fan.away_room')).toEqual('off');
        done();
      });
    });
  });
  describe('entity data', () => {
    const mock: NodeRedOptsMock = new NodeRedOptsMock();
    mock.setStates({
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
    let ha = new HA(mock.opts);

    it('already on', (done) => {
      const params = {
        fan: 'away_room',
        service: 'on',
        shutOffEntityId: 'input_boolean.lightning'
      };
      setFan(params, (p) => fnSend(mock, p), mock.opts).then((resp) => {
        expect(mock.getState('fan.away_room')).toEqual('on');
        done();
      });
    });
  });
  describe('entity data', () => {
    const mock: NodeRedOptsMock = new NodeRedOptsMock();
    mock.setStates({
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
    let ha = new HA(mock.opts);

    it('timeout', (done) => {
      const tStart = new Date().getTime();
      const params = {
        fan: 'away_room',
        service: 'on',
        timeout: 200,
        shutOffEntityId: 'input_boolean.lightning'
      };
      setFan(params, (p) => fnSend(mock, p), mock.opts).then((resp) => {
        const tDiff = new Date().getTime() - tStart;
        expect(mock.getState('fan.away_room')).toEqual('off');
        expect(tDiff).toBeGreaterThan(params.timeout);
        expect(tDiff).toBeLessThan(params.timeout + 10);
        done();
      });
    });
  });
});
