import { NodeDone, NodeSend } from '@epdoc/node-red-hautil';
import { NodeMessage } from 'node-red';
import NodeRedContextService from '../context-service';
import { RED } from '../globals';
import { createControllerDependencies } from '../helpers';
import TypedInputService from '../typed-input-service';
import { BaseNode } from '../types';
import { PingTestController, PingTestControllerConstructor } from './ping-test-controller';
import { PingTestNodeConfig } from './types';

export interface PingTestNode extends BaseNode {
  config: PingTestNodeConfig;
}

export function createPingTestNode(this: PingTestNode, config: PingTestNodeConfig) {
  // console.log(`Starting ping-test with config: ${JSON.stringify(config)}`);
  // console.log(`Starting ping-test with opts: ${JSON.stringify(Object.keys(opts))} config: ${JSON.stringify(config)}`);
  // @ts-ignore
  RED.nodes.createNode(this, config);
  this.config = config;
  // @ts-ignore
  let node: PingTestNode = this as PingTestNode;

  // node.log(`ping-test config: ${JSON.stringify(toPingTestNodeConfig(config))}`);

  // const status = new Status({ node: node });

  // const nodeRedContextService = new NodeRedContextService(node);
  const controllerDeps = createControllerDependencies(this);

  const contextService = new NodeRedContextService(this);
  const params: PingTestControllerConstructor = {
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

  const tester = new PingTestController(params);

  const processMsg = async (msg: NodeMessage, send: NodeSend, done: NodeDone) => {
    try {
      tester.run(msg, send, done);
      // node.log(`Processing ping-test message: ${msg.payload}`);

      // node.log(`config: ${JSON.stringify(config)}`);
      // msg.payload = 'Processed ping-test message';
      // fanCtrl.setMessage(msg, send, done);
      send(msg);
      // const fanCtrl = new PingTestController(node, msg, send, done);
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
    node.log('ping-test done');
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
