import { NodeRedContextApi, NodeRedEnvApi, NodeRedNodeApi } from '@epdoc/node-red-hautil';
import { NodeContextData } from 'node-red';
import { LocationHistory, LocationHistoryOpts } from './nodes/location-history/location-history';
import { PingContext, PingFlowInputPayload } from './nodes/ping-test/ping-context';

export function newNodeRedFlowFactory(global: NodeContextData): NodeRedFlowFactory {
  return new NodeRedFlowFactory(global);
}

export class NodeRedFlowFactory {
  protected _global: NodeContextData;

  constructor(global: NodeContextData) {
    this._global = global;
  }

  makieLocationHistory(contextApi: NodeRedContextApi, opts?: LocationHistoryOpts) {
    return new LocationHistory(this._global, contextApi, opts);
  }

  makePingContext(contextApi: NodeRedContextApi, payload?: PingFlowInputPayload) {
    return new PingContext(this._global, contextApi, payload);
  }
}

export class NodeRedNodeFactory {
  protected _global: NodeContextData;
  protected _flow: NodeContextData;
  protected _env: NodeRedEnvApi;

  constructor(global: NodeContextData, flow: NodeContextData, env: NodeRedEnvApi) {
    this._global = global;
    this._flow = flow;
    this._env = env;
  }

  makePingContext(node: NodeRedNodeApi, payload?: PingFlowInputPayload): PingContext {
    const contextApi: NodeRedContextApi = {
      flow: this._flow,
      env: this._env,
      node: node
    };
    return new PingContext(this._global, contextApi, payload);
  }
}
