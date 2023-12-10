import {
  Entity,
  EntityId,
  HA,
  NodeRedLogFunction,
  ServicePayload,
  newFanSpeed6Service,
  newSwitchService
} from 'epdoc-node-red-hautil';
import { Milliseconds } from 'epdoc-timeutil';
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
        this.node.log(msg);
      };
      this.node.log('debugEnabled = true');
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
    this.log.debug('Init');
    return this;
  }

  isValid(): boolean {
    return Entity.isEntity(this.fan()) && Entity.isEntity(this.switch());
  }

  fan(): Entity {
    return this.ha.entity('fan.' + this.params.shortId);
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
    this.send([null, { payload: payload }]);
    return this;
  }

  protected turnOn(reason: string): this {
    this.log.debug(`[${this.step}] Turn on ${this.switchId} because ${reason}`);
    let payload = newSwitchService(this.switchId).on().payload();
    this.sendPayload(payload);
    this.bTurnedOn = true;
    this.status.green().dot().text(`Turn ${this.fanId} on`).update();
    return this;
  }

  protected setSpeed(reason?: string): this {
    this.log.debug(`[${this.step}] Set ${this.fanId} speed to ${this.params.speed} (${reason})`);
    let payload: ServicePayload = newFanSpeed6Service(this.params.shortId).speed(this.params.speed).payload();
    this.sendPayload(payload);
    this.status.green().dot().text(`Set ${this.fanId} speed to ${this.params.speed}`).update();
    return this;
  }

  protected turnOff(reason: string): this {
    this.log.debug(`[${this.step}] Turn off ${this.fanId} because ${reason}`);
    let payload: ServicePayload = newFanSpeed6Service(this.params.shortId).off().payload();
    this.sendPayload(payload);
    this.status.green().ring().text(`Turn ${this.fanId} off`).update();
    return this;
  }

  delayAndSetSpeed(delay: Milliseconds): Promise<void> {
    return Promise.resolve()
      .then((resp) => {
        ++this.step;
        this.log.debug(`[${this.step}] ${this.switchId} set-speed delay ${delay} ms`);
        this.status.blue().ring().text(`${this.fanId} waiting ...`);
        return this.promiseDelay(delay);
      })
      .then((resp) => {
        ++this.step;
        if (this.shutoff) {
          this.log.debug(`[${this.step}] ${this.fanId} set fan speed aborted because of shutdown`);
          this.status.red().ring().text(`${this.fanId} shutdown`).update();
        } else if (this._stop) {
          this.log.debug(`[${this.step}] ${this.fanId} set fan speed aborted because of STOP`);
          this.status.red().ring().text(`${this.fanId} STOP`).update();
        } else {
          this.log.debug(`[${this.step}] ${this.fanId} set fan speed to ${this.params.speed}`);
          let payload = newFanSpeed6Service(this.params.shortId).speed(this.params.speed).payload();
          this.sendPayload(payload);
          this.status.blue().dot().text(`${this.fanId} speed ${this.params.speed}`).update();
        }
        return Promise.resolve();
      });
  }
  delayAndOff(delay: Milliseconds): Promise<void> {
    return Promise.resolve()
      .then((resp) => {
        ++this.step;
        this.log.debug(`[${this.step}] ${this.switchId} off delay ${delay} ms`);
        this.status.blue().ring().text(`${this.fanId} waiting...`).update();
        return this.promiseDelay(delay);
      })
      .then((resp) => {
        ++this.step;
        this.turnOff('timer expired');
      });
  }

  async run(): Promise<void> {
    this.log.debug('run');
    this.bTurnedOn = false;

    return Promise.resolve()
      .then((resp) => {
        ++this.step;
        this.log.debug(`[${this.step}] ${this.switchId} is ${this.switch().state()}`);
        this.log.debug(`[${this.step}] Shutoff (lightning) is ${this.shutoff}`);
        if (this.switch().isOn()) {
          if (this.params.shouldTurnOff()) {
            this.turnOff('fan was on');
          } else if (this.shutoff) {
            this.turnOff('shutoff is true');
          } else if (this.params.shouldSetSpeed()) {
            this.setSpeed('already on');
          } else {
            this.log.debug(`[${this.step}] ${this.fanId} is already on`);
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
        if (this.params.shouldSetSpeed()) {
          return this.delayAndSetSpeed(this.params.retryDelay[0]);
        }
      })
      .then((resp) => {
        if (this.bTurnedOn && this.params.shouldSetSpeed()) {
          return this.delayAndSetSpeed(this.params.retryDelay[1]);
        }
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
      .catch((err) => {
        return Promise.reject(err);
      });
  }
}
