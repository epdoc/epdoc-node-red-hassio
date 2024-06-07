# @epdoc/node-red-hassio

<span style="color:gold">**THIS PROJECT IS STILL IN DEVELOPMENT AND SHOULD NOT BE USED IN PRODUCTION. 
All APIs and documentation are subject to change.**</span>

Custom Nodes for Home Assistant in Node-RED

## Developer Notes

[Notes on developing and installation for Node-RED](https://github.com/epdoc/node-red-hautil/blob/master/NODE-RED.md)

```bash
npm install -g gulp-cli
git clone @epdoc/node-red-hassio
cd node-red-hassio
npm install
npm test
npm run build
```

Although these nodes are for use with Home Assistant, they do not interface with
Home Assistant directly. This is because it was hard enough writing these nodes
as is, and without proper documentation on talking to Home Assistant or
communicating between Editor UI and underlying services, I wasn't ready to take
on this task.

# Custom Nodes

## Fan Control Node

A custom node for controlling a fan, includes the ability to set the speed of
the fan _after_ the fan has been turned on. This allows for a separate fan
on/off switch and speed control service.

See [the fan help page](./src/nodes/fan-control/help.html).

## Ping Test Node

See [the ping help page](./src/nodes/ping-test/help.html).

## Location History Node

See [the location history help page](./src/nodes/location-history/help.html).

# Appendix

## TODO

- Learn how to communicate between the editor UI and underlying services to, for example, get the list of fans.
- Directly implement home assistant calls to do things like retrieve the list of fans
