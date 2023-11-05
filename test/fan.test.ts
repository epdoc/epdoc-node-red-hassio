import { describe, expect, it } from 'bun:test';
import { HA, NodeRedOptsMock } from 'epdoc-node-red-hautil';
import { setFan } from '../src';

function fnSend(mock, payload) {
  if (payload.target && payload.target.entity_id) {
    if (payload.service === 'turn_on') {
      mock.db.global.homeassistant.states[payload.target.entity_id] = { state: 'on' };
    } else if (payload.service === 'turn_off') {
      mock.db.global.homeassistant.states[payload.target.entity_id] = { state: 'off' };
    }
  }
}

describe('setFan', () => {
  describe.only('lightning on', () => {
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
      const params = { fan: 'away_room', service: 'on', shutOffEntityId: 'input_boolean.lightning' };
      return setFan(params, (p) => fnSend(mock, p), mock.opts).then((resp) => {
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
      const params = { fan: 'away_room', service: 'on', shutOffEntityId: 'input_boolean.lightning' };
      return setFan(params, (p) => fnSend(mock, p), mock.opts).then((resp) => {
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
        state: 'off'
      },
      'fan.away_room': {
        state: 'off'
      }
    });
    let ha = new HA(mock.opts);

    it('timeout', (done) => {
      const params = { fan: 'away_room', service: 'on', timeout: 5000, shutOffEntityId: 'input_boolean.lightning' };
      return setFan(params, (p) => fnSend(mock, p), mock.opts).then((resp) => {
        expect(mock.getState('fan.away_room')).toEqua('on');
        done();
      });
    });
  });
});
