# epdoc-node-red-hassio

<span style="color:gold">**THIS PROJECT IS STILL IN DEVELOPMENT AND SHOULD NOT BE USED IN PRODUCTION. 
All APIs and documentaion are subject to change.**</span>

Custom Nodes for Home Assistant in Node-RED

## Developer Notes

THIS PROJECT IS STILL IN DEVELOPMENT and is not ready for public consumption.

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
npm install -g gulp-cli
git clone epdoc-node-red-hautil
cd epdoc-node-red-hautil
bun install
bun test
bun run build
```

## Installation and Use

Perhaps the most predictable way to install this package with Home Assistant is
to manually add this dependency to the Node-RED `package.json` file and restart
Node-RED. Node-RED is restarted from _Settings > Add-ons > Node-Red_. The
restart should cause the module to be installed and available. For module
updates you can edit the version number in `package.json`, delete the
corresponding folder under `node_modules`, then restart Node-RED. The Node-RED
add-on will install the missing packages as part of it's startup procedure.

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

A convenient way of making these modules available in [Function
Nodes](https://nodered.org/docs/user-guide/writing-functions) is to initialize
them in a launch-time script. Here is an example of such a script. Paste this
code into a new Function Node and use an [Inject
Node](https://nodered.org/docs/user-guide/nodes#inject) to execute the function.
The inject node should be set to _inject once_, after maybe 3 seconds.


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
lib.utilFactory = lib.hassio.NodeRedFlowFactory(global);

global.set('epdoc', lib);
return msg;
```

This can be shortened using this supplied module loading function.

```typescript
const modules = {
    util: 'epdoc-util',
    timeutil: 'epdoc-timeutil',
    hassio: 'epdoc-node-red-hassio',
    hautil: 'epdoc-node-red-hautil'
};
const lib = global.get('epdoc-node-red-hautil').loadModules(global,modules);
lib.utilFactory = lib.hassio.newNodeRedFlowFactory(global);
if( lib.load_errors.length ) {
    node.warn(`Error loading modules ${lib.load_errors.join(', ')}`);
}
global.set('epdoc',lib);
```

And finally, to use the modules in Function Nodes, it's simply a matter of
accessing the global context to get the module. In this first example, the
Function Node has two outputs, with the 2nd output wired to a [Call Service
node](https://zachowj.github.io/node-red-contrib-home-assistant-websocket/node/call-service.html).


```javascript
const lib = global.get("epdoc");
const payload = lib.hautil.newLightService('master_bedroom').on().payload();
node.send([null,{payload:payload}]);
node.send([msg,null]);
node.done();
```
Also
```javascript
const lib = global.get("epdoc");
const ha = lib.haFactory.make();
node.warn( `Living room light is ${ha.entity('light.living_room').value()}` );
```
Or
```javascript
const lib = global.get("epdoc");
const fanControl = lib.utilFactory.makeFanControl({env:env,flow:flow,node:node});
```

Unfortunately there is no code completion for these imported modules from within
Node-RED's Function Node editor.

You can find a more exhaustive and OUTDATED discussion of various ways to use your own
libraries in Node-RED [here](./NODE-RED.md).

