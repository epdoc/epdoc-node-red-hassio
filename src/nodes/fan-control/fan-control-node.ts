import { NodeDone, NodeSend } from 'epdoc-node-red-hautil';
import { NodeMessage } from 'node-red';
import NodeRedContextService from '../context-service';
import { RED } from '../globals';
import { createControllerDependencies } from '../helpers';
import TypedInputService from '../typed-input-service';
import { BaseNode } from '../types';
import { FanController, FanControllerConstructor } from './fan-controller';
import { FanControlNodeConfig } from './types';

export interface FanControlNode extends BaseNode {
  config: FanControlNodeConfig;
}

export function fanControlNode(this: FanControlNode, config: FanControlNodeConfig) {
  // console.log(`Starting fan-control with config: ${JSON.stringify(config)}`);
  // console.log(`Starting fan-control with opts: ${JSON.stringify(Object.keys(opts))} config: ${JSON.stringify(config)}`);
  // @ts-ignore
  RED.nodes.createNode(this, config);
  this.config = config;
  // @ts-ignore
  let node: FanControlNode = this as FanControlNode;

  // node.log(`fan-control config: ${JSON.stringify(toFanControlNodeConfig(config))}`);

  // const status = new Status({ node: node });

  // const nodeRedContextService = new NodeRedContextService(node);
  const controllerDeps = createControllerDependencies(this);

  const contextService = new NodeRedContextService(this);
  const params: FanControllerConstructor = {
    node: node,
    contextService: contextService,
    typedInputService: new TypedInputService({
      nodeConfig: node.config,
      context: contextService
    })
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
