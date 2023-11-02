import { describe, expect, it } from 'bun:test';
import { HA, NodeRedOptsMock } from 'epdoc-node-red-hautil';
import { setFan } from '../src';

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
    let ha = new HA(mock.opts);

    it('turn off', () => {
      return setFan(
        { fan: 'away_room', service: 'on' },
        (payload) => {
          expect(payload).toEqual({
            target: { entity_id: 'fan.away_room' },
            service: 'turn_off',
            domain: 'fan'
          });
        },
        mock.opts
      );
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

    it('already on', () => {
      return setFan(
        { fan: 'away_room', service: 'on' },
        (payload) => {
          expect(payload).toEqual({
            target: { entity_id: 'fan.away_room' },
            service: 'turn_off',
            domain: 'fan'
          });
        },
        mock.opts
      );
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

    it('timeout', () => {
      return setFan(
        { fan: 'away_room', service: 'on', timeout: 5000 },
        (payload) => {
          expect(payload).toEqual({
            target: { entity_id: 'fan.away_room' },
            service: 'turn_on',
            domain: 'fan'
          });
        },
        mock.opts
      );
    });
  });
});
