import { Milliseconds, durationUtil } from '@epdoc/timeutil';
import {
  Entity,
  EntityId,
  HA,
  NodeRedLogFunction,
  ServicePayload,
  newFanSpeed6Service,
  newSwitchService
} from 'epdoc-node-red-hautil';
import { isNonEmptyString } from 'epdoc-util';
import { NodeMessage } from 'node-red';
import { MessageHandler } from '../message-handler';
import { NodeDone, NodeSend } from '../nodes';
import { BaseNode } from '../types';
import { FanControlNode } from './fan-control-node';
import { FanControlParams } from './fan-control-params';

export type FanMessageHandlerOpts = {
  params: FanControlParams;
};
type FanControlLogFunctions = {
  debug: NodeRedLogFunction;
};

export class FanMessageHandler extends MessageHandler {
  protected step = 0;
  protected node: FanControlNode;
  protected params: FanControlParams;
  protected log: FanControlLogFunctions = {
    debug: (...args) => {}
  };
  protected ha: HA;
  protected shutoff = false;
  protected bTurnedOn = false;

  constructor(node: BaseNode, msg: NodeMessage, send: NodeSend, done: NodeDone, opts: FanMessageHandlerOpts) {
    super(node, msg, send, done);
    this.params = opts.params;
    if (this.params.debugEnabled) {
      this.log.debug = (msg) => {
        this.node.log(`[${this.id}.${this.step}] ${msg}`);
      };
      this.log.debug('Debug enabled');
    }
    this.ha = new HA(this.node.context().global, this.params.server);
    if (this.ha) {
      if (this.isValid()) {
        if (isNonEmptyString(this.params.shutoffEntityId)) {
          let entity: Entity = this.ha.entity(this.params.shutoffEntityId);
          if (entity.isValid() && entity.isOn()) {
            this.shutoff = true;
          } else {
            this.node.error(`Entity ${this.params.shutoffEntityId} not found`);
          }
        }
      } else {
        this.node.error(`Fan entities not found for ${this.params.shortId}`);
      }
    } else {
      this.node.error(
        `No homeassistant instance found. Make sure to 'Enable global context store' when you configure your Home Assistant server.`
      );
    }
  }

  init(): this {
    return this;
  }

  stop(): this {
    if (this.hasTimers()) {
      this.log.debug(`${this.fanId} STOPPED`);
      this.status.red().dot().text(`${this.fanName()} STOPPED`).update();
    }
    return super.stop();
  }

  isValid(): boolean {
    return Entity.isEntity(this.fan()) && Entity.isEntity(this.switch());
  }

  fan(): Entity {
    return this.ha.entity('fan.' + this.params.shortId);
  }

  fanName(): string {
    const entity = this.ha.entity('fan.' + this.params.shortId);
    return entity.name ? entity.name : entity.entityId;
  }

  get fanId(): EntityId {
    return this.fan().entityId || 'undefined';
  }

  switch(): Entity {
    return this.ha.entity('fan.' + this.params.shortId);
  }

  get switchId(): EntityId {
    return this.switch().entityId || 'undefined';
  }

  sendPayload(payload: any): this {
    this.log.debug(`send ${JSON.stringify(payload)}`);
    this.send([null, { payload: payload }]);
    return this;
  }

  protected turnOn(reason: string): this {
    this.log.debug(`${this.switchId} turn on because ${reason}`);
    let payload = newSwitchService(this.switchId).on().payload();
    this.sendPayload(payload);
    this.bTurnedOn = true;
    this.status.blue().dot().text(`${this.fanName()} on`).update();
    return this;
  }

  protected setSpeed(reason?: string): this {
    this.log.debug(`${this.fanId} set speed to ${this.params.speed} (${reason})`);
    let payload: ServicePayload = newFanSpeed6Service(this.params.shortId).speed(this.params.speed).payload();
    this.sendPayload(payload);
    this.status.blue().dot().text(`${this.fanName()} speed ${this.params.speed}`).update();
    return this;
  }

