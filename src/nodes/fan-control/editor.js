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
    let sEnd = '';
    if (this.setspeed === 'true') {
      sEnd += `, speed ${this.speed}`;
    }
    if (this.for > 0) {
      sEnd = ` for ${this.for} ${this.forUnits})`;
    }
    return this.name || `Turn ${this.fan} ${this.instruction === 'turn_on' ? 'on' : 'off'}${sEnd}`;
  },
  labelStyle: 'node_label_italic',
  defaults: {
    name: { value: '' },
    server: { value: '', required: true },
    fan: { value: '' },
    entityId: { value: '' },
    instruction: { value: 'turn_on' },
    setspeed: { value: false },
    speed: { value: 2 },
    debugEnabled: { value: false },
    for: { value: '0' },
    forUnits: { value: 'minutes' }
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
    $('#node-input-fan').typedInput({
      type: 'fan',
      types: [
        {
          value: 'fan',
          options: [
            { value: 'master_bedroom', label: 'Master Bedroom' },
            { value: 'away_room', label: 'Away Room' },
            { value: 'living_room', label: 'Living Room' },
            { value: 'flintstone', label: 'Flintstone' },
            { value: 'kitchen', label: 'Kitchen Fans' },
            { value: 'atrium', label: 'Atrium' },
            { value: 'pool_deck', label: 'Pool Deck' },
            { value: 'yoga_deck', label: 'Yoga Deck' },
            { value: 'jack_bedroom', label: 'Jack Bedroom' },
            { value: 'jill_bedroom', label: 'Jill Bedroom' },
            { value: 'jack_patio', label: 'Jack Patio' },
            { value: 'jill_patio', label: 'Jill Deck' },
            { value: 'apartment_bedroom', label: 'Apartment Bedroom' },
            { value: 'apartment_kitchen', label: 'Apartment Kitchen' },
            { value: 'granny_patio', label: 'Apartment Deck' }
          ]
        },
        'msg',
        'flow'
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
        'msg',
        'flow'
      ]
    });
    $('#node-input-setspeed').typedInput({
      type: 'setspeed',
      types: [
        {
          value: 'setspeed',
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
        'msg',
        'flow'
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
    $('#node-input-enabletimeout').typedInput({
      type: 'enabletimeout',
      types: [
        {
          value: 'enabletimeout',
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
    $('#node-input-setspeed').on('change', (event, type, value) => {
      // this.label();
      if (value === 'true') {
        $('.node-wrapper-speed').show();
      } else if (value === 'false') {
        $('.node-wrapper-speed').hide();
      }
    });
    $('#node-input-enabletimeout').on('change', (event, type, value) => {
      // this.label();
      if (value === 'true') {
        $('.node-wrapper-timeout').show();
      } else if (value === 'false') {
        $('.node-wrapper-timeout').hide();
      }
    });
  }
});
