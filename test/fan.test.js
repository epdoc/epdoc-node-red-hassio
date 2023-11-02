import { HA, setFan } from '../src';

describe('setFan', () => {
  describe('lightning on', () => {
    const gHA = {
      homeAssistant: {
        states: {
          'input_boolean.lightning': {
            state: 'on',
          },
          'switch.away_room': {
            state: 'on',
          },
          'fan.away_room': {
            state: 'on',
          },
        },
      },
    };
    let ha = new HA(gHA);
    function sendMsg(msg) {}
    function logCb(s) {
      console.log(s);
    }

    it('turn off', () => {
      return setFan(
        gHA,
        (payload) => {
          expect(payload).toEqual({
            target: { entity_id: 'fan.away_room' },
            service: 'turn_off',
            domain: 'fan',
          });
        },
        { fan: 'away_room', service: 'on' },
        { log: logCb },
      );
    });
  });
  describe('entity data', () => {
    const gHA = {
      homeAssistant: {
        states: {
          'input_boolean.lightning': {
            state: 'off',
          },
          'switch.away_room': {
            state: 'on',
          },
          'fan.away_room': {
            state: 'on',
          },
        },
      },
    };
    let ha = new HA(gHA);
    function sendMsg(msg) {}
    function logCb(s) {
      console.log(s);
    }
    it('already on', () => {
      return setFan(
        gHA,
        (payload) => {
          expect(payload).toEqual({
            target: { entity_id: 'fan.away_room' },
            service: 'turn_off',
            domain: 'fan',
          });
        },
        { fan: 'away_room', service: 'on' },
        { log: logCb },
      );
    });
  });
  describe('entity data', () => {
    const gHA = {
      homeAssistant: {
        states: {
          'input_boolean.lightning': {
            state: 'off',
          },
          'switch.away_room': {
            state: 'off',
          },
          'fan.away_room': {
            state: 'off',
          },
        },
      },
    };
    let ha = new HA(gHA);
    function sendMsg(msg) {}
    function logCb(s) {
      console.log(s);
    }
    it.skip('timeout', () => {
      return setFan(
        gHA,
        (payload) => {
          expect(payload).toEqual({
            target: { entity_id: 'fan.away_room' },
            service: 'turn_on',
            domain: 'fan',
          });
        },
        { fan: 'away_room', service: 'on', timeout: 5000 },
        { log: logCb },
      );
    });
  });
});
