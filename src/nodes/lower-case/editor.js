RED.nodes.registerType('lower-case', {
  category: 'function',
  color: '#a6bbcf',
  defaults: {
    name: { value: '' }
  },
  inputs: 1,
  outputs: 1,
  icon: 'file.png',
  label: function () {
    return this.name || 'lower-case';
  }
});
