import { NodeDone, NodeSend } from '@epdoc/node-red-hautil';
import { NodeMessage } from 'node-red';
import { RED } from '../globals';
import { createControllerDependencies } from '../helpers';
import { BaseNode } from '../types';
import { FanController, FanControllerConstructor } from './fan-controller';
import { FanControlNodeConfig } from './types';

export interface FanControlNode extends BaseNode {
  config: FanControlNodeConfig;
}

/**
 * Function is called whenever a new instance of the node is created, along with
 * any config that is set in the UI. Creates a FanController instance, which
 * handles any input messages by calling the FanController's run method.
 * @param this The object that Node-RED keeps track of and uses to access this
 * Node.
 * @param config The instance properties set in the flow editor (e.g. fanId,
 * on/off, speed, server).
 */
export function createFanControlNode(this: FanControlNode, config: FanControlNodeConfig) {
  console.log(`Creating fan-control node with config: ${JSON.stringify(config)}`);

  // @ts-ignore Initialize the features shared by all nodes
  RED.nodes.createNode(this, config);
  this.config = config;
  // @ts-ignore
  let node: FanControlNode = this as FanControlNode;

  // if (config.debugEnabled) {
  //   node.log(`fan-control config: ${JSON.stringify(toFanControlNodeConfig(config))}`);
  // }
  // const status = new Status({ node: node });

  // const nodeRedContextService = new NodeRedContextService(node);

  // Helper routine to create dependencies for our controller
  const deps = createControllerDependencies(this);

  const params: FanControllerConstructor = {
    node: node,
    contextService: deps.nodeRedContextService,
    typedInputService: deps.typedInputService
  };

  // params.node.on(NodeEvent.Input, (p) => {
  //   console.log(`onInput ${JSON.stringify(p)}`);
  // });

  // const nodeContext = node.context();
  // const flowContext = node.context().flow;
  // const globalContext = node.context().global;
  // node.log(`context keys = ${JSON.stringify(nodeContext.keys())}`);
  // node.log(`flow keys = ${JSON.stringify(flowContext.keys())}`);
  // node.log(`global keys = ${JSON.stringify(globalContext.keys())}`);

  // Use a controller to do the grunt work
  const controller = new FanController(params);

  const processMsg = async (msg: NodeMessage, send: NodeSend, done: NodeDone) => {
    try {
      controller.run(msg, send, done);
      // node.log(`Processing fan-control message: ${msg.payload}`);

      // node.log(`config: ${JSON.stringify(config)}`);
      // msg.payload = 'Processed fan-control message';
      // fanCtrl.setMessage(msg, send, done);
      send(msg);
      // const fanCtrl = new FanController(node, msg, send, done);
      // fanCtrl.setUiConfig(config);
      // fanCtrl.setPayloadConfig(msg.payload);
      // fanCtrl.run().then((resp) => {
      //   fanCtrl.done();
      // });
    } catch (err) {
      console.log(err);
      done(err as Error);
    }
  };

  // RED.events.on('nodes:change', (arg: any) => {
  //   console.log(`nodes:change ${JSON.stringify(arg)}`);
  // });

  const done = () => {
    node.log('fan-control done');
  };

  // Register a listener that gets called whenever a message arrives at the node
  node.on('input', processMsg);
  // node.on('close', done);
}

// const configExample = {
//   id: 'e4cdb8465f203a1e',
//   type: 'pan-control',
//   z: 'fcf0c5de6eb4495c',
//   name: '',
//   x: 1430,
//   y: 940,
//   wires: [['f7736af523f7d0c9']]
// };
