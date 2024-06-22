const FANS = {
  master_bedroom: 'Master Bedroom',
  master_bath: 'Master Bath',
  away_room: 'Away Room',
  living_room: 'Living Room',
  flintstone: 'Flintstone',
  kitchen: 'Kitchen Fans',
  atrium: 'Atrium',
  pool_deck: 'Pool Deck',
  yoga_deck: 'Yoga Deck',
  jack_bedroom: 'Jack Bedroom',
  jill_bedroom: 'Jill Bedroom',
  jack_patio: 'Jack Patio',
  jill_patio: 'Jill Deck',
  apartment_bedroom: 'Apartment Bedroom',
  apartment_kitchen: 'Apartment Kitchen',
  granny_patio: 'Apartment Deck'
};
RED.nodes.registerType('fan-control', {
  category: 'function', //'home_assistant',
  color: '#a6bbcf',
  // color: NodeColor.HaBlue,
  inputs: 1,
  outputs: 2,
  outputLabels: ['done', 'call service'],
  icon: 'fan.svg',
  paletteLabel: 'Fan Control',
  label: function () {
    let s = '';
    const f = FANS[this.fan];
    if (this.instruction === 'turn_off') {
      s = `Turn ${f} Off`;
    } else if (this.setSpeed === 'true') {
      s = `Set ${f} speed to ${this.speed}`;
    } else if (this.instruction === 'turn_on') {
      s = `Turn ${f} On`;
    }
    if (this.for > 0) {
      s += `, turn off after ${this.for}${this.forUnits.charAt(0)}`;
    }
    return this.name || s;
  },
  labelStyle: 'node_label_italic',
  defaults: {
    name: { value: '' },
    server: { value: 'Home Assistant' },
    fan: { value: '' },
    // entityId: { value: '' },
    instruction: { value: 'turn_on' },
    setSpeed: { value: false },
    speed: { value: 2 },
    timeoutEnabled: { value: false },
    for: { value: '0' },
    forUnits: { value: 'minutes' },
    debugEnabled: { value: false }
  },
  // oneditsave: () => {
  //   this.name = $('#node-input-name').typedInput('value');
  //   this.server = $('#node-input-server').typedInput('value');
  //   this.fan = $('#node-input-fan').typedInput('value');
  //   this.instruction = $('#node-input-instruction').typedInput('value');
  //   this.setspeed = $('#node-input-setspeed').typedInput('value');
  //   this.for = $('#node-input-for').typedInput('value');
  //   this.forUnits = $('#node-input-forUnits').typedInput('value');
  //   this.debugEnabled = $('#node-input-debugEnabled').typedInput('value');
  // },
  oneditprepare: () => {
    const fanOpts = Object.keys(FANS).map((key) => {
      return { value: key, label: FANS[key] };
    });
    $('#node-input-fan').typedInput({
      type: 'fan',
      types: [
        {
          value: 'fan',
          options: fanOpts
        },
        'msg'
      ]
    });
    $('#node-input-instruction').typedInput({
      type: 'instruction',
      types: [
        {
          value: 'instruction',
          options: [
            { value: 'turn_on', label: 'On' },
            { value: 'turn_off', label: 'Off' }
          ]
        },
        'msg'
      ]
    });
    $('#node-input-setSpeed').typedInput({
      type: 'setSpeed',
      types: [
        {
          value: 'setSpeed',
          options: [
            { value: 'true', label: 'Set speed to' },
            { value: 'false', label: 'Leave speed as-is' }
          ]
        }
      ]
    });
    $('#node-input-speed').typedInput({
      type: 'speed',
      types: [
        {
          value: 'speed',
          options: [
            { value: '1', label: '1' },
            { value: '2', label: '2' },
            { value: '3', label: '3' },
            { value: '4', label: '4' },
            { value: '5', label: '5' },
            { value: '6', label: '6' }
          ]
        },
        'msg'
      ]
    });
    $('#node-input-for').typedInput({
      type: 'for',
      types: ['num', 'msg', 'flow']
    });
    $('#node-input-forUnits').typedInput({
      type: 'forUnits',
      types: [
        {
          value: 'forUnits',
          options: [
            { value: 'milliseconds', label: 'Milliseconds' },
            { value: 'seconds', label: 'Seconds' },
            { value: 'minutes', label: 'Minutes' },
            { value: 'hours', label: 'Hours' },
            { value: 'days', label: 'Days' }
          ]
        }
      ]
    });
    $('#node-input-timeoutEnabled').typedInput({
      type: 'timeoutEnabled',
      types: [
        {
          value: 'timeoutEnabled',
          options: [
            { value: 'true', label: 'turn fan off after' },
            { value: 'false', label: 'leave fan on' }
          ]
        }
      ]
    });
    $('#node-input-instruction').on('change', (event, type, value) => {
      // this.label();
      if (value === 'turn_on') {
        $('.node-wrapper-on').show();
      } else if (value === 'turn_off') {
        $('.node-wrapper-on').hide();
      }
    });
    $('#node-input-setSpeed').on('change', (event, type, value) => {
      // this.label();
      if (value === 'true') {
        $('.node-wrapper-speed').show();
      } else if (value === 'false') {
        $('.node-wrapper-speed').hide();
      }
    });
    $('#node-input-timeoutEnabled').on('change', (event, type, value) => {
      // this.label();
      if (value === 'true') {
        $('.node-wrapper-timeout').show();
      } else if (value === 'false') {
        $('.node-wrapper-timeout').hide();
      }
    });
  }
});
