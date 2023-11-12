import {
  NodeRedContextApi,
  NodeRedEnvApi,
  NodeRedFlowApi,
  NodeRedGlobalApi,
  NodeRedNodeApi,
  isNodeRedContextApi
} from 'epdoc-node-red-hautil';
import { FanControl } from './fan-control';
import { LocationHistory, LocationHistoryOpts } from './location-history';
import { PingContext, PingFlowInputPayload } from './ping-context';

export class NodeRedFlowFactory {
  protected _global: NodeRedGlobalApi;

  constructor(global: NodeRedGlobalApi) {
    this._global = global;
  }

  makeFanControl(contextApi: NodeRedContextApi): FanControl {
    if (!isNodeRedContextApi(contextApi)) {
      throw new Error('FanControlFlowFactory not propertly configured');
    }
    return new FanControl(this._global, contextApi);
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

  makeFanControl(node: NodeRedNodeApi): FanControl {
    const contextApi: NodeRedContextApi = {
      flow: this._flow,
      env: this._env,
      node: node
    };
    return new FanControl(this._global, contextApi);
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
