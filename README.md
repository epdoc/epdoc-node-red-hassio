# epdoc-node-red-hautil

General purpose utilities for use with [Node-RED](https://nodered.org/) and
[Home Assistant](https://www.home-assistant.io/).

 * `Service` wrapper, to generate payloads for use with the Call Service node.
 * `HA` wrapper, to retrieve state from home assistant

## Developer Notes

This module was originally written in ES6 and transpiled using Babel to generate
a module that could be loaded using `require` or `import`. Soon thereafter it
was migrated to TypeScript (developer hint: this resulted in catching quite a
few bugs). It was also migrated to [Bun](https://bun.sh/) for package management
and unit testing, however the Typescript Compiler (tsc) is used for module
generation, due to limitations in bun's bundling options . 

OUTDATED SINCE MOVING TO TSC: Bun generates a different type of module that can only be loaded in
Node-RED using a [dynamic
import](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import),
as you will see in the next section.

```bash
git clone epdoc-node-red-hautil
cd epdoc-node-red-hautil
bun install
bun test
bun run build
```

## Installation and Use

Perhaps the most predictable way to install this package with Home Assistant is
to add this dependency to the Node-RED `package.json` file and restart Node-RED.
Node-RED is restarted from _Settings > Add-ons > Node-Red_. The restart should
cause the module to be installed and available. For module updates you can edit
the version number in `package.json`, delete the corresponding folder under
`node_modules`, then restart Node-RED.

```json
    "dependencies": {
        "epdoc-node-red-hassio": "^0.19.2",
        "epdoc-node-red-hautil": "^0.17.6",
        "epdoc-timeutil": "^2.3.6",
        "epdoc-util": "^0.5.1",
        ...
    }    
```

For convenience you can add the module to globals, so that you don't need
to specify the module in each `Function Node` where it is used.  Here are the
required changes to `/config/Node-RED/settings.json` for this to work:

```js
// Don't set module.exports yet
let settings = {

  ...
  
  functionGlobalContext: {
    // os:require('os'),
    "epdoc-util": require('epdoc-util'),
    "epdoc-timeutil": require('epdoc-timeutil'),
    "epdoc-node-red-hautil": require('epdoc-node-red-hautil'),
    "epdoc-node-red-hassio": require('epdoc-node-red-hassio')
  },

  ...

};

module.exports = settings;
```

A convenient way of making these modules available in Function Nodes is to
initialize them in a launch-time script. Here is an example of such a script.
Paste this code into a Function Node and use an inject node to execute the
function. The inject node should be set to _inject once_, after maybe 3 seconds.


```javascript
const names = {
    util: 'epdoc-util',
    timeutil: 'epdoc-timeutil',
    hassio: 'epdoc-node-red-hassio',
    hautil: 'epdoc-node-red-hautil'
};
const lib = {};
const fail = [];
Object.keys(names).forEach(key => {
    const name = names[key];
    lib[key] = global.get(name);
    if (!lib[key]) {
        fail.push(name);
    }
});
if (fail.length && flow.get('load_error') !== true) {
    flow.set('load_error', true);
    node.warn(`Error loading modules ${fail.join(', ')}`);
    lib.fail = true;
}
lib.haFactory = lib.hautil.newHAFactory(global);
lib.fanControlFactory = lib.hassio.newFanControlFactory(global);

global.set('epdoc', lib);
return msg;
```

And finally, to use the modules in [Function
Nodes](https://nodered.org/docs/user-guide/writing-functions), it's simply a
matter of accessing the global context to get the module. In this example, the
Function Node has two outputs, with the 2nd output wired to a [Call Service
node](https://zachowj.github.io/node-red-contrib-home-assistant-websocket/node/call-service.html).


```javascript
const lib = global.get("epdoc");
const payload = lib.hautil.newLightService('master_bedroom').on().payload();
node.send([null,{payload:payload}]);
node.send([msg,null]);
node.done();
```
Or
```javascript
const lib = global.get("epdoc");
const ha = lib.haFactory.newHA();
node.warn( `Living room light is ${ha.entity('light.living_room').value()}` );
```

Unfortunately there is no code completion for these imported modules from within
Node-RED's Function Node editor.

You can find a more exhaustive and OUTDATED discussion of various ways to use your own
libraries in Node-RED [here](./NODE-RED.md).

## Service Class

The
[Service](https://github.com/jpravetz/epdoc-node-red-hautil/blob/master/src/service.ts)
object is used to build a payload that can be passed to the [Call Service
node](https://zachowj.github.io/node-red-contrib-home-assistant-websocket/node/call-service.html).
Provided too are a number of subclasses for specific types of entities,
including `SwitchService`, `LightService`, `AlarmService`, `CoverService`,
`FanService` and, finally `FanSpeed6Service`, which is a 6-speed fan that uses a
[Bond Bridge](https://bondhome.io/product/bond-bridge/) to set the fan speed and
a smart switch to turn the fans on and off. 

There is the possibility for many more subclasses to be written, or you can
build your service payload directly using the base `Service` class, or one of
the other subclasses. 

The following shows the code for a [function
node](https://nodered.org/docs/user-guide/writing-functions) that uses three
equivalent implementations to tell a
[Cover](https://www.home-assistant.io/integrations/cover/) to stop.

```js
let payload = newService('cover.garage').service('stop_cover').payload();

payload = new CoverService('garage').stop().payload();

let payloadBuilder = newCoverService('garage');
payload = payloadBuilder.stop().payload();
msg.payload = payload;
return msg;
```

The following function node code creates a payload that can be used to set a
light's brightness to 50%.

```js
msg.payload = new LightService('bedroom').percentage(50).payload();
return msg;
```

The following function node code shows several ways to create a payload that
turns a light on.

```js
// In this example we directly use the LightService, 
// which will set the domain to `light` for us. 
// The LightService is a subclass of SwitchService.
msg.payload = new LightService('bedroom').on().payload();

// In this example we use the SwitchService, but change it's default
// domain from `switch` to `light` by specifying the full `entity_id`.
msg.payload = new SwitchService('light.bedroom').on().payload();

// Override the default domain using the `domain` method.
msg.payload = new SwitchService('bedroom').domain('light').on().payload();
return msg;
```

## HA Class

The
[HA](https://github.com/jpravetz/epdoc-node-red-hautil/blob/master/src/service.tsbond)
class is again meant for use in Function Nodes. It provides a wrapper for a Home
Assistant instance, and has methods to access the state of Home Assitant
entities.

Example retrieves the state of a light.

```js
const gHA = global.get('homeassistant');

const ha = new HA(gHA);
const lightEntity = ha.entity('light.bedroom');
const isOn = lightEntity.isOn();
node.warn(`The ${lightEntity.id} is ${isOn?'on':'off'}`)
```

### HA retrieveSensorsData method

This method takes a dictionary containing an `id` field and optional `type`
field and retrieves sensor data for the listed sensors. This is a shortcut that
you might use when you have multiple sensors that you efficiently want to get
data for, and you need to access that data more than once.

```js
const gHA = global.get('homeassistant');
const ha = new HA(gHA);

const sensorDict = {
  sensor1: { id: 'input_boolean.evening', type: 'boolean' },
  sensor2: { id: 'sensor.outdoor_temperature', type: 'number' }
};

ha.retrieveSensorsData(sensorDict);
if( sensorDict.sensor1.on ) {
  console.log('It is the evening');
}
if( sensorDict.sensor2.val > 30 ) {
  console.log('It is hot today');
}
```

The above code is equivalent to the following:

```js
const gHA = global.get('homeassistant');
const ha = new HA(gHA);

if( ha.entity('input_boolean.evening').isOn() ) {
  console.log('It is the evening');
}
if( ha.entity('sensor.outdoor_temperature').asNumber() > 30 ) {
  console.log('It is hot today');
}
```