  protected turnOff(reason: string): this {
    this.log.debug(`${this.fanId} turn off because ${reason}`);
    let payload: ServicePayload = newFanSpeed6Service(this.params.shortId).off().payload();
    this.sendPayload(payload);
    this.status.blue().ring().text(`${this.fanName()} off`).update();
    return this;
  }

  async delayAndSetSpeed(delay: Milliseconds): Promise<void> {
    return Promise.resolve().then(async (resp) => {
      if (delay && this.bTurnedOn && this.params.shouldSetSpeed() && !this._stop) {
        return Promise.resolve()
          .then((resp) => {
            ++this.step;
            this.log.debug(`${this.switchId} set-speed delay ${delay} ms`);
            this.status.append(`waiting ${durationUtil(delay).format()}`).update();
            return this.promiseDelay(delay);
          })
          .then((resp) => {
            ++this.step;
            if (this.shutoff) {
              this.log.debug(`${this.fanId} set fan speed aborted because of shutdown`);
              this.status.red().ring().text(`${this.fanName()} shutdown`).update();
            } else if (this._stop) {
              this.log.debug(`${this.fanId} set fan speed aborted because of STOP`);
              this.status.red().ring().text(`${this.fanName()} STOP`).update();
            } else {
              this.log.debug(`${this.fanId} set fan speed to ${this.params.speed}`);
              let payload = newFanSpeed6Service(this.params.shortId).speed(this.params.speed).payload();
              this.sendPayload(payload);
              this.status.blue().dot().text(`${this.fanName()} speed ${this.params.speed}`).update();
            }
            return Promise.resolve();
          });
      }
      return Promise.resolve();
    });
  }
  delayAndOff(delay: Milliseconds): Promise<void> {
    return Promise.resolve()
      .then((resp) => {
        ++this.step;
        this.log.debug(`${this.switchId} off delay ${delay} ms`);
        this.status.append(`waiting ${durationUtil(delay).format()}`).update();
        return this.promiseDelay(delay);
      })
      .then((resp) => {
        ++this.step;
        this.turnOff('timer expired');
      });
  }

  async delaysAndSetSpeed(): Promise<void> {
    const jobs = [];
    for (const delay of this.params.retryDelay) {
      const job = await this.delayAndSetSpeed(delay);
      jobs.push(job);
    }
    return Promise.resolve();
  }

  async run(): Promise<void> {
    // this.log.debug('run');
    this.status.grey().ring().text('Run').update();
    this.log.debug(`Run: ${this.params.toString()}`);
    this.bTurnedOn = false;

    return Promise.resolve()
      .then((resp) => {
        ++this.step;
        this.log.debug(`${this.switchId} is ${this.switch().state()}`);
        this.log.debug(`Shutoff (lightning) is ${this.shutoff}`);
        if (this.switch().isOn()) {
          if (this.params.shouldTurnOff()) {
            this.turnOff('fan was on');
          } else if (this.shutoff) {
            this.turnOff('shutoff is true');
          } else if (this.params.shouldSetSpeed()) {
            this.setSpeed('already on');
          } else {
            this.log.debug(`${this.fanId} is already on`);
          }
        } else {
          // isOff
          if (!this.shutoff && this.params.shouldTurnOn()) {
            this.turnOn('fan was off');
          } else {
            this.log.debug(`${this.fanId} is already off`);
          }
        }
      })
      .then((resp) => {
        // this.log.debug(`params: ${JSON.stringify(this.params.toObject())}`);
        return this.delaysAndSetSpeed();
      })
      .then((resp) => {
        ++this.step;
        if (this.shutoff || this._stop || this.switch().isOff()) {
          return Promise.resolve();
        } else if (this.params.shouldTimeout()) {
          return this.delayAndOff(this.params.timeout);
        } else {
          return Promise.resolve();
        }
      })
      .then((resp) => {
        this.log.debug('Run complete');
        this.status.green().dot().append('done').update();
      })
      .catch((err) => {
        return Promise.reject(err);
      });
  }
}
