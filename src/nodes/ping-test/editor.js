RED.nodes.registerType('ping-test', {
  category: 'function',
  color: '#a6bbcf',
  defaults: {
    name: { value: '' }
  },
  inputs: 1,
  outputs: 1,
  icon: 'file.png',
  label: function () {
    return this.name || 'Ping Test';
  }
});
