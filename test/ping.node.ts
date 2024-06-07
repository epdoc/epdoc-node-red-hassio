import { Milliseconds } from '@epdoc/timeutil';
import { delayPromise } from '@epdoc/typeutil';
import { HOST, PingNodeInputItem } from '../src';

// export type PingNodeOutputCb = (PingNodeOutputMsg) => {};
export type PingNodeOutputMsg = {
  ping: PingNodeInputItem;
  payload: false | Milliseconds;
};
export type PingNodePingTimeData = Record<HOST, Milliseconds>;

export class PingNode {
  data: PingNodePingTimeData;
  constructor(data: PingNodePingTimeData) {
    this.data = data;
  }

  public call(item: PingNodeInputItem): Promise<PingNodeOutputMsg> {
    const tStart = new Date().getTime();
    const tResponse: Milliseconds = this.data[item.host];
    let result: PingNodeOutputMsg = {
      ping: item,
      payload: false
    };
    return delayPromise(Math.min(this.data[item.host], item.timeout)).then((resp) => {
      const duration = new Date().getTime() - tStart;
      if (duration < item.timeout) {
        result.payload = duration;
      }
      return Promise.resolve(result);
    });
  }
}
