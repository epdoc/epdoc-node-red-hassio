# epdoc-node-red-hassio

Personal-use libraries for use with [Node-RED](https://nodered.org/) and
[Home Assistant](https://www.home-assistant.io/).

 * A `setFan` function that is specific to my RF control of fans using both a
   [Bond Bridge](https://bondhome.io/product/bond-bridge/) to control speed (0
   to 6), and wall switches to decouple the fans from power when they are off. I
   do this to prevent mains noise from blowing the susceptible controllers on my
   Minka fans.
 * `LocationHistory` and `LocationMoving` classes that I use to monitor movement
   from our house, for gate automation purposes. _These are at a pre-release
   level of quality._
 * `PingContext` used in my Ping Test subflow for monitoring connections.

 @see [epdoc-node-red-hautil](https://github.com/jpravetz/epdoc-node-red-hautil)
 for developer notes and instructions on how to use this library with Node-RED.


## Dev Installation and Build

To install dependencies:

```bash
bun install
```

To test:

```bash
bun test
```

To build:

```bash
bun run build
```

To publish:

```bash
npm publish
```

This project was created using `bun init` in bun v1.0.7. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
