import {
  NodeRedContextApi,
  NodeRedEnvApi,
  NodeRedFlowApi,
  NodeRedGlobalApi,
  NodeRedNodeApi
} from 'epdoc-node-red-hautil';
import { LocationHistory, LocationHistoryOpts } from './nodes/location-history/location-history';
import { PingContext, PingFlowInputPayload } from './nodes/ping-test/ping-context';

export function newNodeRedFlowFactory(global: NodeRedGlobalApi): NodeRedFlowFactory {
  return new NodeRedFlowFactory(global);
}

export class NodeRedFlowFactory {
  protected _global: NodeRedGlobalApi;

  constructor(global: NodeRedGlobalApi) {
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
  protected _global: NodeRedGlobalApi;
  protected _flow: NodeRedFlowApi;
  protected _env: NodeRedEnvApi;

  constructor(global: NodeRedGlobalApi, flow: NodeRedFlowApi, env: NodeRedEnvApi) {
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
